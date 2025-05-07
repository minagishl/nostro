import { type NostrJsonResponse } from '../types';

// Cache for ongoing fetch promises to prevent duplicate requests
const fetchPromiseCache: Record<string, Promise<unknown>> = {};

export async function verifyNip05(
  identifier: string,
  pubkey: string,
  cache: Record<string, unknown>,
): Promise<boolean> {
  try {
    const [username, domain] = identifier.split('@');
    if (!username || !domain) return false;

    const cacheKey = `${domain}:${username}`;
    let data: NostrJsonResponse;

    if (cache[cacheKey]) {
      data = cache[cacheKey] as NostrJsonResponse;
    } else {
      // Check if we already have a fetch in progress
      if (!fetchPromiseCache[cacheKey]) {
        // Create a new fetch promise and store it in the cache
        fetchPromiseCache[cacheKey] = fetch(
          `https://${domain}/.well-known/nostr.json?name=${username}`,
        )
          .then((response) => response.json())
          .then((jsonData) => {
            // Store in the regular cache
            cache[cacheKey] = jsonData;
            // Remove from promise cache after completion
            delete fetchPromiseCache[cacheKey];
            return jsonData;
          })
          .catch((err) => {
            // Clean up on error
            delete fetchPromiseCache[cacheKey];
            throw err;
          });
      }

      // Wait for the promise to resolve
      data = (await fetchPromiseCache[cacheKey]) as NostrJsonResponse;
    }

    return data?.names?.[username] === pubkey;
  } catch (e) {
    console.error('Failed to verify NIP-05:', e);
    return false;
  }
}

export async function lookupNip05Pubkey(
  identifier: string,
  cache: Record<string, unknown>,
): Promise<string | null> {
  try {
    let username: string;
    let domain: string;

    // Skip npub identifiers
    if (identifier.startsWith('npub')) return null;

    if (identifier.includes('@')) {
      [username, domain] = identifier.split('@');
      if (!username || !domain) return null;
    } else {
      // For domain-only identifiers, use '_' as username
      username = '_';
      domain = identifier;
    }

    const cacheKey = `${domain}:${username}`;
    let data: NostrJsonResponse;

    if (cache[cacheKey]) {
      data = cache[cacheKey] as NostrJsonResponse;
    } else {
      // Check if we already have a fetch in progress
      if (!fetchPromiseCache[cacheKey]) {
        // Create a new fetch promise and store it in the cache
        fetchPromiseCache[cacheKey] = fetch(
          `https://${domain}/.well-known/nostr.json?name=${username}`,
        )
          .then((response) => response.json())
          .then((jsonData) => {
            // Store in the regular cache
            cache[cacheKey] = jsonData;
            // Remove from promise cache after completion
            delete fetchPromiseCache[cacheKey];
            return jsonData;
          })
          .catch((err) => {
            // Clean up on error
            delete fetchPromiseCache[cacheKey];
            throw err;
          });
      }

      // Wait for the promise to resolve
      data = (await fetchPromiseCache[cacheKey]) as NostrJsonResponse;
    }

    return data?.names?.[username] || null;
  } catch (e) {
    console.error('Failed to lookup NIP-05:', e);
    return null;
  }
}
