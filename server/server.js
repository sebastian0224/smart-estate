const fs = require("fs");
const net = require("net");
const path = require("path");
const { spawn } = require("child_process");
const express = require("express");
const multer = require("multer");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const { createClerkClient, verifyToken } = require("@clerk/backend");
const { Webhook } = require("standardwebhooks");

dotenv.config({ path: path.join(__dirname, ".env") });
fs.mkdirSync(path.join(__dirname, "uploads"), { recursive: true });

const app = express();
const clerk = process.env.CLERK_SECRET_KEY
  ? createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
  : null;
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: "utf8mb4",
});

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, "uploads"),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      cb(null, Date.now() + "-" + Math.round(Math.random() * 1e6) + ext);
    },
  }),
});

function wrap(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function correo(user) {
  const found = (user.emailAddresses || []).find((item) => item.id === user.primaryEmailAddressId);
  return (found || user.emailAddresses?.[0])?.emailAddress || "";
}

function numero(v) {
  const n = Number(String(v ?? "").replace(/\D/g, ""));
  return Number.isFinite(n) ? n : 0;
}

async function usuario(req) {
  const clerkUser = await clerk.users.getUser(req.userId);
  const email = correo(clerkUser);
  const nombre = ([clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || email || "Usuario").slice(0, 120);
  const rol = clerkUser.publicMetadata?.role === "admin" ? "admin" : "client";
  await db.query(
    `INSERT INTO usuarios (clerk_id, nombre, email, telefono, rol)
     VALUES (?, ?, ?, '', ?)
     ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), email = VALUES(email), rol = VALUES(rol)`,
    [req.userId, nombre, email.slice(0, 160), rol]
  );
  const [rows] = await db.query("SELECT * FROM usuarios WHERE clerk_id = ?", [req.userId]);
  return rows[0];
}

async function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || !clerk) return res.status(401).json({ error: "Inicia sesión" });
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
      authorizedParties: ["http://localhost:3000"],
    });
    req.userId = payload.sub;
    next();
  } catch (err) {
    res.status(401).json({ error: "Sesión inválida" });
  }
}

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.post("/pagos/webhook", express.raw({ type: "application/json" }), wrap(async (req, res) => {
  if (!process.env.POLAR_WEBHOOK_SECRET) return res.status(400).json({ error: "Falta el webhook" });
  let event;
  try {
    event = new Webhook(process.env.POLAR_WEBHOOK_SECRET).verify(req.body.toString(), {
      "webhook-id": req.header("webhook-id"),
      "webhook-timestamp": req.header("webhook-timestamp"),
      "webhook-signature": req.header("webhook-signature"),
    });
  } catch (err) {
    return res.status(400).json({ error: "Firma inválida" });
  }
  const propiedadId = event.data?.metadata?.propiedad_id;
  const type = event.type || "";
  if (!propiedadId) return res.json({ ok: true });
  if (type === "subscription.canceled" || type === "subscription.revoked") {
    await db.query("UPDATE propiedades SET destacado = 0 WHERE id = ?", [propiedadId]);
  } else if (type === "subscription.active" || type === "order.paid" || (type === "checkout.updated" && ["succeeded", "confirmed"].includes(event.data?.status))) {
    await db.query("UPDATE propiedades SET destacado = 1 WHERE id = ?", [propiedadId]);
  }
  res.json({ ok: true });
}));

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/propiedades", wrap(async (req, res) => {
  const where = [];
  const vals = [];
  if (req.query.ciudad) {
    where.push("p.ciudad = ?");
    vals.push(req.query.ciudad);
  }
  if (req.query.precioMin) {
    where.push("p.precio >= ?");
    vals.push(Number(req.query.precioMin));
  }
  if (req.query.precioMax) {
    where.push("p.precio <= ?");
    vals.push(Number(req.query.precioMax));
  }
  if (req.query.areaMin) {
    where.push("p.area >= ?");
    vals.push(Number(req.query.areaMin));
  }
  if (req.query.areaMax) {
    where.push("p.area <= ?");
    vals.push(Number(req.query.areaMax));
  }
  const sql = `SELECT p.id, p.titulo, p.precio, p.area, p.ciudad, p.destacado, u.nombre AS agente,
    (SELECT ruta FROM imagenes i WHERE i.propiedad_id = p.id ORDER BY i.id LIMIT 1) AS foto
    FROM propiedades p JOIN usuarios u ON u.id = p.usuario_id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY p.destacado DESC, p.id DESC`;
  const [rows] = await db.query(sql, vals);
  res.json(rows);
}));

app.get("/propiedades/:id", wrap(async (req, res) => {
  const [rows] = await db.query(
    `SELECT p.id, p.titulo, p.precio, p.area, p.ciudad, p.direccion, p.descripcion, p.destacado,
      u.nombre AS agente, u.telefono, u.email
     FROM propiedades p JOIN usuarios u ON u.id = p.usuario_id WHERE p.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: "No está" });
  const [imagenes] = await db.query("SELECT id, ruta FROM imagenes WHERE propiedad_id = ? ORDER BY id", [req.params.id]);
  res.json({ ...rows[0], imagenes });
}));

app.get("/yo", auth, wrap(async (req, res) => {
  res.json(await usuario(req));
}));

app.get("/mis-propiedades", auth, wrap(async (req, res) => {
  const user = await usuario(req);
  const [rows] = await db.query(
    `SELECT p.*,
      (SELECT ruta FROM imagenes i WHERE i.propiedad_id = p.id ORDER BY i.id LIMIT 1) AS foto,
      (SELECT GROUP_CONCAT(ruta ORDER BY id) FROM imagenes i WHERE i.propiedad_id = p.id) AS fotos
     FROM propiedades p WHERE p.usuario_id = ? ORDER BY p.id DESC`,
    [user.id]
  );
  res.json(rows);
}));

app.post("/rol", auth, wrap(async (req, res) => {
  const rol = req.body.rol === "admin" ? "admin" : "client";
  await clerk.users.updateUser(req.userId, { publicMetadata: { role: rol } });
  const user = await usuario(req);
  if (req.body.telefono != null) {
    const telefono = String(req.body.telefono).slice(0, 40);
    await db.query("UPDATE usuarios SET telefono = ? WHERE id = ?", [telefono, user.id]);
    user.telefono = telefono;
  }
  res.json(user);
}));

app.get("/guardados", auth, wrap(async (req, res) => {
  const user = await usuario(req);
  const [rows] = await db.query(
    `SELECT p.id, p.titulo, p.precio, p.area, p.ciudad, p.destacado,
      (SELECT ruta FROM imagenes i WHERE i.propiedad_id = p.id ORDER BY i.id LIMIT 1) AS foto
     FROM guardados g JOIN propiedades p ON p.id = g.propiedad_id
     WHERE g.usuario_id = ? ORDER BY p.id DESC`,
    [user.id]
  );
  res.json(rows);
}));

app.post("/guardados", auth, wrap(async (req, res) => {
  const user = await usuario(req);
  const id = Number(req.body.propiedad_id);
  if (!id) return res.status(400).json({ error: "Falta la casa" });
  const [rows] = await db.query("SELECT 1 FROM guardados WHERE usuario_id = ? AND propiedad_id = ?", [user.id, id]);
  if (rows.length) {
    await db.query("DELETE FROM guardados WHERE usuario_id = ? AND propiedad_id = ?", [user.id, id]);
    return res.json({ guardado: false });
  }
  await db.query("INSERT INTO guardados (usuario_id, propiedad_id) VALUES (?, ?)", [user.id, id]);
  res.json({ guardado: true });
}));

app.post("/propiedades", auth, upload.array("fotos", 4), wrap(async (req, res) => {
  const user = await usuario(req);
  if (user.rol !== "admin") {
    for (const file of req.files || []) fs.unlink(file.path, () => {});
    return res.status(403).json({ error: "Solo el dueño" });
  }
  const { titulo, precio, area, ciudad, direccion, descripcion } = req.body;
  const precioN = numero(precio);
  const areaN = numero(area);
  if (!titulo || !precioN || !areaN || !ciudad || !String(descripcion || "").trim() || !req.files?.length) {
    for (const file of req.files || []) fs.unlink(file.path, () => {});
    return res.status(400).json({ error: "Faltan datos o la foto" });
  }
  if (req.files.length > 4) {
    for (const file of req.files) fs.unlink(file.path, () => {});
    return res.status(400).json({ error: "Máximo 4 fotos por publicación" });
  }
  const [result] = await db.query(
    "INSERT INTO propiedades (usuario_id, titulo, precio, area, ciudad, direccion, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [user.id, String(titulo).slice(0, 160), precioN, areaN, String(ciudad).slice(0, 80), String(direccion || "").slice(0, 180), descripcion || ""]
  );
  for (const file of req.files) {
    await db.query("INSERT INTO imagenes (propiedad_id, ruta) VALUES (?, ?)", [result.insertId, file.filename]);
  }
  res.json({ id: result.insertId });
}));

app.put("/propiedades/:id", auth, upload.array("fotos", 4), wrap(async (req, res) => {
  const user = await usuario(req);
  const [rows] = await db.query("SELECT id FROM propiedades WHERE id = ? AND usuario_id = ?", [req.params.id, user.id]);
  if (user.rol !== "admin" || !rows.length) {
    for (const file of req.files || []) fs.unlink(file.path, () => {});
    return res.status(404).json({ error: "No está" });
  }
  const { titulo, precio, area, ciudad, direccion, descripcion } = req.body;
  const [cuantas] = await db.query("SELECT COUNT(*) AS n FROM imagenes WHERE propiedad_id = ?", [req.params.id]);
  if (cuantas[0].n + (req.files || []).length > 4) {
    for (const file of req.files || []) fs.unlink(file.path, () => {});
    return res.status(400).json({ error: "Máximo 4 fotos por publicación" });
  }
  await db.query(
    "UPDATE propiedades SET titulo = ?, precio = ?, area = ?, ciudad = ?, direccion = ?, descripcion = ? WHERE id = ?",
    [String(titulo || "").slice(0, 160), numero(precio), numero(area), String(ciudad || "").slice(0, 80), String(direccion || "").slice(0, 180), descripcion || "", req.params.id]
  );
  for (const file of req.files || []) {
    await db.query("INSERT INTO imagenes (propiedad_id, ruta) VALUES (?, ?)", [req.params.id, file.filename]);
  }
  res.json({ ok: true });
}));

app.delete("/propiedades/:id", auth, wrap(async (req, res) => {
  const user = await usuario(req);
  const [rows] = await db.query("SELECT id FROM propiedades WHERE id = ? AND usuario_id = ?", [req.params.id, user.id]);
  if (!rows.length) return res.status(404).json({ error: "No está" });
  const [imgs] = await db.query("SELECT ruta FROM imagenes WHERE propiedad_id = ?", [req.params.id]);
  await db.query("DELETE FROM propiedades WHERE id = ?", [req.params.id]);
  for (const img of imgs) {
    if (!/^[1-8]\.jpg$/.test(img.ruta)) fs.unlink(path.join(__dirname, "uploads", img.ruta), () => {});
  }
  res.json({ ok: true });
}));

async function polar(pathname, options) {
  const hosts = [process.env.POLAR_API || "https://api.polar.sh/v1"];
  if (!hosts[0].includes("sandbox")) hosts.push("https://sandbox-api.polar.sh/v1");
  let last = { ok: false, data: {} };
  for (const host of hosts) {
    const r = await fetch(host + pathname, {
      ...options,
      headers: {
        Authorization: "Bearer " + (process.env.POLAR_ACCESS_TOKEN || "").trim(),
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });
    const data = await r.json().catch(() => ({}));
    last = { ok: r.ok, data };
    if (r.ok || r.status !== 401) return last;
  }
  return last;
}

function pagoError(data) {
  const msg = data.detail?.[0]?.msg || data.error_description || "";
  if (data.error === "invalid_token") return "La clave de Polar no corresponde a esta cuenta";
  if (/does not exist/i.test(msg)) return "El producto de Polar no está en esta cuenta";
  return "No se pudo abrir el pago";
}

app.post("/pagos/checkout", auth, wrap(async (req, res) => {
  if (!process.env.POLAR_ACCESS_TOKEN || !process.env.POLAR_PRODUCT_ID) {
    return res.status(400).json({ error: "Falta configurar Polar" });
  }
  const user = await usuario(req);
  if (user.rol !== "admin") return res.status(403).json({ error: "Solo el dueño" });
  const [rows] = await db.query("SELECT id FROM propiedades WHERE id = ? AND usuario_id = ?", [req.body.propiedad_id, user.id]);
  if (!rows.length) return res.status(404).json({ error: "No está" });
  const { ok, data } = await polar("/checkouts/", {
    method: "POST",
    body: JSON.stringify({
      products: [process.env.POLAR_PRODUCT_ID],
      success_url: "http://localhost:3000/perfil?checkout_id={CHECKOUT_ID}",
      return_url: "http://localhost:3000/perfil",
      metadata: { propiedad_id: String(req.body.propiedad_id) },
    }),
  });
  if (!ok || !data.url) return res.status(400).json({ error: pagoError(data) });
  res.json({ url: data.url });
}));

app.post("/pagos/confirmar", auth, wrap(async (req, res) => {
  const user = await usuario(req);
  const { ok, data } = await polar("/checkouts/" + req.body.checkout_id);
  const propiedadId = data.metadata?.propiedad_id;
  if (!ok || !["succeeded", "confirmed"].includes(data.status)) {
    return res.status(400).json({ error: "El pago no está listo" });
  }
  const [rows] = await db.query("SELECT id FROM propiedades WHERE id = ? AND usuario_id = ?", [propiedadId, user.id]);
  if (!rows.length) return res.status(403).json({ error: "No es tuyo" });
  await db.query("UPDATE propiedades SET destacado = 1 WHERE id = ?", [propiedadId]);
  res.json({ ok: true });
}));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Error del servidor" });
});

function puerto(port) {
  return new Promise((resolve) => {
    const s = net.connect({ port, host: "127.0.0.1" });
    s.on("connect", () => { s.end(); resolve(true); });
    s.on("error", () => resolve(false));
  });
}

async function asegurarMysql() {
  if (await puerto(3306)) return;
  const base = path.join(process.env.HOME, ".local/mysql-root/usr");
  const bin = path.join(base, "sbin/mysqld");
  if (!fs.existsSync(bin)) return;
  const child = spawn(bin, [
    "--datadir=" + path.join(__dirname, "data"),
    "--basedir=" + base,
    "--lc-messages-dir=" + path.join(base, "share/mysql"),
    "--plugin-dir=" + path.join(base, "lib/mysql/plugin"),
    "--socket=/tmp/smart-estate.sock",
    "--port=3306",
    "--bind-address=127.0.0.1",
    "--mysqlx=0",
    "--pid-file=/tmp/smart-estate.pid",
    "--secure-file-priv=" + path.join(process.env.HOME, ".local/mysql-root/files"),
    "--log-error=" + path.join(process.env.HOME, ".local/mysql-root/server.err"),
  ], {
    detached: true,
    stdio: "ignore",
    env: { ...process.env, LD_LIBRARY_PATH: path.join(process.env.HOME, ".local/mysql-root/usr/lib/x86_64-linux-gnu") },
  });
  child.unref();
  for (let i = 0; i < 40; i++) {
    if (await puerto(3306)) return;
    await new Promise((r) => setTimeout(r, 250));
  }
}

asegurarMysql().then(() => {
  const server = app.listen(process.env.PORT || 4000, () => {
    console.log("http://localhost:" + (process.env.PORT || 4000));
  });
  server.on("error", (err) => {
    console.log(err.code === "EADDRINUSE" ? "El puerto 4000 ya está en uso" : err.message);
    process.exit(1);
  });
});
