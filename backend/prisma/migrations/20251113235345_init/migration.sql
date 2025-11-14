-- CreateTable
CREATE TABLE "usuarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "negocios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "nota_extra" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "trabajos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "negocio_id" INTEGER NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precio_estimado" REAL,
    "estado_actual" TEXT NOT NULL,
    "fecha_creacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_finalizacion" DATETIME,
    CONSTRAINT "trabajos_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "trabajos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "historial_estados" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trabajo_id" INTEGER NOT NULL,
    "estado" TEXT NOT NULL,
    "fecha_hora" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" INTEGER NOT NULL,
    CONSTRAINT "historial_estados_trabajo_id_fkey" FOREIGN KEY ("trabajo_id") REFERENCES "trabajos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "historial_estados_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_username_key" ON "usuarios"("username");

-- CreateIndex
CREATE UNIQUE INDEX "negocios_nombre_key" ON "negocios"("nombre");
