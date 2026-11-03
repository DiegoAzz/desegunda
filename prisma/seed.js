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

  // 3. Crear productos de prueba
  const sampleProducts = [
    {
      title: 'Audífonos Bluetooth Soundcore Nuevos Sellados',
      slug: 'audifonos-bluetooth-soundcore-a20-x89k2',
      description: 'Completamente nuevos en caja sellada con precinto de fábrica. Cancelación activa de ruido y estuche de carga USB-C.',
      type: 'NEW',
      category: 'Tecnología',
      condition: null,
      damageDetails: null,
      priceCop: 145000,
      acceptsOffers: true,
      status: 'AVAILABLE',
      deliveryArea: 'Bogotá (Chapinero o envíos contraentrega)',
      image: '/placeholder.svg',
    },
    {
      title: 'Monitor Dell 24" IPS Full HD HDMI',
      slug: 'monitor-dell-24-pulgadas-ips-hdmi-m391z',
      description: 'Monitor de 24 pulgadas ideal para oficina o trabajo remoto. Panel IPS con colores nítidos. Incluye cable de poder y cable HDMI original.',
      type: 'USED',
      category: 'Tecnología',
      condition: 'GOOD',
      damageDetails: null,
      priceCop: 320000,
      acceptsOffers: true,
      status: 'AVAILABLE',
      deliveryArea: 'Bogotá (Zona Norte)',
      image: '/placeholder.svg',
    },
    {
      title: 'Licuadora Oster Clásica Cromada (Motor 100%)',
      slug: 'licuadora-oster-clasica-motor-100-l823a',
      description: 'Motor potente funcionando a la perfección en todas sus velocidades.',
      type: 'USED',
      category: 'Electrodomésticos',
      condition: 'DAMAGED',
      damageDetails: 'El vaso de vidrio original tiene una fisura en la base y gotea. Se debe reemplazar el vaso de vidrio o acople. El motor y la cuchilla están perfectos.',
      priceCop: 50000,
      acceptsOffers: false,
      status: 'AVAILABLE',
      deliveryArea: 'Bogotá (Recoger cerca a Unicentro)',
      image: '/placeholder.svg',
    },
    {
      title: 'Lote de 6 Libros y Novelas Variadas',
      slug: 'coleccion-enciclopedia-y-novelas-g190d',
      description: 'Novelas de literatura latinoamericana y libros de divulgación en buen estado de conservación. Completamente gratis para quien los quiera leer y aprovechar.',
      type: 'GIFT',
      category: 'Otros',
      condition: null,
      damageDetails: null,
      priceCop: null,
      acceptsOffers: false,
      status: 'AVAILABLE',
      deliveryArea: 'Bogotá (Recoger en portería Chapinero)',
      image: '/placeholder.svg',
    },
  ];

  for (const p of sampleProducts) {
    const { image, ...productData } = p;
    const created = await prisma.product.upsert({
      where: { slug: p.slug },
      update: productData,
      create: productData,
    });

    // Crear imagen de placeholder asociada si no existe
    const existingImg = await prisma.productImage.findFirst({
      where: { productId: created.id },
    });
    if (!existingImg) {
      await prisma.productImage.create({
        data: {
          productId: created.id,
          storagePath: image,
          sortOrder: 0,
          altText: p.title,
        },
      });
    }
  }

  console.log(`✔ ${sampleProducts.length} productos sembrados correctamente.`);
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
