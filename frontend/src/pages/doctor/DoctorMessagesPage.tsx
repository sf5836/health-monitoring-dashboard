import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getConversationMessages,
  getCurrentUser,
  getMyConversations,
  sendConversationMessage,
  type ChatConversation,
  type ChatMessage
} from '../../services/patientPortalService';
import { connectPatientRealtime } from '../../services/patientRealtime';
import { sessionStore } from '../../services/sessionStore';
import { formatDateTime } from '../patient/patientUi';

function otherParticipantName(conversation: ChatConversation, myUserId: string): string {
  const participant = conversation.participants.find((item) => item.id !== myUserId);
  return participant?.fullName || 'Conversation';
}

function mergeMessageList(previous: ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  if (previous.some((item) => item.id === incoming.id)) {
    return previous;
  }
  return [...previous, incoming].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return aTime - bTime;
  });
}

function normalizeIncomingMessage(raw: {
  _id?: string;
  conversationId?: string;
  senderId?: string | { _id?: string; id?: string; fullName?: string; role?: 'patient' | 'doctor' | 'admin' };
  messageType?: 'text' | 'file' | 'prescription';
  text?: string;
  fileUrl?: string;
  readBy?: Array<string | { _id?: string; id?: string }>;
  createdAt?: string;
}): ChatMessage | null {
  if (!raw?._id) return null;

  const sender = typeof raw.senderId === 'string' ? undefined : raw.senderId;
  const senderId = typeof raw.senderId === 'string' ? raw.senderId : raw.senderId?.id || raw.senderId?._id || '';

  return {
    id: raw._id,
    conversationId: raw.conversationId || '',
    senderId,
    senderName: sender?.fullName,
    senderRole: sender?.role,
    messageType: raw.messageType || 'text',
    text: raw.text,
    fileUrl: raw.fileUrl,
    readBy: (raw.readBy || [])
      .map((entry) => (typeof entry === 'string' ? entry : entry.id || entry._id || ''))
      .filter(Boolean),
    createdAt: raw.createdAt
  };
}

function initials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return 'PT';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function DoctorMessagesPage() {
  const [searchParams] = useSearchParams();
  const preferredConversationId = searchParams.get('conversationId') || '';
  const [myUserId, setMyUserId] = useState(sessionStore.getUserId() || '');
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationSearch, setConversationSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draftMessage, setDraftMessage] = useState('');
  const [error, setError] = useState('');
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadBootstrap() {
      try {
        const [me, myConversations] = await Promise.all([getCurrentUser(), getMyConversations()]);

        if (cancelled) return;

        setMyUserId(me.id);
        sessionStore.setUserId(me.id);
        setConversations(myConversations);
        const preferred =
          preferredConversationId && myConversations.some((conversation) => conversation.id === preferredConversationId)
            ? preferredConversationId
            : myConversations[0]?.id || '';
        setSelectedConversationId(preferred);
        setError('');
      } catch {
        if (cancelled) return;
        setError('Unable to load conversations.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBootstrap();

    return () => {
      cancelled = true;
    };
  }, [preferredConversationId]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    async function loadMessages() {
      try {
        const response = await getConversationMessages(selectedConversationId);
        if (cancelled) return;
        setMessages(response);
        setError('');
      } catch {
        if (cancelled) return;
        setError('Unable to load messages for this conversation.');
      }
    }

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [selectedConversationId]);

  useEffect(() => {
    const token = sessionStore.getAccessToken();
    if (!token) return;

    const socket = connectPatientRealtime(token);

    const onConnect = () => {
      setIsSocketConnected(true);
      if (selectedConversationId) {
        socket.emit('chat:joinConversation', { conversationId: selectedConversationId });
      }
    };

    const onDisconnect = () => {
      setIsSocketConnected(false);
    };

    const onMessage = (payload: {
      conversationId?: string;
      message?: {
        _id?: string;
        conversationId?: string;
        senderId?: string | { _id?: string; id?: string; fullName?: string; role?: 'patient' | 'doctor' | 'admin' };
        messageType?: 'text' | 'file' | 'prescription';
        text?: string;
        fileUrl?: string;
        readBy?: Array<string | { _id?: string; id?: string }>;
        createdAt?: string;
      };
    }) => {
      if (!payload?.message || !payload.conversationId) return;

      const normalized = normalizeIncomingMessage({
        ...payload.message,
        conversationId: payload.conversationId
      });
      if (!normalized) return;

      if (payload.conversationId === selectedConversationId) {
        setMessages((previous) => mergeMessageList(previous, normalized));
      }

      setConversations((previous) => {
        const existing = previous.find((item) => item.id === payload.conversationId);
        if (!existing) return previous;

        const updated = {
          ...existing,
          lastMessageAt: normalized.createdAt || new Date().toISOString()
        };

        return [updated, ...previous.filter((item) => item.id !== payload.conversationId)];
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('chat:message:new', onMessage);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chat:message:new', onMessage);
    };
  }, [selectedConversationId]);

  useEffect(() => {
    const token = sessionStore.getAccessToken();
    if (!token || !selectedConversationId) return;

    const socket = connectPatientRealtime(token);
    socket.emit('chat:joinConversation', { conversationId: selectedConversationId });
    socket.emit('chat:message:read', { conversationId: selectedConversationId });
  }, [selectedConversationId]);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const filteredConversations = useMemo(() => {
    const query = conversationSearch.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((conversation) =>
      otherParticipantName(conversation, myUserId).toLowerCase().includes(query)
    );
  }, [conversationSearch, conversations, myUserId]);

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = draftMessage.trim();
    if (!trimmed || !selectedConversationId) return;

    try {
      setSending(true);
      const message = await sendConversationMessage(selectedConversationId, { text: trimmed });
      setMessages((previous) => mergeMessageList(previous, message));
      setDraftMessage('');
    } catch {
      setError('Unable to send message.');
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="patient-page patient-messages-page">
      <header className="patient-page-head">
        <div>
          <h2>Messages</h2>
          <p>Real-time chat with your connected patients</p>
        </div>
        <p className={`patient-connection-pill ${isSocketConnected ? 'online' : 'offline'}`}>
          {isSocketConnected ? 'Realtime connected' : 'Realtime offline'}
        </p>
      </header>

      {error ? <p className="patient-error-banner">{error}</p> : null}

      <article className="patient-chat-layout patient-chat-layout-redesign">
        <aside className="patient-chat-sidebar">
          <div className="patient-chat-sidebar-head">
            <h3>Messages</h3>
            <input
              type="search"
              placeholder="Search conversations..."
              value={conversationSearch}
              onChange={(event) => setConversationSearch(event.target.value)}
            />
          </div>

          {loading ? (
            <p className="patient-page-status">Loading...</p>
          ) : filteredConversations.length === 0 ? (
            <p className="patient-empty-state">No conversations found yet.</p>
          ) : (
            <ul className="patient-chat-list">
              {filteredConversations.map((conversation) => {
                const name = otherParticipantName(conversation, myUserId);

                return (
                  <li key={conversation.id}>
                    <button
                      type="button"
                      className={`patient-chat-list-item ${conversation.id === selectedConversationId ? 'is-active' : ''}`}
                      onClick={() => setSelectedConversationId(conversation.id)}
                    >
                      <div className="patient-chat-list-avatar" aria-hidden="true">
                        {initials(name)}
                        <span className="patient-doctor-online-dot" />
                      </div>
                      <div className="patient-chat-list-content">
                        <strong>{name}</strong>
                        <small>Open conversation</small>
                      </div>
                      <small className="patient-chat-list-time">{formatDateTime(conversation.lastMessageAt)}</small>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section className="patient-chat-thread">
          <header className="patient-chat-thread-head patient-chat-thread-head-redesign">
            {selectedConversation ? (
              <>
                <div className="patient-chat-thread-profile">
                  <div className="patient-chat-list-avatar" aria-hidden="true">
                    {initials(otherParticipantName(selectedConversation, myUserId))}
                    <span className="patient-doctor-online-dot" />
                  </div>
                  <div>
                    <h3>{otherParticipantName(selectedConversation, myUserId)}</h3>
                    <small>{isSocketConnected ? 'Online' : 'Offline'}</small>
                  </div>
                </div>
              </>
            ) : (
              <h3>Select a conversation</h3>
            )}
          </header>

          <div className="patient-chat-messages">
            {selectedConversationId ? (
              messages.length > 0 ? (
                messages.map((message) => {
                  const isMine = message.senderId === myUserId;

                  return (
                    <article key={message.id} className={`patient-chat-bubble ${isMine ? 'is-mine' : ''}`}>
                      {message.messageType === 'file' && message.fileUrl ? (
                        <p>
                          Attachment:{' '}
                          <a href={message.fileUrl} target="_blank" rel="noreferrer">
                            Download file
                          </a>
                        </p>
                      ) : message.messageType === 'prescription' ? (
                        <p>{message.text || 'Prescription shared'}</p>
                      ) : (
                        <p>{message.text || '[Attachment]'}</p>
                      )}
                      <small>{formatDateTime(message.createdAt)}</small>
                    </article>
                  );
                })
              ) : (
                <p className="patient-empty-state">No messages in this conversation yet.</p>
              )
            ) : (
              <p className="patient-empty-state">Choose a conversation to start chatting.</p>
            )}
          </div>

          <form className="patient-chat-input-row" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Type a message..."
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
              disabled={!selectedConversationId || sending}
            />
            <button type="submit" className="patient-primary-button" disabled={!selectedConversationId || sending}>
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </section>
      </article>
    </section>
  );
}
