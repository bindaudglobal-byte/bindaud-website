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

  const metadata =
    order.metadata && typeof order.metadata === "object" ? order.metadata : {};

  const customerName =
    order.customerName ||
    order.customer_name ||
    metadata.customerName ||
    metadata.customer_name ||
    "Guest Customer";
  const email = order.email || metadata.email || order.guest_email || "";
  const phone = order.phone || metadata.phone || "";
  const address = order.address || metadata.address || "";
  const city = order.city || metadata.city || "";
  const province = order.province || metadata.province || "";
  const postalCode =
    order.postalCode || order.postal_code || metadata.postalCode || "";
  const products = Array.isArray(order.products)
    ? order.products
    : Array.isArray(metadata.products)
      ? metadata.products
      : [];

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
    customerName,
    email,
    phone,
    address,
    city,
    province,
    postalCode,
    notes: order.notes || metadata.notes || "",
    products,
    subtotal: Number(order.subtotal) || 0,
    discount: Number(order.discount) || 0,
    shipping: Number(order.shipping) || 0,
    tax: Number(order.tax) || 0,
    total: Number(order.total) || 0,
    paymentMethod:
      order.paymentMethod ||
      order.payment_method ||
      metadata.paymentMethod ||
      "Cash on Delivery",
    status:
      order.status ||
      order.order_status ||
      metadata.status ||
      "Payment Pending",
    paymentStatus:
      order.paymentStatus ||
      order.payment_status ||
      metadata.paymentStatus ||
      "pending",
    trackingNumber:
      order.trackingNumber ||
      order.tracking_number ||
      metadata.trackingNumber ||
      "",
    createdAt:
      order.createdAt ||
      order.created_at ||
      metadata.createdAt ||
      new Date().toISOString(),
    updatedAt:
      order.updatedAt ||
      order.updated_at ||
      metadata.updatedAt ||
      new Date().toISOString(),
    paymentProofUrl: metadata.paymentProofUrl || "",
  };
};

const buildSupabaseOrderPayload = (order) => {
  const normalized = normalizeSupabaseOrder(order);
  const metadata = {
    customerName: normalized.customerName,
    email: normalized.email,
    phone: normalized.phone,
    address: normalized.address,
    city: normalized.city,
    province: normalized.province,
    postalCode: normalized.postalCode,
    notes: normalized.notes,
    paymentMethod: normalized.paymentMethod,
    paymentStatus: normalized.paymentStatus,
    products: normalized.products,
    shippingAddress: {
      street: normalized.address,
      city: normalized.city,
      province: normalized.province,
      postalCode: normalized.postalCode,
    },
    trackingNumber: normalized.trackingNumber,
    createdAt: normalized.createdAt,
    updatedAt: normalized.updatedAt,
    ...(order.metadata || {}),
  };

  return {
    id: normalized.id,
    order_number: normalized.orderNumber,
    customer_name: normalized.customerName,
    email: normalized.email || null,
    phone: normalized.phone || null,
    address: normalized.address || null,
    city: normalized.city || null,
    province: normalized.province || null,
    postal_code: normalized.postalCode || null,
    notes: normalized.notes || null,
    products: normalized.products || [],
    subtotal: normalized.subtotal,
    discount: normalized.discount,
    shipping: normalized.shipping,
    tax: normalized.tax,
    total: normalized.total,
    payment_method: normalized.paymentMethod,
    status: normalized.status,
    payment_status: normalized.paymentStatus,
    tracking_number: normalized.trackingNumber || null,
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
  // Enforce tax = 0 for new orders
  payload.tax = 0;

  // Insert order first
  console.log("Supabase order payload:", JSON.stringify(payload, null, 2));
  const { data: orderRow, error: orderError } = await client
    .from("orders")
    .insert(payload)
    .select("*")
    .single();

  if (orderError) {
    throw orderError;
  }

  const orderId = orderRow?.id || orderRow?.order_number || null;

  // Insert order items (if any) into `order_items` table
  const items = Array.isArray(orderData.products)
    ? orderData.products
    : payload.products || [];
  if (items.length) {
    const itemRows = items.map((p) => ({
      order_id: orderRow.id,
      product_id: p.id || null,
      name: p.name || null,
      price: Number(p.price) || 0,
      sale_price: Number(p.salePrice || p.sale_price) || 0,
      quantity: Number(p.quantity) || 1,
      size: p.size || null,
      color: p.color || null,
      image: p.image || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error: itemsError } = await client
      .from("order_items")
      .insert(itemRows);
    if (itemsError) {
      // Attempt to cleanup the created order to avoid partial state
      try {
        await client.from("orders").delete().eq("id", orderRow.id);
      } catch (cleanupErr) {
        console.warn(
          "Failed to cleanup order after item insert failure:",
          cleanupErr.message,
        );
      }
      throw itemsError;
    }
  }

  return normalizeSupabaseOrder(orderRow);
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
