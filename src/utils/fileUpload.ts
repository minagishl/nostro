import type { Event, EventTemplate } from 'nostr-tools';
import { getToken as getNip98Token } from 'nostr-tools/nip98';

export const NIP96_API_URL = 'https://nostr.build/api/v2/nip96/upload';

// Calculate the SHA256 hash of an image file according to NIP96
export async function getFileSHA256(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  return new Uint8Array(hashBuffer);
}

// Base64 encodes data in Uint8Array format
export function base64encode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Uploads an image file to Nostr.
 * @param file The file to upload
 * @param publicKey The user's public key
 * @param privateKey The user's private key
 * @param isExtensionLogin Whether login is via browser extension
 * @returns The uploaded image URL (on success) or null (on failure)
 */
export async function uploadImageToNostr(
  file: File,
  publicKey: string,
  privateKey: string | null,
  isExtensionLogin: boolean,
): Promise<{ url: string | null; error: string | null }> {
  try {
    // Calculate the file hash
    const hashBytes = await getFileSHA256(file);
    const hashBase64 = base64encode(hashBytes);

    const method = 'POST';
    const url = NIP96_API_URL;
    const payload = { hash: hashBase64 };
    let authorization = '';

    // Generate authentication token
    if (isExtensionLogin && window.nostr) {
      // Sign the event using the browser extension
      const event = {
        kind: 27235,
        tags: [
          ['u', url],
          ['method', method],
          ['payload', JSON.stringify(payload)],
        ],
        created_at: Math.floor(Date.now() / 1000),
        content: '',
        pubkey: publicKey,
        id: '',
        sig: '',
      };
      const signedEvent = await window.nostr.signEvent(event);
      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(signedEvent))));
      authorization = `Nostr ${b64}`;
    } else if (privateKey) {
      // Signing with private key
      const sign = async (event: EventTemplate): Promise<Event> => {
        const { schnorr } = await import('@noble/curves/secp256k1');
        const { bytesToHex } = await import('@noble/hashes/utils');
        const fullEvent = {
          ...event,
          pubkey: publicKey,
          id: '',
          sig: '',
        };
        const serializeEvent = (evt: EventTemplate & { pubkey: string }) =>
          JSON.stringify([0, evt.pubkey, evt.created_at, evt.kind, evt.tags, evt.content]);
        const { sha256 } = await import('@noble/hashes/sha256');
        const utf8Encoder = new TextEncoder();
        const idBytes = sha256(utf8Encoder.encode(serializeEvent(fullEvent)));
        fullEvent.id = bytesToHex(idBytes);
        fullEvent.sig = bytesToHex(schnorr.sign(fullEvent.id, privateKey));
        return fullEvent;
      };
      authorization = await getNip98Token(url, method, sign, true, payload);
    } else {
      return { url: null, error: 'No private key available for signing' };
    }

    // Upload using multipart form data
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(NIP96_API_URL, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: authorization,
      },
    });

    const data = await res.json();

    if (data.status === 'success' && data.nip94_event) {
      const urlTag = data.nip94_event.tags.find((tag: [string, ...string[]]) => tag[0] === 'url');
      if (urlTag) {
        return { url: urlTag[1], error: null };
      }
    }

    return { url: null, error: data.message || 'Upload failed' };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { url: null, error: err.message || 'Upload failed' };
    }
    return { url: null, error: 'Upload failed' };
  }
}
