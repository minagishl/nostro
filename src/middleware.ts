import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
	// Let the application handle both pubkey and NIP-05 identifiers
	return NextResponse.next();
}

export const config = {
	matcher: '/profile/:path*',
};
