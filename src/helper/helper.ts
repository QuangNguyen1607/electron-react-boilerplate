export function sanitizeTitle(title: string) {
	let formatRemoveVI = removeVietnameseDiacritics(title);
	let sanitizedTitle = formatRemoveVI.replace(/\s+/g, '-').toLowerCase();
	return sanitizedTitle;
}
export function bytesToMB(bytes: number): number {
	return Number((bytes / (1024 * 1024)).toFixed(2)); // Return the value rounded to 2 decimal places
}

function removeVietnameseDiacritics(str: string) {
	return str
		.normalize('NFD') // Decompose into base character and diacritic
		.replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
		.replace(/đ/g, 'd') // Special case for đ
		.replace(/Đ/g, 'D'); // Special case for Đ
}

export function extractFileTypeFromMimeType(mimeType) {
	// Split the MIME type string using the '/' delimiter
	const parts = mimeType.split('/');

	// Return the second part which represents the file type
	return parts[1];
  }