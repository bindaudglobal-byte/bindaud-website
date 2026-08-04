const EMAIL_QUEUE_KEY = "binDaudEmailQueue";

const getWindow = () => (typeof window === "undefined" ? null : window);

const readQueue = () => {
  const win = getWindow();
  if (!win) return [];
  return Array.isArray(win.__BINDAUD_EMAIL_QUEUE)
    ? win.__BINDAUD_EMAIL_QUEUE
    : [];
};

const writeQueue = (value) => {
  const win = getWindow();
  if (!win) return;
  win.__BINDAUD_EMAIL_QUEUE = value;
};

// Send email via backend API
const getAdminApiBase = () => {
  if (typeof window !== "undefined" && window.BINDAUD_CONFIG?.api?.adminBase) {
    return window.BINDAUD_CONFIG.api.adminBase;
  }
  return "/api/admin";
};

const sendEmailViaBackend = async (
  type,
  email,
  customerName,
  orderData,
  orderNumber,
) => {
  try {
    const apiBase = getAdminApiBase();
    const response = await fetch(`${apiBase}/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        email,
        customerName,
        orderData,
        orderNumber,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.info("[Email] Sent successfully:", result.message);
      return { success: true, sent: true };
    }

    throw new Error(`API returned ${response.status}`);
  } catch (error) {
    console.warn(
      "[Email] Backend send failed, falling back to queue:",
      error.message,
    );
    return { success: false, sent: false, error: error.message };
  }
};

export const queueEmailNotification = (type, payload) => {
  const queue = readQueue();
  const entry = {
    id: `email-${Date.now()}`,
    type,
    payload,
    createdAt: new Date().toISOString(),
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
    orderReference: orderPayload.orderNumber || "Pending review",
    orderPayload,
  };

  // Try to send via backend first
  const backendResult = await sendEmailViaBackend(
    "order-confirmation",
    customerData.email,
    customerData.fullName,
    orderPayload,
    orderPayload.orderNumber || `ORD-${Date.now()}`,
  );

  // If backend fails, queue locally as fallback
  if (!backendResult.sent) {
    const queueEntry = queueEmailNotification("order", entry);
    console.info("[Email] Queued locally as fallback", queueEntry);
  }

  return entry;
};
