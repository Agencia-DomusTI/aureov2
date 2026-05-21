import { useEffect } from 'react';
import '../styles/leadconnector-chat.css';

const WIDGET_ID = '6a0660ffed0c5fc6b739a0b0';
const LOADER_SRC = 'https://widgets.leadconnectorhq.com/loader.js';
const RESOURCES_URL = 'https://widgets.leadconnectorhq.com/chat-widget/loader.js';

/** Corrige contenedores inyectados por GHL que desbordan en el eje X */
function constrainChatWidgetNodes() {
  const selectors = [
    'chat-widget',
    '[data-chat-widget]',
    'iframe[src*="leadconnectorhq"]',
    '#lc_text-widget',
    '#chat-widget-container',
  ];

  document.querySelectorAll(selectors.join(',')).forEach((node) => {
    node.style.maxWidth = '100vw';
    node.style.boxSizing = 'border-box';

    const fixedParent = node.closest('[style*="position: fixed"], [style*="position:fixed"]');
    if (fixedParent && fixedParent !== document.body) {
      fixedParent.style.maxWidth = '100vw';
      fixedParent.style.overflow = 'hidden';
      fixedParent.style.pointerEvents = 'auto';
    }
  });

  /* Div temporal del loader (position:fixed; z-index:9999) sin tamaño acotado */
  document.querySelectorAll('body > div').forEach((div) => {
    if (div.id === 'root') return;
    const style = div.getAttribute('style') || '';
    if (style.includes('position: fixed') && style.includes('z-index: 9999')) {
      div.style.maxWidth = '100vw';
      div.style.overflow = 'hidden';
      div.style.left = 'auto';
      div.style.right = '0';
    }
  });
}

export default function LeadConnectorChat() {
  useEffect(() => {
    const existing = document.querySelector(`script[src="${LOADER_SRC}"]`);
    if (!existing) {
      const script = document.createElement('script');
      script.src = LOADER_SRC;
      script.async = true;
      script.setAttribute('data-resources-url', RESOURCES_URL);
      script.setAttribute('data-widget-id', WIDGET_ID);
      document.body.appendChild(script);
    }

    constrainChatWidgetNodes();

    const observer = new MutationObserver(() => {
      constrainChatWidgetNodes();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const t1 = window.setTimeout(constrainChatWidgetNodes, 800);
    const t2 = window.setTimeout(constrainChatWidgetNodes, 2500);

    return () => {
      observer.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  return null;
}
