# BIN DAUD Smart AI Assistant

## What this adds

The website now includes a floating BIN DAUD assistant in the bottom-right corner. It is designed to feel like a premium concierge for the brand and can help customers with:

- shopping and collections
- order help and tracking
- shipping and returns
- FAQ support
- WhatsApp, Instagram, Facebook, and contact help
- feedback submission with local storage

## Files

- js/config.js
  - Stores business contact details and shared configuration values.
- js/faq.js
  - Stores FAQ entries in one place so the assistant can search them quickly.
- js/chatbot.js
  - Handles the floating assistant UI, message handling, routing, feedback form, and social links.
- css/chatbot.css
  - Contains the assistant UI styling while reusing the existing BIN DAUD palette and typography.
- pages/track-order.html
  - A lightweight support page for tracking help and order questions.

## How to add more FAQs

Edit the FAQ list inside js/faq.js. Each item should include:

- id
- question
- answer
- keywords

The assistant will match user messages against the keywords automatically.

## How to add more routes

Update the route map inside js/chatbot.js in the buildRoute function.

## How to add more product keywords

Expand the product search logic inside js/chatbot.js where the assistant checks for keywords such as Dragon, Kimono, Oversized, Premium, Black, Blue, Shirt, and Collection.

## Future AI integration

The UI is already modular and isolated from the rest of the website. To connect OpenAI, Gemini, Claude, or another provider later:

1. Keep the existing conversation UI in js/chatbot.js.
2. Replace the local FAQ reply logic with an API call to your preferred provider.
3. Preserve the same route and feedback handling so the assistant stays consistent.
