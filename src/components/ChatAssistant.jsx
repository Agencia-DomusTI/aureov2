import { useCallback, useEffect, useRef, useState } from 'react';
import { CHAT_QUICK_ACTIONS, CHAT_WELCOME, buildChatSystemPrompt } from '../constants/chatContext';
import { isGroqConfigured, sendGroqMessage } from '../lib/groqChat';
import './ChatAssistant.css';

function scrollToBooking() {
  const el = document.getElementById('contacto');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }
  return false;
}

function wantsBooking(text) {
  const t = text.toLowerCase();
  return /agendar|reservar|cita|appointment|calendario/.test(t);
}

const ChatAssistant = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: CHAT_WELCOME },
  ]);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = useCallback(async (text) => {
    const trimmed = text?.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      if (!isGroqConfigured()) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'El asistente está en configuración. Mientras tanto, agenda en la sección Contacto o escríbenos por WhatsApp.',
          },
        ]);
        return;
      }

      const apiMessages = [
        { role: 'system', content: buildChatSystemPrompt(trimmed) },
        ...nextMessages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
      ];

      const reply = await sendGroqMessage(apiMessages);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);

      if (wantsBooking(trimmed) || wantsBooking(reply)) {
        setTimeout(scrollToBooking, 600);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: err.message || 'No pude responder. Intenta de nuevo o contáctanos por WhatsApp.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  if (!isGroqConfigured()) return null;

  return (
    <div className={`chat-asst ${open ? 'chat-asst--open' : ''}`}>
      {open ? (
        <div className="chat-asst__panel" role="dialog" aria-label="Asistente Áureo Clinique">
          <header className="chat-asst__head">
            <div>
              <strong>Áureo Clinique</strong>
              <span>Tu asistente de confianza</span>
            </div>
            <button
              type="button"
              className="chat-asst__close"
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
            >
              ✕
            </button>
          </header>

          <div className="chat-asst__actions">
            {CHAT_QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                className="chat-asst__chip"
                disabled={loading}
                onClick={() => {
                  if (action.id === 'book') {
                    scrollToBooking();
                  }
                  send(action.message);
                }}
              >
                {action.label}
              </button>
            ))}
          </div>

          <div className="chat-asst__messages" ref={listRef}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-asst__msg chat-asst__msg--${msg.role}`}
              >
                {msg.content}
              </div>
            ))}
            {loading ? (
              <div className="chat-asst__msg chat-asst__msg--assistant chat-asst__typing">
                Escribiendo…
              </div>
            ) : null}
          </div>

          <form className="chat-asst__form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="chat-asst__input"
              placeholder="Escribe tu pregunta…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              maxLength={500}
            />
            <button type="submit" className="chat-asst__send" disabled={loading || !input.trim()}>
              ↑
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        className="chat-asst__fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente'}
        aria-expanded={open}
      >
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
};

export default ChatAssistant;
