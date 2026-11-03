#!/bin/sh
set -e

echo "=== [LO TENGO] Iniciando contenedor en Coolify ==="

# Si DATABASE_URL está presente, desplegar migraciones y seed inicial
if [ -n "$DATABASE_URL" ]; then
  echo ">>> Aplicando migraciones de Prisma..."
  npx prisma migrate deploy || echo ">>> Migraciones completadas o no disponibles."

  echo ">>> Verificando usuario administrador y datos iniciales..."
  node prisma/seed.js || echo ">>> Seed finalizado o no requerido."
fi

echo ">>> Iniciando servidor web Next.js en puerto ${PORT:-3000}..."
exec node server.js
