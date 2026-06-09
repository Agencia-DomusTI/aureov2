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

function IconChat() {
  return (
    <svg className="chat-asst__icon" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 18.5l-3.5 1.5 1.5-3.5C3.5 15.2 3 13.1 3 11 3 6.03 7.03 2 12 2s9 4.03 9 9-4.03 9-9 9c-2.1 0-4.1-.7-5.5-2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="11" r="1" fill="currentColor" />
      <circle cx="12" cy="11" r="1" fill="currentColor" />
      <circle cx="15" cy="11" r="1" fill="currentColor" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg className="chat-asst__icon" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg className="chat-asst__icon chat-asst__icon--send" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 19V5M12 5l-5 5M12 5l5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TypingIndicator() {
  return (
    <div className="chat-asst__msg chat-asst__msg--assistant chat-asst__typing" aria-label="Escribiendo">
      <span className="chat-asst__dots">
        <i />
        <i />
        <i />
      </span>
    </div>
  );
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
              <IconClose />
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
            {loading ? <TypingIndicator /> : null}
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
            <button type="submit" className="chat-asst__send" disabled={loading || !input.trim()} aria-label="Enviar">
              <IconSend />
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
        {open ? <IconClose /> : <IconChat />}
      </button>
    </div>
  );
};

export default ChatAssistant;
