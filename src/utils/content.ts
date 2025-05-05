export function extractMediaUrls(content: string): string[] {
	const urlRegex =
		/(https?:\/\/[^\s"']+\.(?:jpg|jpeg|png|gif|webp|mp4|webm|mov)(\?[^\s"']*)?)(?:\s|$)/gi;
	return Array.from(content.matchAll(urlRegex)).map((match) => match[1]);
}

function convertNostrLinks(content: string): string {
	const nostrRegex = /nostr:(\w+)/g;
	return content.replace(nostrRegex, (match, identifier) => {
		const truncated = identifier.slice(0, 10);
		return `<a href="/profile/${identifier}">nostr:${truncated}</a>`;
	});
}

function convertMentions(content: string): string {
	const mentionRegex = /@(\w+)/g;
	return content.replace(mentionRegex, '<a href="/profile/$1">@$1</a>');
}

function convertUrls(content: string): string {
	const urlRegex = /(?<!["'])(https?:\/\/[^\s<]+)(?![^<]*>|[^<>]*<\/)/gi;
	return content.replace(
		urlRegex,
		(url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
	);
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

export function formatContent(content: string): string {
	// Remove media URLs from the displayed content to avoid duplicates
	const mediaUrls = extractMediaUrls(content);
	let formattedContent = escapeHtml(content);

	mediaUrls.forEach((url) => {
		formattedContent = formattedContent.replace(url, '');
	});

	// Convert nostr: links, @mentions, and URLs
	formattedContent = convertNostrLinks(formattedContent);
	formattedContent = convertMentions(formattedContent);
	formattedContent = convertUrls(formattedContent);

	// Convert line breaks to <br> tags
	formattedContent = formattedContent
		.replace(/\r\n/g, '\n') // Normalize line endings
		.replace(/\n\n+/g, '</p><p>') // Multiple line breaks become paragraphs
		.replace(/\n/g, '<br>'); // Single line breaks become <br>

	// Wrap in paragraph tags if it contains paragraph breaks
	if (formattedContent.includes('</p><p>')) {
		formattedContent = `<p>${formattedContent}</p>`;
	}

	return formattedContent.trim();
}
