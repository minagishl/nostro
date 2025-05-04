import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
	const profilePath = '/profile/';
	if (request.nextUrl.pathname.startsWith(profilePath)) {
		const identifier = request.nextUrl.pathname.slice(profilePath.length);

		// If it's already a hex pubkey (64 characters), continue
		if (/^[0-9a-f]{64}$/.test(identifier)) {
			return NextResponse.next();
		}

		try {
			// For NIP-05 identifiers, lookup their pubkey
			let username = '_',
				domain = identifier;
			if (identifier.includes('@')) {
				[username, domain] = identifier.split('@');
			}

			const response = await fetch(`https://${domain}/.well-known/nostr.json?name=${username}`);
			const data = await response.json();
			const pubkey = data?.names?.[username];

			if (pubkey) {
				// Redirect to the pubkey-based profile URL
				return NextResponse.redirect(new URL(`/profile/${pubkey}`, request.url));
			}
		} catch (e) {
			console.error('Failed to lookup NIP-05:', e);
		}

		// If lookup fails, return 404
		return NextResponse.redirect(new URL('/404', request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: '/profile/:path*',
};
