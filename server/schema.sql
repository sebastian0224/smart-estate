CREATE DATABASE IF NOT EXISTS smart_estate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_estate;

DROP TABLE IF EXISTS guardados;
DROP TABLE IF EXISTS imagenes;
DROP TABLE IF EXISTS propiedades;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clerk_id VARCHAR(255) UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  telefono VARCHAR(40) DEFAULT '',
  rol ENUM('admin', 'client') NOT NULL DEFAULT 'client'
);

CREATE TABLE propiedades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  titulo VARCHAR(160) NOT NULL,
  precio BIGINT NOT NULL,
  area INT NOT NULL,
  ciudad VARCHAR(80) NOT NULL,
  direccion VARCHAR(180) NOT NULL,
  descripcion TEXT NOT NULL,
  destacado TINYINT NOT NULL DEFAULT 0,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE imagenes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  propiedad_id INT NOT NULL,
  ruta VARCHAR(255) NOT NULL,
  FOREIGN KEY (propiedad_id) REFERENCES propiedades(id) ON DELETE CASCADE
);

CREATE TABLE guardados (
  usuario_id INT NOT NULL,
  propiedad_id INT NOT NULL,
  PRIMARY KEY (usuario_id, propiedad_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (propiedad_id) REFERENCES propiedades(id) ON DELETE CASCADE
);

INSERT INTO usuarios (clerk_id, nombre, email, telefono, rol) VALUES
('seed', 'Ana Ruiz', 'ana@andina.co', '3005550199', 'admin');

INSERT INTO propiedades (usuario_id, titulo, precio, area, ciudad, direccion, descripcion, destacado) VALUES
(1, 'Apartamento en Chapinero', 420000000, 78, 'Bogotá', 'Cra 13 # 58-20', 'Sala, dos alcobas y balcón. Cerca del parque de la 93.', 0),
(1, 'Casa en El Poblado', 890000000, 180, 'Medellín', 'Cll 10 # 36-12', 'Casa de dos pisos con patio. Zona tranquila.', 0),
(1, 'Apartamento en Granada', 310000000, 65, 'Cali', 'Av 9N # 15-40', 'Una alcoba y estudio. Buena luz.', 0),
(1, 'Apartamento en Alto Prado', 380000000, 92, 'Barranquilla', 'Cra 54 # 76-30', 'Tres alcobas, piso alto.', 0),
(1, 'Apartamento en Bocagrande', 1200000000, 140, 'Cartagena', 'Cra 2 # 8-15', 'Vista al mar, dos alcobas.', 0),
(1, 'Apartamento en Cabecera', 275000000, 70, 'Bucaramanga', 'Cll 36 # 31-20', 'Cerca del parque, una alcoba.', 0),
(1, 'Casa en Álamos', 340000000, 120, 'Pereira', 'Cra 18 # 14-55', 'Casa con jardín pequeño.', 0),
(1, 'Apartamento en El Rodadero', 450000000, 85, 'Santa Marta', 'Cll 6 # 4-22', 'A dos cuadras de la playa.', 0),
(1, 'Apartamento en Usaquén', 560000000, 95, 'Bogotá', 'Cra 7 # 120-14', 'Tres alcobas y balcón. Cerca del parque.', 0),
(1, 'Casa en Laureles', 410000000, 88, 'Medellín', 'Cll 35 # 75-18', 'Casa de un piso con patio interior.', 0),
(1, 'Apartamento en San Antonio', 290000000, 72, 'Cali', 'Cra 6 # 4-22', 'Dos alcobas y buena luz.', 0),
(1, 'Casa en El Prado', 470000000, 110, 'Barranquilla', 'Cra 58 # 70-15', 'Porche amplio y tres alcobas.', 0),
(1, 'Apartamento en Getsemaní', 680000000, 75, 'Cartagena', 'Cll 30 # 10-8', 'Balcón de madera, una alcoba.', 0),
(1, 'Casa en Cañaveral', 320000000, 80, 'Bucaramanga', 'Cll 55 # 20-30', 'Casa con jardín al frente.', 0),
(1, 'Casa en Pinares', 390000000, 100, 'Pereira', 'Cra 14 # 8-40', 'Ventanales y vista a los cerros.', 0);

INSERT INTO imagenes (propiedad_id, ruta) VALUES
(1, '1.jpg'),
(2, '2.jpg'),
(3, '3.jpg'),
(4, '4.jpg'),
(5, '5.jpg'),
(6, '6.jpg'),
(7, '7.jpg'),
(8, '8.jpg'),
(9, '9.jpg'),
(10, '10.jpg'),
(11, '11.jpg'),
(12, '12.jpg'),
(13, '13.jpg'),
(14, '14.jpg'),
(15, '15.jpg');
