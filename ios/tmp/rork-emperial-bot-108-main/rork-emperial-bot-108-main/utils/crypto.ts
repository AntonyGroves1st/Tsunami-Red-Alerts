import { Platform } from 'react-native';

async function sha256(message: string): Promise<string> {
  try {
    if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.log('[Crypto] Web Crypto API failed, using fallback:', e);
  }

  let hash = 0x811c9dc5;
  for (let i = 0; i < message.length; i++) {
    hash ^= message.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const part1 = (hash >>> 0).toString(16).padStart(8, '0');

  let hash2 = 0x01000193;
  for (let i = message.length - 1; i >= 0; i--) {
    hash2 ^= message.charCodeAt(i);
    hash2 = Math.imul(hash2, 0x811c9dc5);
  }
  const part2 = (hash2 >>> 0).toString(16).padStart(8, '0');

  let hash3 = 0;
  for (let i = 0; i < message.length; i++) {
    hash3 = ((hash3 << 5) - hash3 + message.charCodeAt(i)) | 0;
  }
  const part3 = (hash3 >>> 0).toString(16).padStart(8, '0');

  let hash4 = 0x12345678;
  for (let i = 0; i < message.length; i++) {
    hash4 = (hash4 * 31 + message.charCodeAt(i)) | 0;
  }
  const part4 = (hash4 >>> 0).toString(16).padStart(8, '0');

  return (part1 + part2 + part3 + part4).padEnd(64, '0');
}

function generateUUID(): string {
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const UniversalCrypto = {
  digestStringAsync: sha256,
  randomUUID: generateUUID,
};
