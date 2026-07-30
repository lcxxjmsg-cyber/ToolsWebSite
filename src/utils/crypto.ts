function ab2b64(buf: ArrayBuffer | Uint8Array): string {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
}

function b642ab(s: string): ArrayBuffer {
  const b = atob(s);
  const buf = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) buf[i] = b.charCodeAt(i);
  return buf.buffer;
}

export async function encryptMessage(plaintext: string, password?: string): Promise<{
  ciphertext: string;
  iv: string;
  salt?: string;
  key: string;
}> {
  const salt = password ? crypto.getRandomValues(new Uint8Array(16)) : null;
  const iv = crypto.getRandomValues(new Uint8Array(12));

  let aesKey: CryptoKey;
  if (password && salt) {
    const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    aesKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt'],
    );
  } else {
    aesKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
  }

  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, new TextEncoder().encode(plaintext));

  let exportedKey = '';
  if (!password) {
    const raw = await crypto.subtle.exportKey('raw', aesKey);
    exportedKey = ab2b64(raw);
  }

  return {
    ciphertext: ab2b64(encrypted),
    iv: ab2b64(iv),
    salt: salt ? ab2b64(salt) : undefined,
    key: exportedKey,
  };
}

export async function decryptMessage(data: {
  ciphertext: string;
  iv: string;
  salt?: string;
}, password?: string, keyBase64?: string): Promise<string> {
  let aesKey: CryptoKey;

  if (password && data.salt) {
    const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    aesKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: b642ab(data.salt), iterations: 600000, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt'],
    );
  } else if (keyBase64) {
    aesKey = await crypto.subtle.importKey('raw', b642ab(keyBase64), { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  } else {
    throw new Error('No key or password provided');
  }

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b642ab(data.iv) },
    aesKey,
    b642ab(data.ciphertext),
  );

  return new TextDecoder().decode(decrypted);
}

export async function encryptWithKey(plaintext: string, keyBase64: string): Promise<{ ciphertext: string; iv: string }> {
  const key = await crypto.subtle.importKey('raw', b642ab(keyBase64), { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext));
  return { ciphertext: ab2b64(encrypted), iv: ab2b64(iv) };
}

export async function decryptWithKey(ciphertext: string, iv: string, keyBase64: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', b642ab(keyBase64), { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b642ab(iv) }, key, b642ab(ciphertext));
  return new TextDecoder().decode(decrypted);
}

export function generateKey(): string {
  const key = crypto.getRandomValues(new Uint8Array(32));
  let s = '';
  for (let i = 0; i < key.length; i++) s += String.fromCharCode(key[i]);
  return btoa(s);
}
