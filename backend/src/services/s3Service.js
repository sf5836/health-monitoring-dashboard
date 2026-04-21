const fs = require('fs/promises');
const path = require('path');

const ASSET_DIRECTORY = path.resolve(__dirname, '../../uploads/assets');

function normalizeFileName(value) {
	return String(value || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
}

function extensionFromContentType(contentType) {
	const normalized = String(contentType || '').toLowerCase();
	if (normalized === 'application/pdf') return '.pdf';
	if (normalized === 'image/png') return '.png';
	if (normalized === 'image/jpeg') return '.jpg';
	return '.bin';
}

function buildLocalAssetUrl(fileName) {
	const safeName = normalizeFileName(fileName);
	return `/assets/${safeName}`;
}

async function uploadBuffer({ fileName, _buffer, contentType }) {
	const rawExt = path.extname(fileName || '');
	const ext = rawExt || extensionFromContentType(contentType);
	const timestamp = Date.now();
	const random = Math.random().toString(36).slice(2, 8);
	const normalizedName = normalizeFileName(`${timestamp}-${random}${ext}`);

	await fs.mkdir(ASSET_DIRECTORY, { recursive: true });
	await fs.writeFile(path.join(ASSET_DIRECTORY, normalizedName), _buffer);

	return {
		url: buildLocalAssetUrl(normalizedName),
		fileName: normalizedName,
		contentType: contentType || 'application/octet-stream',
		provider: 'local-disk-storage'
	};
}

module.exports = {
	uploadBuffer
};
