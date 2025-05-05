import { type Event } from 'nostr-tools';

declare global {
	interface Window {
		nostr?: {
			getPublicKey(): Promise<string>;
			signEvent(event: Event): Promise<Event>;
		};
	}
}

export async function checkNostrProvider(): Promise<boolean> {
	return typeof window !== 'undefined' && !!window.nostr;
}

export async function getPublicKeyFromExtension(): Promise<string | null> {
	try {
		if (!(await checkNostrProvider())) return null;
		return await window.nostr!.getPublicKey();
	} catch (e) {
		console.error('Failed to get public key from extension:', e);
		return null;
	}
}

export async function signEventWithExtension(event: Event): Promise<Event | null> {
	try {
		if (!(await checkNostrProvider())) return null;
		return await window.nostr!.signEvent(event);
	} catch (e) {
		console.error('Failed to sign event with extension:', e);
		return null;
	}
}
