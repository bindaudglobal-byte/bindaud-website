const EMAIL_QUEUE_KEY = 'binDaudEmailQueue';

const readQueue = () => {
  if (typeof window === 'undefined') return [];

  try {
    return JSON.parse(window.localStorage.getItem(EMAIL_QUEUE_KEY)) || [];
  } catch (error) {
    return [];
  }
};

const writeQueue = (value) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(EMAIL_QUEUE_KEY, JSON.stringify(value));
};

export const queueEmailNotification = (type, payload) => {
  const queue = readQueue();
  const entry = {
    id: `email-${Date.now()}`,
    type,
    payload,
    createdAt: new Date().toISOString()
  };

  queue.unshift(entry);
  writeQueue(queue);
  return entry;
};

export const getEmailQueue = () => readQueue();

export const queueOrderEmail = (customerData, orderPayload, totals) => {
  const entry = queueEmailNotification('order', {
    customerName: customerData.fullName,
    phone: customerData.phone,
    city: customerData.city,
    paymentMethod: customerData.paymentMethod,
    grandTotal: totals.grandTotal,
    orderReference: orderPayload.orderNumber || 'Pending review',
    orderPayload
  });

  if (typeof console !== 'undefined') {
    console.info('[Email] Prepared order notification', entry);
  }

  return entry;
};
