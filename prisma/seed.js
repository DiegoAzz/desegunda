const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Seed de LO TENGO ---');

  // 1. Crear o actualizar StoreSettings
  const settings = await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      storeName: 'LO TENGO',
      tagline: 'Cosas buenas para alguien más.',
      whatsappNumber: '573137751715',
      defaultDeliveryArea: 'Bogotá, Colombia',
    },
  });
  console.log('✔ StoreSettings creado/verificado:', settings.storeName);

  // 2. Crear o actualizar AdminUser
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@lotengo.local';
  const rawPassword = process.env.INITIAL_ADMIN_PASSWORD || 'admin123456';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const admin = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: {
      email: adminEmail,
      passwordHash,
    },
  });
  console.log('✔ AdminUser creado/verificado:', admin.email);

  // 3. Purgar productos de demostración iniciales para dejar la tienda limpia
  const demoSlugs = [
    'audifonos-bluetooth-soundcore-a20-x89k2',
    'monitor-dell-24-pulgadas-ips-hdmi-m391z',
    'licuadora-oster-clasica-motor-100-l823a',
    'coleccion-enciclopedia-y-novelas-g190d',
  ];

  try {
    await prisma.productImage.deleteMany({
      where: {
        product: { slug: { in: demoSlugs } },
      },
    });
    const deleted = await prisma.product.deleteMany({
      where: {
        slug: { in: demoSlugs },
      },
    });
    if (deleted.count > 0) {
      console.log(`✔ Purgados ${deleted.count} productos de demostración de la base de datos.`);
    }
  } catch (err) {
    console.warn('Aviso purgando productos demo:', err?.message || err);
  }

  console.log('--- Seed completado con éxito ---');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
