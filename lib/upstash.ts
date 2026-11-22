/** Cliente mínimo de Upstash Redis por REST (sin dependencias). */
export function upstashConfig() {
  // KV_REST_API_*: nombres que carga la integración de Upstash desde Vercel → Storage.
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

export async function upstashPipeline(
  cfg: { url: string; token: string },
  commands: (string | number)[][],
): Promise<unknown[]> {
  const res = await fetch(`${cfg.url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { result?: unknown; error?: string }[];
  const failed = data.find((d) => d.error);
  if (failed) throw new Error(`Upstash: ${failed.error}`);
  return data.map((d) => d.result);
}
