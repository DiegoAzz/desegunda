import { NextRequest, NextResponse } from 'next/server';
import { getSession, loadLocalAdminUsers, saveLocalAdminUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    // 1. Obtener usuarios de PostgreSQL
    let dbUsers: any[] = [];
    try {
      dbUsers = await prisma.adminUser.findMany({
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      console.warn('Aviso leyendo usuarios de BD:', err);
    }

    // 2. Obtener usuarios locales resilientes
    const localUsers = loadLocalAdminUsers().map((u) => ({
      id: u.id,
      email: u.email,
      createdAt: u.createdAt || new Date().toISOString(),
    }));

    // 3. Combinar sin duplicados por email
    const usersMap = new Map<string, any>();
    for (const u of dbUsers) {
      usersMap.set(u.email.toLowerCase(), u);
    }
    for (const u of localUsers) {
      if (!usersMap.has(u.email.toLowerCase())) {
        usersMap.set(u.email.toLowerCase(), u);
      }
    }

    const defaultMasterEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@lotengo.local').toLowerCase();
    if (!usersMap.has(defaultMasterEmail)) {
      usersMap.set(defaultMasterEmail, {
        id: 'admin-master',
        email: defaultMasterEmail,
        createdAt: '2026-11-01T00:00:00.000Z',
        isMaster: true,
      });
    }

    const usersList = Array.from(usersMap.values()).map((u) => ({
      ...u,
      isMaster: u.id === 'admin-master' || u.email.toLowerCase() === defaultMasterEmail,
    }));

    return NextResponse.json({ success: true, users: usersList });
  } catch (error) {
    console.error('Error listando usuarios:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { email, password } = body;

    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPassword = (password || '').trim();

    // Validaciones
    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Ingresa un correo electrónico válido' },
        { status: 400 }
      );
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar si ya existe en PostgreSQL
    try {
      const existingInDb = await prisma.adminUser.findUnique({
        where: { email: cleanEmail },
      });
      if (existingInDb) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un usuario con este correo electrónico' },
          { status: 400 }
        );
      }
    } catch {}

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(cleanPassword, 10);
    const userId = `usr-${Date.now()}`;

    // 1. Guardar en PostgreSQL
    let createdInDb = false;
    try {
      await prisma.adminUser.create({
        data: {
          id: userId,
          email: cleanEmail,
          passwordHash,
        },
      });
      createdInDb = true;
    } catch (err) {
      console.warn('PostgreSQL no disponible o error al insertar usuario, guardando en respaldo local:', err);
    }

    // 2. Guardar en archivo local resiliente
    saveLocalAdminUser({
      id: userId,
      email: cleanEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: cleanEmail,
        createdAt: new Date().toISOString(),
      },
      savedInDb: createdInDb,
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    return NextResponse.json({ success: false, error: 'Error al crear el usuario' }, { status: 500 });
  }
}
