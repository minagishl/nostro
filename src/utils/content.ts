export function extractImageUrls(content: string): string[] {
	const urlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp))(?:\s|$)/gi;
	return Array.from(content.matchAll(urlRegex)).map((match) => match[1]);
}

export function formatContent(content: string): string {
	// Remove image URLs from the displayed content to avoid duplicates
	const imageUrls = extractImageUrls(content);
	let formattedContent = content;
	imageUrls.forEach((url) => {
		formattedContent = formattedContent.replace(url, '');
	});
	return formattedContent.trim();
}
