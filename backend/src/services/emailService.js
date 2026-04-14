function generateMessageId() {
	return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function sendEmail({ to, subject, text, html }) {
	if (!to || !subject) {
		const error = new Error('to and subject are required');
		error.statusCode = 400;
		throw error;
	}

	const messageId = generateMessageId();
	console.log('[email] queued', {
		messageId,
		to,
		subject,
		hasText: Boolean(text),
		hasHtml: Boolean(html)
	});

	return {
		accepted: [to],
		messageId,
		provider: 'local-console'
	};
}

module.exports = {
	sendEmail
};
