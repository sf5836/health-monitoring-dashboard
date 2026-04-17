import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

import { API_BASE_URL, getStoredAccessToken } from '../services/apiClient';

type SocketEventHandler<T = unknown> = (payload: T) => void;

type SendMessagePayload = {
	conversationId?: string;
	toUserId?: string;
	text?: string;
	fileUrl?: string;
	messageType?: 'text' | 'file' | 'prescription';
};

type SyncNotificationsPayload = {
	since?: string;
	limit?: number;
};

function getSocketBaseUrl() {
	return API_BASE_URL.replace(/\/api\/?$/, '');
}

export function useSocket() {
	const socketRef = useRef<Socket | null>(null);
	const joinedConversationIdsRef = useRef<Set<string>>(new Set());

	const [isConnected, setIsConnected] = useState(false);
	const [lastError, setLastError] = useState<string | null>(null);

	const connect = useCallback(() => {
		const existing = socketRef.current;
		if (existing?.connected) {
			return existing;
		}

		const token = getStoredAccessToken();
		if (!token) {
			setLastError('Socket connection requires an authenticated session.');
			return null;
		}

		const socket =
			existing ||
			io(getSocketBaseUrl(), {
				auth: { token },
				transports: ['websocket'],
				autoConnect: false,
				reconnection: true,
				reconnectionAttempts: 10,
				reconnectionDelay: 500,
				reconnectionDelayMax: 5000,
				timeout: 10000
			});

		if (!existing) {
			socketRef.current = socket;

			socket.on('connect', () => {
				setIsConnected(true);
				setLastError(null);

				joinedConversationIdsRef.current.forEach((conversationId) => {
					socket.emit('chat:joinConversation', { conversationId });
					socket.emit('chat:sync', { conversationId });
				});

				socket.emit('notification:sync', {});
			});

			socket.on('disconnect', () => {
				setIsConnected(false);
			});

			socket.on('connect_error', (error) => {
				setLastError(error.message || 'Socket connection failed');
			});

			socket.on('notification:sync:required', () => {
				socket.emit('notification:sync', {});
			});
		}

		if (!socket.connected) {
			socket.auth = { token };
			socket.connect();
		}

		return socket;
	}, []);

	const disconnect = useCallback(() => {
		if (!socketRef.current) {
			return;
		}

		socketRef.current.disconnect();
		socketRef.current.removeAllListeners();
		socketRef.current = null;
		joinedConversationIdsRef.current.clear();
		setIsConnected(false);
	}, []);

	const on = useCallback(<T = unknown>(event: string, handler: SocketEventHandler<T>) => {
		const socket = connect();
		if (!socket) {
			return () => undefined;
		}

		socket.on(event, handler as SocketEventHandler);

		return () => {
			socket.off(event, handler as SocketEventHandler);
		};
	}, [connect]);

	const emit = useCallback((event: string, payload?: unknown) => {
		const socket = connect();
		if (!socket) {
			return;
		}

		socket.emit(event, payload);
	}, [connect]);

	const joinConversation = useCallback((conversationId: string) => {
		if (!conversationId) {
			return;
		}

		joinedConversationIdsRef.current.add(conversationId);
		emit('chat:joinConversation', { conversationId });
	}, [emit]);

	const sendMessage = useCallback((payload: SendMessagePayload) => {
		emit('chat:message:send', payload);
	}, [emit]);

	const markMessageRead = useCallback((payload: { messageId?: string; conversationId?: string }) => {
		emit('chat:message:read', payload);
	}, [emit]);

	const syncConversation = useCallback((conversationId: string, since?: string) => {
		if (!conversationId) {
			return;
		}

		emit('chat:sync', { conversationId, since });
	}, [emit]);

	const syncNotifications = useCallback((payload: SyncNotificationsPayload = {}) => {
		emit('notification:sync', payload);
	}, [emit]);

	const markNotificationRead = useCallback((notificationId: string) => {
		emit('notification:read', { notificationId });
	}, [emit]);

	const markAllNotificationsRead = useCallback(() => {
		emit('notification:read_all', {});
	}, [emit]);

	useEffect(() => disconnect, [disconnect]);

	return {
		socket: socketRef.current,
		isConnected,
		lastError,
		connect,
		disconnect,
		on,
		emit,
		joinConversation,
		sendMessage,
		markMessageRead,
		syncConversation,
		syncNotifications,
		markNotificationRead,
		markAllNotificationsRead
	};
}
