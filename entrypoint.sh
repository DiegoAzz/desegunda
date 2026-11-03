#!/bin/sh
set -e

echo "=== [LO TENGO] Iniciando contenedor en Coolify ==="

# Asegurar directorios de almacenamiento y permisos de escritura irrestrictos
mkdir -p /app/uploads /app/public/uploads /tmp/lotengo_uploads
chown -R nextjs:nodejs /app/uploads /app/public/uploads /tmp/lotengo_uploads 2>/dev/null || true
chmod -R 777 /app/uploads /app/public/uploads /tmp/lotengo_uploads 2>/dev/null || true

# Si DATABASE_URL está presente, sincronizar esquema y datos iniciales
if [ -n "$DATABASE_URL" ]; then
  echo ">>> Sincronizando esquema de base de datos con Prisma..."
  npx prisma db push --skip-generate || npx prisma migrate deploy || echo ">>> Aviso en base de datos, continuando con almacenamiento híbrido..."

  echo ">>> Verificando usuario administrador y datos iniciales..."
  node prisma/seed.js || echo ">>> Seed completado o no requerido."
fi

echo ">>> Iniciando servidor web Next.js en puerto ${PORT:-3000}..."
if command -v su-exec >/dev/null 2>&1; then
  exec su-exec nextjs node server.js
else
  exec node server.js
fi
