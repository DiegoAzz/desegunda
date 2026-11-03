import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'lotengo_super_secret_jwt_key_at_least_32_chars_long'
);

const COOKIE_NAME = 'lotengo_admin_token';

export async function createSession(userId: string, email: string) {
  const token = await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });

  return token;
}

export async function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function verifyAdminCredentials(email: string, passwordPlain: string) {
  try {
    const admin = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (admin) {
      const isValid = await bcrypt.compare(passwordPlain, admin.passwordHash);
      if (isValid) {
        return admin;
      }
    }
  } catch (err) {
    console.error('Error verificando admin en BD:', err);
  }

  // Fallback para desarrollo o primer inicio si la BD aún no está disponible
  const envEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@lotengo.local';
  const envPassword = process.env.INITIAL_ADMIN_PASSWORD || 'AdminSeguro2026!';

  if (email.toLowerCase() === envEmail.toLowerCase() && passwordPlain === envPassword) {
    return {
      id: 'env-admin-fallback',
      email: envEmail,
    };
  }

  return null;
}
