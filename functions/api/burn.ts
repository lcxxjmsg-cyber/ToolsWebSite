interface BurnBody {
  ciphertext: string;
  iv: string;
  salt?: string;
  expiresIn?: number; // seconds
}

interface Env {
  BURN_KV: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method === 'POST') {
    const body: BurnBody = await request.json();

    if (!body.ciphertext || !body.iv) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    if (body.ciphertext.length > 4096) {
      return new Response(JSON.stringify({ error: 'Ciphertext too large' }), { status: 413 });
    }

    const messageId = crypto.randomUUID();
    const ttl = body.expiresIn && body.expiresIn > 0 ? body.expiresIn : undefined;

    await env.BURN_KV.put(messageId, JSON.stringify({
      ciphertext: body.ciphertext,
      iv: body.iv,
      salt: body.salt || null,
    }), { expirationTtl: ttl });

    return new Response(JSON.stringify({ id: messageId }), {
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });
  }

  if (request.method === 'GET') {
    if (!id || id === 'burn') {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }

    const data = await env.BURN_KV.get(id);
    if (!data) {
      return new Response(JSON.stringify({ error: 'Message not found or already read' }), { status: 404 });
    }

    await env.BURN_KV.delete(id);

    return new Response(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
};
