import { FormEvent, useEffect, useMemo, useState } from 'react';
import chatService, { type ChatConversation, type ChatMessage } from '../../services/chatService';
import authService from '../../services/authService';
import { ApiError } from '../../services/apiClient';
import { useSocket } from '../../hooks/useSocket';

export default function DoctorMessagesPage() {
  const session = authService.getSession();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { connect, on } = useSocket();

  useEffect(() => {
    chatService
      .getMyConversations()
      .then((items) => {
        setConversations(items);
        if (items.length > 0) setActiveConversationId(items[0]._id);
      })
      .catch((error: unknown) => setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load conversations'));
  }, []);

  useEffect(() => {
    if (!activeConversationId) return;
    chatService
      .getConversationMessages(activeConversationId)
      .then(setMessages)
      .catch((error: unknown) => setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load messages'));
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

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter((c) => c.participantIds.some((p) => (p.fullName || '').toLowerCase().includes(needle)));
  }, [conversations, search]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeConversationId || !draft.trim()) return;
    try {
      const sent = await chatService.sendMessage(activeConversationId, draft.trim());
      setMessages((m) => [...m, sent]);
      setDraft('');
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to send');
    }
  };

  return (
    <main className="hm-container" style={{ padding: '1.5rem 0' }}>
      <h2>Doctor Messages</h2>
      {errorMessage ? <p>{errorMessage}</p> : null}
      <section style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1rem' }}>
        <aside className="hm-card">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" />
          {visible.map((c) => {
            const other = c.participantIds.find((p) => p._id !== session?.user.id) || c.participantIds[0];
            return (
              <button key={c._id} className="hm-btn hm-btn-outline hm-btn-block" onClick={() => setActiveConversationId(c._id)}>
                {other?.fullName || 'Conversation'}
              </button>
            );
          })}
        </aside>
        <section className="hm-card">
          {messages.map((m) => (
            <article key={m._id} style={{ textAlign: m.senderId?._id === session?.user.id ? 'right' : 'left' }}>
              <p>{m.text || m.fileUrl || '-'}</p>
            </article>
          ))}
          <form onSubmit={sendMessage} style={{ display: 'flex', gap: '0.6rem' }}>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type message" style={{ flex: 1 }} />
            <button className="hm-btn hm-btn-primary" type="submit">Send</button>
          </form>
        </section>
      </section>
    </main>
  );
}
