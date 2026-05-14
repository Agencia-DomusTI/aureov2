import { useState, useEffect, useRef } from 'react';
import './FloatingChatbot.css';

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: '¡Hola! Bienvenido a Áureo Clinique. ¿En qué podemos ayudarte hoy?', sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { id: Date.now(), text: inputValue, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    
    // Simular respuesta del bot
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const botResponse = { 
        id: Date.now() + 1, 
        text: getBotResponse(inputValue), 
        sender: 'bot' 
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1500);
  };

  const getBotResponse = (query) => {
    const q = query.toLowerCase();
    if (q.includes('hola') || q.includes('buenos días')) return '¡Hola! Es un placer saludarte. ¿Te gustaría conocer nuestros tratamientos?';
    if (q.includes('tratamiento') || q.includes('servicios')) return 'Contamos con Medicina Estética, Regenerativa y Wellness. ¿Buscas algo en específico como Botox o Sueros?';
    if (q.includes('precio') || q.includes('costo')) return 'Los costos varían según el tratamiento. Te recomendamos una valoración inicial para darte un presupuesto exacto.';
    if (q.includes('ubicacion') || q.includes('donde están')) return 'Estamos ubicados en una zona exclusiva de la ciudad. Puedes encontrar el mapa al final de nuestra página.';
    return 'Entiendo. Permíteme canalizarte con un especialista o cuéntame un poco más sobre lo que buscas.';
  };

  return (
    <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="header-info">
              <div className="bot-avatar-small">
                <img src="/chatbot.png" alt="Bot" />
              </div>
              <div>
                <h4>Asistente Áureo</h4>
                <span>En línea</span>
              </div>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                <div className="message-content">
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message bot typing">
                <div className="message-content">
                  <div className="typing-dots">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input" onSubmit={handleSend}>
            <input 
              type="text" 
              placeholder="Escribe tu duda aquí..." 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button type="submit" className="send-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chatbot-float"
        aria-label="Abrir chat"
      >
        <img src="/chatbot.png" alt="Chatbot" className="chatbot-icon" />
      </button>
    </div>
  );
};

export default FloatingChatbot;
