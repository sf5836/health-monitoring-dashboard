const path = require('path');

function buildLocalAssetUrl(fileName) {
	const safeName = String(fileName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
	return `http://localhost:5000/assets/${safeName}`;
}

async function uploadBuffer({ fileName, _buffer, contentType }) {
	const ext = path.extname(fileName || '') || '.bin';
	const normalizedName = `${Date.now()}${ext}`;

	return {
		url: buildLocalAssetUrl(normalizedName),
		fileName: normalizedName,
		contentType: contentType || 'application/octet-stream',
		provider: 'local-mock-storage'
	};
}

module.exports = {
	uploadBuffer
};
