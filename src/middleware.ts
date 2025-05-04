import { NextResponse } from 'next/server';

export async function middleware() {
	// Let the application handle both pubkey and NIP-05 identifiers
	return NextResponse.next();
}

export const config = {
	matcher: '/profile/:path*',
};
