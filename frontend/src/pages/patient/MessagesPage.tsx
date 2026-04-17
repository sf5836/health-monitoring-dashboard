import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../services/apiClient';
import authService from '../../services/authService';
import chatService, { type ChatConversation, type ChatMessage } from '../../services/chatService';
import { useSocket } from '../../hooks/useSocket';

function formatDateLabel(dateInput?: string): string {
  if (!dateInput) {
    return '';
  }
  return new Date(dateInput).toLocaleString();
}

export default function MessagesPage() {
  const session = authService.getSession();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { connect, on } = useSocket();

  useEffect(() => {
    if (!session) {
      setLoadingConversations(false);
      return;
    }

    chatService
      .getMyConversations()
      .then((items) => {
        setConversations(items);
        if (items.length > 0) {
          setActiveConversationId(items[0]._id);
        }
      })
      .catch((error: unknown) => {
        setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load conversations');
      })
      .finally(() => setLoadingConversations(false));
  }, []);

  const loadMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    setErrorMessage('');
    try {
      const items = await chatService.getConversationMessages(conversationId);
      setMessages(items);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    loadMessages(activeConversationId);
  }, [activeConversationId]);

  useEffect(() => {
    if (!session) {
      return;
    }
    connect();
    const unsubscribe = on<{ conversationId: string; message: ChatMessage }>('chat:message:new', (payload) => {
      if (!payload?.conversationId || !payload?.message) {
        return;
      }
      if (payload.conversationId !== activeConversationId) {
        return;
      }
      setMessages((prev) => (prev.some((item) => item._id === payload.message._id) ? prev : [...prev, payload.message]));
    });
    return () => unsubscribe();
  }, [session?.user.id, activeConversationId, connect, on]);

  const visibleConversations = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const participantName =
        conversation.participantIds.find((item) => item.role === 'doctor')?.fullName ||
        conversation.participantIds[0]?.fullName ||
        '';
      return participantName.toLowerCase().includes(needle);
    });
  }, [conversations, search]);

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeConversationId || !draft.trim()) {
      return;
    }

    try {
      const sent = await chatService.sendMessage(activeConversationId, draft.trim());
      setMessages((prev) => [...prev, sent]);
      setDraft('');
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to send message');
    }
  };

  if (!session) {
    return (
      <section className="placeholder-page">
        <h2>Messages</h2>
        <p>Please login as a patient to view live messages.</p>
        <Link to="/login">Go to Login</Link>
      </section>
    );
  }

  return (
    <main className="hm-container" style={{ padding: '1.5rem 0' }}>
      <section className="hm-section-head">
        <h2>Messages</h2>
        <p>Live patient conversations with doctors</p>
      </section>

      {errorMessage ? <p>{errorMessage}</p> : null}

      <section style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1rem' }}>
        <aside className="hm-card">
          <input
            type="search"
            placeholder="Search doctors..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ width: '100%', marginBottom: '0.8rem' }}
          />

          {loadingConversations ? <p>Loading conversations...</p> : null}

          {visibleConversations.map((conversation) => {
            const doctor =
              conversation.participantIds.find((item) => item.role === 'doctor') ||
              conversation.participantIds[0];
            return (
              <button
                key={conversation._id}
                type="button"
                className="hm-btn hm-btn-outline hm-btn-block"
                style={{ marginBottom: '0.5rem', textAlign: 'left' }}
                onClick={() => setActiveConversationId(conversation._id)}
              >
                <strong>{doctor?.fullName || 'Conversation'}</strong>
                <br />
                <small>{formatDateLabel(conversation.lastMessageAt || conversation.updatedAt)}</small>
              </button>
            );
          })}
        </aside>

        <section className="hm-card">
          {!activeConversationId ? <p>Select a conversation to view messages.</p> : null}
          {loadingMessages ? <p>Loading messages...</p> : null}

          {messages.map((message) => {
            const mine = message.senderId?._id === session.user.id;
            return (
              <article key={message._id} style={{ marginBottom: '0.8rem', textAlign: mine ? 'right' : 'left' }}>
                <div
                  style={{
                    display: 'inline-block',
                    background: mine ? '#ccf2e4' : '#f3f4f6',
                    borderRadius: '10px',
                    padding: '0.6rem 0.8rem',
                    maxWidth: '80%'
                  }}
                >
                  {message.text || (message.fileUrl ? `File: ${message.fileUrl}` : '[No text]')}
                </div>
                <div>
                  <small>{formatDateLabel(message.createdAt)}</small>
                </div>
              </article>
            );
          })}

          {activeConversationId ? (
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Type a message"
                style={{ flex: 1 }}
              />
              <button className="hm-btn hm-btn-primary" type="submit">
                Send
              </button>
            </form>
          ) : null}
        </section>
      </section>
    </main>
  );
}
