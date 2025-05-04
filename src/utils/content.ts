export function extractImageUrls(content: string): string[] {
	const urlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp))(?:\s|$)/gi;
	return Array.from(content.matchAll(urlRegex)).map((match) => match[1]);
}

function convertNostrLinks(content: string): string {
	const nostrRegex = /nostr:(\w+)/g;
	return content.replace(nostrRegex, '<a href="/profile/$1">nostr:$1</a>');
}

function convertMentions(content: string): string {
	const mentionRegex = /@(\w+)/g;
	return content.replace(mentionRegex, '<a href="/profile/$1">@$1</a>');
}

export function formatContent(content: string): string {
	// Remove image URLs from the displayed content to avoid duplicates
	const imageUrls = extractImageUrls(content);
	let formattedContent = content;

	imageUrls.forEach((url) => {
		formattedContent = formattedContent.replace(url, '');
	});

	// Convert nostr: links and @mentions
	formattedContent = convertNostrLinks(formattedContent);
	formattedContent = convertMentions(formattedContent);

	return formattedContent.trim();
}
