export default function Contacto() {
  return (
    <main className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-8 sm:px-6 md:grid-cols-2">
      <img src="http://localhost:4000/uploads/13.jpg" alt="" className="h-64 w-full rounded-3xl object-cover md:h-[28rem]" />
      <div>
        <h1 className="text-4xl">Contacto</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-zinc-600">Escríbenos si quieres publicar un inmueble o preguntar por uno que viste en el listado.</p>
        <div className="mt-8 grid gap-5 text-sm">
          <p><span className="block text-zinc-500">Correo</span>hola@smartestate.co</p>
          <p><span className="block text-zinc-500">Teléfono</span>300 555 0100</p>
          <p><span className="block text-zinc-500">Ciudad</span>Bogotá, Colombia</p>
        </div>
      </div>
    </main>
  );
}
