const ROOM_TTL_MAX = 604800; // 7 days
const MAX_MESSAGES = 200;
const MSG_PAYLOAD_LIMIT = 4096;

interface RoomData {
  createdAt: number;
  ttl: number;
  maxMessages: number;
  messages: Message[];
}

interface Message {
  id: string;
  ciphertext: string;
  iv: string;
  timestamp: number;
}

interface Env {
  CHAT_KV: KVNamespace;
}

function roomKey(id: string): string {
  return `chat:room:${id}`;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  // pathParts = ['api', 'chat', 'room', ...rest]
  if (pathParts.length < 4) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }

  const rest = pathParts.slice(3);
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // POST /api/chat/room — create room
  if (request.method === 'POST' && rest.length === 1 && rest[0] === 'room') {
    let body: { expiresIn?: number; maxMessages?: number };
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const roomId = crypto.randomUUID();
    const ttl = body.expiresIn && body.expiresIn > 0
      ? Math.min(body.expiresIn, ROOM_TTL_MAX)
      : ROOM_TTL_MAX;

    const room: RoomData = {
      createdAt: Date.now(),
      ttl,
      maxMessages: Math.min(body.maxMessages || MAX_MESSAGES, MAX_MESSAGES),
      messages: [],
    };

    await env.CHAT_KV.put(roomKey(roomId), JSON.stringify(room), { expirationTtl: ttl });

    return new Response(JSON.stringify({ id: roomId, createdAt: room.createdAt, ttl }), {
      headers: { ...headers },
    });
  }

  if (rest.length < 2) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }

  const roomId = rest[0];
  const action = rest[1];
  const kvKey = roomKey(roomId);

  // DELETE /api/chat/room/:id
  if (request.method === 'DELETE' && rest.length === 2) {
    await env.CHAT_KV.delete(kvKey);
    return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  // GET /api/chat/room/:id — get room info + messages
  if (request.method === 'GET' && rest.length === 2) {
    const raw = await env.CHAT_KV.get(kvKey);
    if (!raw) {
      return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404, headers: { ...headers } });
    }

    const room: RoomData = JSON.parse(raw);
    const ttlRemaining = Math.max(0, Math.floor((room.createdAt + room.ttl * 1000 - Date.now()) / 1000));

    return new Response(JSON.stringify({
      createdAt: room.createdAt,
      ttl: room.ttl,
      ttlRemaining,
      messages: room.messages,
    }), { headers: { ...headers, 'Cache-Control': 'no-store' } });
  }

  // POST /api/chat/room/:id/msg — add a message
  if (request.method === 'POST' && action === 'msg' && rest.length === 3) {
    let body: { ciphertext: string; iv: string };
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400, headers: { ...headers } });
    }

    if (!body.ciphertext || !body.iv) {
      return new Response(JSON.stringify({ error: 'Missing ciphertext or iv' }), { status: 400, headers: { ...headers } });
    }

    if (body.ciphertext.length > MSG_PAYLOAD_LIMIT) {
      return new Response(JSON.stringify({ error: 'Message too large' }), { status: 413, headers: { ...headers } });
    }

    const raw = await env.CHAT_KV.get(kvKey);
    if (!raw) {
      return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404, headers: { ...headers } });
    }

    const room: RoomData = JSON.parse(raw);

    const msg: Message = {
      id: crypto.randomUUID(),
      ciphertext: body.ciphertext,
      iv: body.iv,
      timestamp: Date.now(),
    };

    room.messages.push(msg);
    if (room.messages.length > room.maxMessages) {
      room.messages = room.messages.slice(-room.maxMessages);
    }

    await env.CHAT_KV.put(kvKey, JSON.stringify(room), { expirationTtl: room.ttl });

    return new Response(JSON.stringify({ id: msg.id, timestamp: msg.timestamp }), {
      headers: { ...headers },
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...headers } });
};
