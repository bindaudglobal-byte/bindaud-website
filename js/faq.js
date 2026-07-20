export const FAQ_ITEMS = [
  {
    id: 'shipping',
    question: 'How long does shipping take?',
    answer: 'Most orders are delivered within 3 to 5 business days across Pakistan. Premium packaging and tracking are included.',
    keywords: ['shipping', 'delivery', 'arrive', 'time']
  },
  {
    id: 'returns',
    question: 'What is your return policy?',
    answer: 'Returns are accepted within 7 days for unused items in original condition. Please contact support for assistance.',
    keywords: ['return', 'refund', 'exchange', 'policy']
  },
  {
    id: 'payment',
    question: 'What payment methods do you accept?',
    answer: 'We support bank transfer, card payments, and cash on delivery where available.',
    keywords: ['payment', 'pay', 'card', 'cash', 'cod']
  },
  {
    id: 'size',
    question: 'How do I choose the right size?',
    answer: 'Our sizing guide is available on the shop page and support team can help if you need a recommendation.',
    keywords: ['size', 'fit', 'guide']
  },
  {
    id: 'support',
    question: 'How can I contact BIN DAUD?',
    answer: 'You can reach us by WhatsApp, Instagram, Facebook, or through our contact page.',
    keywords: ['contact', 'help', 'support']
  }
];

export function findMostRelevantFaq(message) {
  const normalized = message.toLowerCase();
  return FAQ_ITEMS.find((item) => item.keywords.some((keyword) => normalized.includes(keyword))) || null;
}
