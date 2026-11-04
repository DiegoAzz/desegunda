import { NextRequest, NextResponse } from 'next/server';
import { getSession, removeLocalAdminUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const targetId = params.id;
    const defaultMasterEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@lotengo.local').toLowerCase();

    // No permitir eliminar la cuenta actualmente en uso
    if (session.userId === targetId || session.email.toLowerCase() === targetId.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'No puedes eliminar tu propia cuenta en uso actual' },
        { status: 400 }
      );
    }

    // No permitir eliminar el usuario maestro
    if (targetId === 'admin-master' || targetId.toLowerCase() === defaultMasterEmail) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar el usuario administrador principal' },
        { status: 400 }
      );
    }

    // 1. Eliminar de PostgreSQL
    try {
      await prisma.adminUser.deleteMany({
        where: {
          OR: [{ id: targetId }, { email: targetId }],
        },
      });
    } catch (err) {
      console.warn('Aviso eliminando de BD:', err);
    }

    // 2. Eliminar de archivo local
    removeLocalAdminUser(targetId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return NextResponse.json({ success: false, error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
