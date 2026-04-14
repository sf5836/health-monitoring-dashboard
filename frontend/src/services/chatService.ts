import { apiRequest } from './apiClient';

export type ChatConversation = {
	_id: string;
	participantIds: Array<{
		_id: string;
		fullName?: string;
		email?: string;
		role?: string;
	}>;
	lastMessageAt?: string;
	updatedAt?: string;
};

export type ChatMessage = {
	_id: string;
	conversationId: string;
	senderId: {
		_id: string;
		fullName?: string;
		role?: string;
	};
	messageType: 'text' | 'file' | 'prescription';
	text?: string;
	fileUrl?: string;
	createdAt: string;
};

async function getMyConversations(): Promise<ChatConversation[]> {
	const data = await apiRequest<{ conversations: ChatConversation[] }>('/chat/me/conversations', {
		auth: true
	});
	return data.conversations;
}

async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
	const data = await apiRequest<{ messages: ChatMessage[] }>(
		`/chat/me/conversations/${conversationId}/messages`,
		{
			auth: true
		}
	);
	return data.messages;
}

async function sendMessage(conversationId: string, text: string): Promise<ChatMessage> {
	const data = await apiRequest<{ message: ChatMessage }>(
		`/chat/me/conversations/${conversationId}/messages`,
		{
			method: 'POST',
			body: { text },
			auth: true
		}
	);
	return data.message;
}

const chatService = {
	getMyConversations,
	getConversationMessages,
	sendMessage
};

export default chatService;
