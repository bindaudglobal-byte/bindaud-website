import { FAQ_ITEMS, findMostRelevantFaq } from './faq.js';

const STORAGE_KEY = 'bindaud_chatbot_feedback';
let assistantRoot = null;
let isOpen = false;
let feedbackMode = false;

function getConfig() {
  return window.BINDAUD_CONFIG || {};
}

function getBasePath() {
  return window.location.pathname.includes('/pages/') ? '../' : '';
}

function ensureChatbotStyles() {
  if (document.querySelector('link[data-chatbot-styles="true"]')) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `${getBasePath()}css/chatbot.css`;
  link.setAttribute('data-chatbot-styles', 'true');
  document.head.appendChild(link);
}

function buildRoute(route) {
  const base = getBasePath();
  const routeMap = {
    shop: `${base}pages/shop.html`,
    collections: `${base}pages/collections.html`,
    about: `${base}about.html`,
    contact: `${base}pages/contact.html`,
    shipping: `${base}pages/shipping.html`,
    returns: `${base}pages/returns.html`,
    faq: `${base}pages/faq.html`,
    privacy: `${base}privacy.html`,
    terms: `${base}terms.html`,
    cookies: `${base}cookies.html`,
    trackOrder: `${base}pages/track-order.html`
  };

  return routeMap[route] || `${base}pages/shop.html`;
}

function navigateTo(route, searchTerm = null) {
  const target = new URL(buildRoute(route), window.location.href);
  if (searchTerm) {
    target.searchParams.set('search', searchTerm);
  }
  window.location.href = target.toString();
}

function openSocial(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function createElement(tagName, className = '', text = '') {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (text) {
    element.textContent = text;
  }
  return element;
}

function addMessage(container, text, role = 'assistant') {
  const message = createElement('div', `assistant-message assistant-message--${role}`);
  message.innerHTML = `<p>${text}</p>`;
  container.appendChild(message);
  container.scrollTop = container.scrollHeight;
}

function renderQuickActions(container) {
  const buttons = [
    { label: '🛍 Shop Products', action: () => navigateTo('shop') },
    { label: '🧺 Collections', action: () => navigateTo('collections') },
    { label: '📦 Track Order', action: () => navigateTo('trackOrder') },
    { label: '📞 Contact', action: () => navigateTo('contact') },
    { label: '🚚 Shipping', action: () => navigateTo('shipping') },
    { label: '↩️ Returns', action: () => navigateTo('returns') },
    { label: '❓ FAQ', action: () => navigateTo('faq') },
    { label: '📷 Instagram', action: () => openSocial(getConfig().instagram) },
    { label: '📘 Facebook', action: () => openSocial(getConfig().facebook) },
    { label: '💬 WhatsApp', action: () => openSocial(getConfig().whatsapp) },
    { label: '📝 Feedback', action: () => showFeedbackForm() },
    { label: '💡 Suggestions', action: () => showFeedbackForm() }
  ];

  const actions = createElement('div', 'assistant-actions');
  buttons.forEach((button) => {
    const element = createElement('button', 'btn btn-ghost assistant-chip');
    element.type = 'button';
    element.textContent = button.label;
    element.addEventListener('click', () => {
      if (button.action) {
        button.action();
      }
    });
    actions.appendChild(element);
  });

  container.innerHTML = '';
  container.appendChild(actions);
}

function renderWelcome() {
  const container = document.querySelector('#assistant-messages');
  if (!container) {
    return;
  }

  container.innerHTML = '';
  addMessage(container, 'Hello 👋<br>Welcome to BIN DAUD.<br><br>I can help you with:<br>🛍 Shop Products<br>📦 Track Orders<br>📏 Size Guide<br>🚚 Shipping<br>💳 Payment<br>⭐ Best Sellers<br>🔥 New Collection<br>📞 Contact<br>💬 WhatsApp<br>📷 Instagram<br>📘 Facebook<br>❓ FAQ<br><br>Choose an option below or type your question.', 'assistant');
  renderQuickActions(document.querySelector('#assistant-actions'));
}

function showFeedbackForm() {
  feedbackMode = true;
  const container = document.querySelector('#assistant-messages');
  const actions = document.querySelector('#assistant-actions');
  if (!container || !actions) {
    return;
  }

  container.innerHTML = '';
  addMessage(container, 'We value your feedback. Share your experience and we will review it shortly.', 'assistant');
  actions.innerHTML = '';

  const form = createElement('form', 'assistant-feedback');
  form.innerHTML = `
    <label>
      <span>Name</span>
      <input type="text" name="name" placeholder="Your name" required>
    </label>
    <label>
      <span>Email</span>
      <input type="email" name="email" placeholder="Optional email">
    </label>
    <label>
      <span>Message</span>
      <textarea name="message" rows="4" placeholder="Tell us what you think"></textarea>
    </label>
    <button type="submit" class="btn btn-primary assistant-submit">Submit Feedback</button>
  `;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const feedback = {
      name: formData.get('name') || 'Anonymous',
      email: formData.get('email') || '',
      message: formData.get('message') || '',
      timestamp: new Date().toISOString()
    };

    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existing.push(feedback);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

    addMessage(container, 'Thank you for your feedback. We have saved it for future review and backend integration.', 'assistant');
    form.remove();
    renderQuickActions(actions);
    feedbackMode = false;
  });

  actions.appendChild(form);
}

function handleUserMessage(message) {
  const normalized = message.toLowerCase();
  const container = document.querySelector('#assistant-messages');
  const actions = document.querySelector('#assistant-actions');

  if (!container || !actions) {
    return;
  }

  if (feedbackMode) {
    showFeedbackForm();
    return;
  }

  if (normalized.includes('i want to order') || normalized.includes('i want to buy') || normalized.includes('start shopping')) {
    addMessage(container, 'Great choice!<br>Click below to start your order.', 'assistant');
    actions.innerHTML = '';
    const button = createElement('button', 'btn btn-primary assistant-chip');
    button.type = 'button';
    button.textContent = '🛍 Start Shopping';
    button.addEventListener('click', () => navigateTo('shop'));
    actions.appendChild(button);
    return;
  }

  if (normalized.includes('i need help') || normalized.includes('i have a question') || normalized.includes('talk to someone')) {
    addMessage(container, 'You can contact us anytime. We are here to help.', 'assistant');
    const supportActions = createElement('div', 'assistant-actions assistant-actions--stack');
    [
      { label: '💬 WhatsApp', action: () => openSocial(getConfig().whatsapp) },
      { label: '📘 Facebook', action: () => openSocial(getConfig().facebook) },
      { label: '📷 Instagram', action: () => openSocial(getConfig().instagram) },
      { label: '📞 Contact Page', action: () => navigateTo('contact') }
    ].forEach((item) => {
      const button = createElement('button', 'btn btn-ghost assistant-chip');
      button.type = 'button';
      button.textContent = item.label;
      button.addEventListener('click', item.action);
      supportActions.appendChild(button);
    });
    actions.innerHTML = '';
    actions.appendChild(supportActions);
    return;
  }

  if (normalized.includes('feedback') || normalized.includes('suggestion') || normalized.includes('complaint') || normalized.includes('review')) {
    showFeedbackForm();
    return;
  }

  if (normalized.includes('shop') || normalized.includes('buy') || normalized.includes('product') || normalized.includes('products')) {
    navigateTo('shop');
    addMessage(container, 'Opening our shop so you can explore the latest collection.', 'assistant');
    return;
  }

  if (normalized.includes('collection') || normalized.includes('collections')) {
    navigateTo('collections');
    addMessage(container, 'Opening the collections page for you.', 'assistant');
    return;
  }

  if (normalized.includes('about')) {
    navigateTo('about');
    addMessage(container, 'Opening our brand story page.', 'assistant');
    return;
  }

  if (normalized.includes('contact') || normalized.includes('location')) {
    navigateTo('contact');
    addMessage(container, 'Opening our contact page.', 'assistant');
    return;
  }

  if (normalized.includes('faq')) {
    navigateTo('faq');
    addMessage(container, 'Opening FAQs for quick answers.', 'assistant');
    return;
  }

  if (normalized.includes('privacy')) {
    navigateTo('privacy');
    addMessage(container, 'Opening our privacy policy.', 'assistant');
    return;
  }

  if (normalized.includes('terms')) {
    navigateTo('terms');
    addMessage(container, 'Opening our terms and conditions.', 'assistant');
    return;
  }

  if (normalized.includes('shipping')) {
    navigateTo('shipping');
    addMessage(container, 'Opening our shipping details.', 'assistant');
    return;
  }

  if (normalized.includes('return') || normalized.includes('refund')) {
    navigateTo('returns');
    addMessage(container, 'Opening our returns and refund policy.', 'assistant');
    return;
  }

  if (normalized.includes('track order')) {
    navigateTo('trackOrder');
    addMessage(container, 'Opening the tracking help page.', 'assistant');
    return;
  }

  if (normalized.includes('instagram')) {
    openSocial(getConfig().instagram);
    addMessage(container, 'Opening Instagram for the latest drops.', 'assistant');
    return;
  }

  if (normalized.includes('facebook')) {
    openSocial(getConfig().facebook);
    addMessage(container, 'Opening Facebook for updates.', 'assistant');
    return;
  }

  if (normalized.includes('whatsapp')) {
    openSocial(getConfig().whatsapp);
    addMessage(container, 'Opening WhatsApp for direct support.', 'assistant');
    return;
  }

  if (normalized.includes('google reviews')) {
    openSocial(getConfig().googleBusiness);
    addMessage(container, 'Opening the Google Business profile.', 'assistant');
    return;
  }

  if (normalized.includes('dragon') || normalized.includes('kimono') || normalized.includes('oversized') || normalized.includes('premium') || normalized.includes('black') || normalized.includes('blue') || normalized.includes('shirt') || normalized.includes('collection')) {
    navigateTo('shop', normalized.split(/\s+/).find(Boolean) || 'collection');
    addMessage(container, 'I found a few matching products. Opening the shop for you now.', 'assistant');
    return;
  }

  const faqMatch = findMostRelevantFaq(message);
  if (faqMatch) {
    addMessage(container, `I found a helpful answer:<br>${faqMatch.answer}`, 'assistant');
    renderQuickActions(actions);
    return;
  }

  addMessage(container, 'I can help with shopping, orders, sizing, payments, shipping, returns, FAQ, or social support. Try one of the quick buttons above.', 'assistant');
  renderQuickActions(actions);
}

export function initChatbot() {
  if (assistantRoot || document.getElementById('bindaud-assistant-root')) {
    return;
  }

  // Do not initialize chatbot on admin pages or when explicitly disabled
  try {
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    if (window.BIN_DAUD_DISABLE_CHATBOT === true || path.includes('admin-login.html') || path.includes('admin-dashboard.html')) {
      return;
    }
  } catch (e) {
    // ignore
  }

  ensureChatbotStyles();

  // single, consistent initialization
  assistantRoot = createElement('div', 'bindaud-assistant-root');
  assistantRoot.id = 'bindaud-assistant-root';

  const shell = createElement('div', 'assistant-shell');
  const toggleButton = createElement('button', 'assistant-toggle');
  toggleButton.type = 'button';
  toggleButton.setAttribute('aria-expanded', 'false');
  toggleButton.setAttribute('aria-label', 'Open BIN DAUD assistant');
  const logoSrc = `${getBasePath()}assets/icons/bindaud-agent.png`;
  toggleButton.innerHTML = `
    <span class="assistant-toggle__logo">
      <img src="${logoSrc}" alt="BIN DAUD AI Assistant" onerror="this.onerror=null; this.src='${getBasePath()}assets/icons/empty-cart.svg';">
    </span>
    <span class="assistant-toggle__glow"></span>
  `;

  const panel = createElement('div', 'assistant-panel');
  panel.setAttribute('aria-live', 'polite');
  panel.innerHTML = `
    <div class="assistant-header">
      <div class="assistant-brand">
        <span class="assistant-brand__logo">B</span>
        <div>
          <strong>${getConfig().businessName || 'BIN DAUD'} Assistant</strong>
          <p>Always here to help.</p>
        </div>
      </div>
      <button type="button" class="assistant-close" aria-label="Close assistant">×</button>
    </div>
    <div class="assistant-messages" id="assistant-messages"></div>
    <div class="assistant-actions" id="assistant-actions"></div>
    <form class="assistant-form" id="assistant-form">
      <input type="text" id="assistant-input" placeholder="Ask about products, orders, or support" autocomplete="off">
      <button type="submit" class="btn btn-primary assistant-submit">Send</button>
    </form>
  `;

  shell.appendChild(toggleButton);
  shell.appendChild(panel);
  assistantRoot.appendChild(shell);
  document.body.appendChild(assistantRoot);

  const messages = panel.querySelector('#assistant-messages');
  const actions = panel.querySelector('#assistant-actions');
  const form = panel.querySelector('#assistant-form');
  const input = panel.querySelector('#assistant-input');
  const closeButton = panel.querySelector('.assistant-close');

  toggleButton.addEventListener('click', () => {
    isOpen = !isOpen;
    panel.classList.toggle('is-open', isOpen);
    toggleButton.classList.toggle('is-open', isOpen);
    toggleButton.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) {
      renderWelcome();
      input.focus();
    }
  });

  closeButton.addEventListener('click', () => {
    isOpen = false;
    panel.classList.remove('is-open');
    toggleButton.classList.remove('is-open');
    toggleButton.setAttribute('aria-expanded', 'false');
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) {
      return;
    }
    addMessage(messages, value, 'user');
    input.value = '';
    handleUserMessage(value);
  });

  renderWelcome();
  panel.classList.remove('is-open');
}
