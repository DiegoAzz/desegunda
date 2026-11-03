import crypto from 'crypto';

export interface WompiCheckoutParams {
  publicKey: string;
  currency: 'COP';
  amountInCents: number;
  reference: string;
  signature: string;
  redirectUrl: string;
}

/**
 * Calcula la firma de integridad requerida por Wompi (SHA-256)
 * Cadena: {reference}{amount_in_cents}{currency}{integrity_secret}
 */
export function generateWompiSignature(
  reference: string,
  amountInCents: number,
  currency: string = 'COP',
  integritySecret: string = process.env.WOMPI_INTEGRITY_SECRET || ''
): string {
  const rawString = `${reference}${amountInCents}${currency}${integritySecret}`;
  return crypto.createHash('sha256').update(rawString).digest('hex');
}

/**
 * Genera una referencia única para la transacción
 * Formato: LT-{slugOId}-{timestamp}
 */
export function createWompiReference(productId: string): string {
  const timestamp = Date.now();
  const cleanId = productId.replace(/[^a-zA-Z0-9]/g, '').slice(-8);
  return `LT-${cleanId}-${timestamp}`;
}

/**
 * Extrae el identificador o busca la transacción asociada
 */
export function verifyWompiEventChecksum(
  properties: any,
  checksumReceived: string,
  timestamp: string | number,
  eventsSecret: string = process.env.WOMPI_EVENTS_SECRET || ''
): boolean {
  try {
    // Wompi concatena los valores de las propiedades especificadas en la firma de eventos
    // o calcula SHA256 sobre transaction.id + status + amount_in_cents + timestamp + secret
    const transaction = properties?.transaction;
    if (!transaction) return false;

    const raw = `${transaction.id}${transaction.status}${transaction.amount_in_cents}${timestamp}${eventsSecret}`;
    const calculated = crypto.createHash('sha256').update(raw).digest('hex');

    return calculated === checksumReceived;
  } catch {
    return false;
  }
}
