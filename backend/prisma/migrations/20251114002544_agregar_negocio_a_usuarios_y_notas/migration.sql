-- AlterTable
ALTER TABLE "historial_estados" ADD COLUMN "nota" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_usuarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "negocio_id" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usuarios_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_usuarios" ("activo", "creado_en", "id", "nombre", "password_hash", "rol", "username") SELECT "activo", "creado_en", "id", "nombre", "password_hash", "rol", "username" FROM "usuarios";
DROP TABLE "usuarios";
ALTER TABLE "new_usuarios" RENAME TO "usuarios";
CREATE UNIQUE INDEX "usuarios_username_key" ON "usuarios"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
