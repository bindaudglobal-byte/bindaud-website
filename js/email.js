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

// Send email via backend API
const sendEmailViaBackend = async (type, email, customerName, orderData, orderNumber) => {
  try {
    const response = await fetch('/api/admin/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        email,
        customerName,
        orderData,
        orderNumber
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.info('[Email] Sent successfully:', result.message);
      return { success: true, sent: true };
    }

    throw new Error(`API returned ${response.status}`);
  } catch (error) {
    console.warn('[Email] Backend send failed, falling back to queue:', error.message);
    return { success: false, sent: false, error: error.message };
  }
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

export const queueOrderEmail = async (customerData, orderPayload, totals) => {
  const entry = {
    customerName: customerData.fullName,
    phone: customerData.phone,
    email: customerData.email,
    city: customerData.city,
    paymentMethod: customerData.paymentMethod,
    grandTotal: totals.grandTotal,
    orderReference: orderPayload.orderNumber || 'Pending review',
    orderPayload
  };

  // Try to send via backend first
  const backendResult = await sendEmailViaBackend(
    'order-confirmation',
    customerData.email,
    customerData.fullName,
    orderPayload,
    orderPayload.orderNumber || `ORD-${Date.now()}`
  );

  // If backend fails, queue locally as fallback
  if (!backendResult.sent) {
    const queueEntry = queueEmailNotification('order', entry);
    console.info('[Email] Queued locally as fallback', queueEntry);
  }

  return entry;
};

