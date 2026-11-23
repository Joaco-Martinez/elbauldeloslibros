import { promises as fs } from 'node:fs';
import path from 'node:path';
import { upstashConfig, upstashPipeline } from '@/lib/upstash';

/**
 * Comprobantes de transferencia que suben los clientes (foto o PDF).
 * - Producción: Upstash, clave "comprobante:<pedido>" (se borra sola a los 120 días).
 * - En la compu: .data/comprobantes/<pedido>.json
 */
export interface Receipt {
  mime: string;
  /** Nombre original del archivo (para descargarlo con su nombre). */
  name: string;
  /** Archivo en base64. */
  data: string;
  uploadedAt: string;
}

const KEEP_SECONDS = 120 * 24 * 3600;
const cfg = upstashConfig();
const fileOf = (orderId: string) =>
  path.join(process.cwd(), '.data', 'comprobantes', `${orderId.replace(/[^A-Za-z0-9-]/g, '')}.json`);

export async function saveReceipt(orderId: string, receipt: Receipt) {
  if (cfg) {
    await upstashPipeline(cfg, [['SET', `comprobante:${orderId}`, JSON.stringify(receipt), 'EX', KEEP_SECONDS]]);
    return;
  }
  const file = fileOf(orderId);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(receipt), 'utf8');
}

export async function getReceipt(orderId: string): Promise<Receipt | null> {
  if (cfg) {
    const [raw] = await upstashPipeline(cfg, [['GET', `comprobante:${orderId}`]]);
    return typeof raw === 'string' ? (JSON.parse(raw) as Receipt) : null;
  }
  try {
    return JSON.parse(await fs.readFile(fileOf(orderId), 'utf8')) as Receipt;
  } catch {
    return null;
  }
}
