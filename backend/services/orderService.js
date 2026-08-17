const Product = require("../models/Product");
const generateOrderId = require("../utils/generateOrderId");
const {
  isSupabaseEnabled,
  getSupabaseClient,
  buildSupabaseOrderPayload,
  normalizeSupabaseOrder,
  createOrder: createSupabaseOrder,
} = require("./supabaseService");

/**
 * Create order from customer's cart and persist to Supabase only.
 * - Calculates authoritative totals server-side
 * - Inserts into `orders` and `order_items`
 * - Clears customer's cartItems
 * - Prevents duplicate rapid orders by simple recent-match check
 */
const createOrderFromCart = async ({ customer, orderData }) => {
  if (!isSupabaseEnabled()) {
    throw new Error("Supabase is not configured for order persistence.");
  }

  const items = [];
  let subtotal = 0;

  for (const ci of customer.cartItems || []) {
    const product = await Product.findById(ci.product);
    if (!product) continue;

    const effectivePrice =
      product.salePrice > 0 ? product.salePrice : product.price || 0;
    const quantity = Number(ci.quantity) || 1;
    const itemTotal = effectivePrice * quantity;
    subtotal += itemTotal;

    items.push({
      product_id: product._id?.toString() || null,
      product_ref: product._id?.toString() || null,
      name: product.name || "",
      price: Number(product.price) || 0,
      sale_price: Number(product.salePrice) || Number(product.price) || 0,
      quantity,
      size: ci.size || "",
      color: ci.color || "",
      image: product.images[0]?.url || "",
    });
  }

  const shipping =
    Number(orderData.shippingCost || orderData.shipping || 250) || 0;
  const discount = Number(orderData.discount || 0) || 0;
  const tax = 0; // Must be exactly 0 for new orders
  const total = subtotal + shipping - discount + tax;

  // Build supabase order payload
  const orderPayload = {
    orderNumber: orderData.orderNumber || generateOrderId(),
    customerId: customer?._id?.toString() || null,
    customerName: orderData.customerName || customer?.name || "Guest",
    email: orderData.email || customer?.email || null,
    phone: orderData.phone || customer?.phone || null,
    address: orderData.address || customer?.address?.street || "" || null,
    city: orderData.city || customer?.address?.city || "" || null,
    province: orderData.province || customer?.address?.province || "" || null,
    postalCode:
      orderData.postalCode || customer?.address?.postalCode || "" || null,
    notes: orderData.notes || null,
    products: items.map((i) => ({
      id: i.product_id,
      name: i.name,
      price: i.price,
      salePrice: i.sale_price,
      quantity: i.quantity,
      size: i.size,
      color: i.color,
      image: i.image,
    })),
    subtotal,
    discount,
    shipping,
    tax,
    total,
    paymentMethod: orderData.paymentMethod || "cash_on_delivery",
    status: orderData.status || orderData.orderStatus || "Payment Pending",
    paymentStatus: orderData.paymentStatus || "pending",
    metadata: orderData.metadata || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  // Basic duplicate prevention: recent identical order for same customer/email+total
  try {
    const recentWindowStart = new Date(Date.now() - 30 * 1000).toISOString();
    const searchQuery = client
      .from("orders")
      .select("*")
      .or(
        customer?._id
          ? `customer_id.eq.${customer._id.toString()}`
          : `email.eq.${orderPayload.email}`,
      )
      .lte("created_at", new Date().toISOString())
      .gte("created_at", recentWindowStart);

    const { data: recentOrders } = await searchQuery;
    if (Array.isArray(recentOrders) && recentOrders.length) {
      const dup = recentOrders.find((o) => Number(o.total) === Number(total));
      if (dup) {
        return normalizeSupabaseOrder(dup);
      }
    }
  } catch (e) {
    // ignore search errors and continue to create
    console.warn("Duplicate-check failed:", e.message);
  }

  // Use supabaseService.createOrder which will insert order + order_items
  const created = await createSupabaseOrder(orderPayload);

  // Clear customer's server-side cart after successful create
  customer.cartItems = [];
  try {
    await customer.save();
  } catch (e) {
    console.warn(
      "Failed to clear customer cartItems after order create:",
      e.message,
    );
  }

  return created;
};

const updateOrderStatus = async (orderId, status) => {
  if (isSupabaseEnabled()) {
    const updated = await require("./supabaseService").updateOrderStatus(
      orderId,
      status,
    );
    return updated;
  }

  // Fallback for non-supabase environments (local/dev)
  const Order = require("../models/Order");
  const order = await Order.findByIdAndUpdate(
    orderId,
    { orderStatus: status },
    { new: true },
  );
  return order;
};

module.exports = {
  createOrderFromCart,
  updateOrderStatus,
};
