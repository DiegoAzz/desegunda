#!/bin/sh
set -e

echo "=== [LO TENGO] Iniciando contenedor en Coolify ==="

# Si DATABASE_URL está presente, sincronizar esquema y datos iniciales
if [ -n "$DATABASE_URL" ]; then
  echo ">>> Sincronizando esquema de base de datos con Prisma..."
  npx prisma db push --skip-generate || npx prisma migrate deploy || echo ">>> Aviso en base de datos, continuando con almacenamiento híbrido..."

  echo ">>> Verificando usuario administrador y datos iniciales..."
  node prisma/seed.js || echo ">>> Seed completado o no requerido."
fi

echo ">>> Iniciando servidor web Next.js en puerto ${PORT:-3000}..."
exec node server.js
