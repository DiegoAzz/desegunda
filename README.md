# LO TENGO — Tienda Web Personal (MVP 1.0)

> *«Mira lo que tengo. Si te interesa, escríbeme».*

«LO TENGO» es una tienda web personal, minimalista, rápida y pensada **móvil-primero**, diseñada para vender artículos nuevos, artículos usados de segunda mano y regalar/donar artículos directamente sin intermediarios, pasarelas de pago, registros ni comisiones.

- **Repositorio:** `https://github.com/DiegoAzz/desegunda.git`
- **Dominio de Despliegue:** `https://desegunda.appzplay.online`
- **WhatsApp de Contacto:** `+57 313 775 1715` (normalizado a `573137751715`)

---

## 🎯 Prioridades y Reglas del Negocio (PRD)

1. **Simplicidad Radical:** 3 botones gigantes en inicio: **«NUEVOS»**, **«USADOS»** y **«GRATIS»**. Fotos grandes y textos directos.
2. **Único Vendedor:** Solo el propietario publica desde `/admin`. Los compradores no crean cuentas.
3. **Contacto Directo por WhatsApp:** Todo el contacto de compra, oferta o solicitud de regalo se realiza vía WhatsApp al número **`+57 313 775 1715`** (normalizado a `573137751715` en enlaces `wa.me`).
4. **Regalos 100 % Gratuitos:** Sin precios ni cobros ocultos. El propietario asigna manualmente a quién entregarlos.
5. **Transparencia en Artículos Usados:** Si un artículo usado tiene detalles o está dañado, la falla se resalta obligatoriamente con el distintivo **`⚠️ DAÑADO`** antes de contactar.
6. **Sin Funciones Innecesarias:** Sin carrito de compras, sin pasarelas de pago, sin algoritmos de IA ni registro de terceros.
7. **Persistencia en VPS:** Preparado para correr en Docker con Coolify, persistiendo tanto la base de datos PostgreSQL como las fotografías en volúmenes dedicados.

---

## 🐳 Despliegue en Coolify (Paso a Paso)

### Paso 1: Crear nuevo recurso en Coolify
1. En tu servidor Coolify, ve a tu proyecto y pulsa **+ New Resource** → **Public Repository** (o Private Repository con tu clave de GitHub).
2. URL del Repositorio: `https://github.com/DiegoAzz/desegunda.git`
3. Rama: `main` (o `master`)
4. Build Pack: Selecciona **Dockerfile** (o Docker Compose si prefieres desplegar Postgres en el mismo stack).

### Paso 2: Configurar Variables de Entorno en Coolify
En la pestaña **Environment Variables** de tu aplicación en Coolify, añade:

| Variable | Valor de Ejemplo | Descripción |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://lotengo:PASSWORD@postgres:5432/lotengo?schema=public` | Conexión a Postgres |
| `AUTH_SECRET` | `openssl rand -hex 32` | Clave secreta JWT para la sesión admin |
| `NEXT_PUBLIC_SITE_URL` | `https://desegunda.appzplay.online` | Dominio público del sitio |
| `UPLOAD_DIR` | `/app/uploads` | Ruta de almacenamiento de fotos |
| `INITIAL_ADMIN_EMAIL` | `admin@desegunda.appzplay.online` | Correo del administrador |
| `INITIAL_ADMIN_PASSWORD` | `TuContrasenaSegura2026!` | Contraseña inicial |
| `PORT` | `3000` | Puerto interno |

### Paso 3: Configurar el Dominio y el Volumen Persistente
1. En la pestaña **General** de Coolify, asigna en **FQDN / Domains**:
   `https://desegunda.appzplay.online`
   Coolify solicitará automáticamente el certificado SSL (HTTPS) con Let's Encrypt.
2. En la pestaña **Storages** (o Persistent Storage) de la aplicación en Coolify, añade un volumen persistente:
   - **Destination path:** `/app/uploads`
   - **Name:** `lotengo-uploads`
   *(Esto asegura que las fotos que subas desde `/admin` no se borren al reiniciar o actualizar el contenedor).*

### Paso 4: Desplegar
Pulsa **Deploy**.
El contenedor ejecutará automáticamente:
1. `npx prisma migrate deploy` (creación de tablas).
2. `node prisma/seed.js` (inicialización de usuario admin y ajustes).
3. `node server.js` (inicio de Next.js en puerto 3000).

Accede a:
- Tienda pública: `https://desegunda.appzplay.online`
- Panel de administración: `https://desegunda.appzplay.online/admin`

---

## 💻 Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Generar cliente Prisma
npx prisma generate

# 3. Ejecutar pruebas automatizadas
npm test

# 4. Iniciar servidor local
npm run dev
```

Visita `http://localhost:3000` para la tienda pública y `http://localhost:3000/admin` para el panel.
