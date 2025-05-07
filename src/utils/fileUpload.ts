import type { Event, EventTemplate } from 'nostr-tools';
import { getToken as getNip98Token } from 'nostr-tools/nip98';

// Key for localStorage
const UPLOAD_URL_KEY = 'nostro:uploadUrl';

// Default upload URLs
export const DEFAULT_UPLOAD_URL = 'https://nostr.build/api/v2/nip96/upload';
export const NOSTRCHECK_UPLOAD_URL = 'https://cdn.nostrcheck.me/';

// Get upload URL from localStorage or default
export function getUploadUrl(): string {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(UPLOAD_URL_KEY);
    if (stored) return stored;
  }
  return DEFAULT_UPLOAD_URL;
}

// Set upload URL in localStorage
export function setUploadUrl(url: string) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(UPLOAD_URL_KEY, url);
  }
}

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
 * @param uploadUrl Optional custom upload URL, defaults to getUploadUrl()
 * @returns The uploaded image URL (on success) or null (on failure)
 */
export async function uploadImageToNostr(
  file: File,
  publicKey: string,
  privateKey: string | null,
  isExtensionLogin: boolean,
  uploadUrl?: string, // optional, fallback to getUploadUrl()
): Promise<{ url: string | null; error: string | null }> {
  try {
    // Calculate the file hash
    const hashBytes = await getFileSHA256(file);
    const hashBase64 = base64encode(hashBytes);

    const method = 'POST';
    const url = uploadUrl || getUploadUrl();
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
      const b64 = btoa(
        String.fromCharCode(...new TextEncoder().encode(JSON.stringify(signedEvent))),
      );
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
        const utf8Encoder = new TextEncoder();
        const idBytes = new Uint8Array(
          await crypto.subtle.digest('SHA-256', utf8Encoder.encode(serializeEvent(fullEvent))),
        );
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

    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: authorization,
      },
    });

    // If using nostr.build, expect NIP-96 response
    if (url.includes('nostr.build')) {
      const data = await res.json();
      if (data.status === 'success' && data.nip94_event) {
        const urlTag = data.nip94_event.tags.find((tag: [string, ...string[]]) => tag[0] === 'url');
        if (urlTag) {
          return { url: urlTag[1], error: null };
        }
      }
      return { url: null, error: data.message || 'Upload failed' };
    }

    // If using nostrcheck CDN, just return the file URL if upload succeeded
    if (url.startsWith('https://cdn.nostrcheck.me/')) {
      if (res.ok) {
        // The CDN returns the file URL in the Location header or as plain text
        const location = res.headers.get('Location');
        if (location) {
          return { url: location, error: null };
        }
        const text = await res.text();
        if (text.startsWith('http')) {
          return { url: text.trim(), error: null };
        }
        return { url: null, error: 'No URL returned from CDN' };
      } else {
        return { url: null, error: 'Upload failed' };
      }
    }

    // Fallback: try to parse as JSON and get a URL
    try {
      const data = await res.json();
      if (data.url) return { url: data.url, error: null };
      return { url: null, error: data.message || 'Upload failed' };
    } catch {
      return { url: null, error: 'Upload failed' };
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { url: null, error: err.message || 'Upload failed' };
    }
    return { url: null, error: 'Upload failed' };
  }
}
