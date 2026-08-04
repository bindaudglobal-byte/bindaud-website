const { createClient } = require("@supabase/supabase-js");
const { getSupabaseUrl, getSupabaseServiceRoleKey } = require("../config/env");

const getSupabaseClient = () => {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseServiceRoleKey();

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  if (global.__BINDAUD_SUPABASE_CLIENT) {
    return global.__BINDAUD_SUPABASE_CLIENT;
  }

  const client = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  global.__BINDAUD_SUPABASE_CLIENT = client;
  return client;
};

const isSupabaseEnabled = () => Boolean(getSupabaseClient());

const normalizeSupabaseOrder = (order) => {
  if (!order || typeof order !== "object") {
    return order;
  }

  return {
    id:
      order.id ||
      order.orderNumber ||
      order.order_number ||
      `ord-${Date.now()}`,
    orderNumber:
      order.orderNumber ||
      order.order_number ||
      order.id ||
      `ORD-${Date.now().toString().slice(-6)}`,
    customerName: order.customerName || order.customer_name || "Guest Customer",
    email: order.email || "",
    phone: order.phone || "",
    address: order.address || "",
    city: order.city || "",
    province: order.province || "",
    postalCode: order.postalCode || order.postal_code || "",
    notes: order.notes || "",
    products: Array.isArray(order.products) ? order.products : [],
    subtotal: Number(order.subtotal) || 0,
    discount: Number(order.discount) || 0,
    shipping: Number(order.shipping) || 0,
    tax: Number(order.tax) || 0,
    total: Number(order.total) || 0,
    paymentMethod:
      order.paymentMethod || order.payment_method || "Cash on Delivery",
    status:
      order.status || order.order_status || order.orderStatus || "Pending",
    paymentStatus: order.paymentStatus || order.payment_status || "pending",
    trackingNumber: order.trackingNumber || order.tracking_number || "",
    createdAt: order.createdAt || order.created_at || new Date().toISOString(),
    updatedAt: order.updatedAt || order.updated_at || new Date().toISOString(),
  };
};

const buildSupabaseOrderPayload = (order) => {
  const normalized = normalizeSupabaseOrder(order);
  return {
    id: normalized.id,
    order_number: normalized.orderNumber,
    customer_name: normalized.customerName,
    email: normalized.email,
    phone: normalized.phone,
    address: normalized.address,
    city: normalized.city,
    province: normalized.province,
    postal_code: normalized.postalCode,
    notes: normalized.notes,
    products: normalized.products,
    subtotal: normalized.subtotal,
    discount: normalized.discount,
    shipping: normalized.shipping,
    tax: normalized.tax,
    total: normalized.total,
    payment_method: normalized.paymentMethod,
    status: normalized.status,
    payment_status: normalized.paymentStatus,
    tracking_number: normalized.trackingNumber,
    created_at: normalized.createdAt,
    updated_at: normalized.updatedAt,
  };
};

const createOrder = async (orderData) => {
  const client = getSupabaseClient();

  if (!client) {
    throw new Error("Supabase is not configured for backend persistence.");
  }

  const payload = buildSupabaseOrderPayload(orderData);
  const { data, error } = await client.from("orders").insert(payload).single();

  if (error) {
    throw error;
  }

  return normalizeSupabaseOrder(data);
};

const getOrders = async (query = "") => {
  const client = getSupabaseClient();

  if (!client) {
    throw new Error("Supabase is not configured for backend persistence.");
  }

  const { data, error } = await client
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const orders = Array.isArray(data) ? data.map(normalizeSupabaseOrder) : [];

  if (!query) {
    return orders;
  }

  const searchTerm = String(query).trim().toLowerCase();
  return orders.filter((order) => {
    const combined =
      `${order.orderNumber} ${order.customerName} ${order.phone} ${order.city}`.toLowerCase();
    return combined.includes(searchTerm);
  });
};

const updateOrderStatus = async (orderId, status, paymentStatus) => {
  const client = getSupabaseClient();

  if (!client) {
    throw new Error("Supabase is not configured for backend persistence.");
  }

  const payload = {
    updated_at: new Date().toISOString(),
  };

  if (typeof status === "string" && status.trim()) {
    payload.status = status.trim();
  }

  if (typeof paymentStatus === "string" && paymentStatus.trim()) {
    payload.payment_status = paymentStatus.trim();
  }

  const { data, error } = await client
    .from("orders")
    .update(payload)
    .eq("id", orderId)
    .single();

  if (error) {
    throw error;
  }

  return normalizeSupabaseOrder(data);
};

module.exports = {
  getSupabaseClient,
  isSupabaseEnabled,
  normalizeSupabaseOrder,
  buildSupabaseOrderPayload,
  createOrder,
  getOrders,
  updateOrderStatus,
};
