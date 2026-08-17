const Payment = require("../models/Payment");
const Order = require("../models/Order");
const {
  isSupabaseEnabled,
  getSupabaseClient,
  updateOrderStatus: updateSupabaseOrderStatus,
} = require("./supabaseService");

const createPayment = async ({
  orderId,
  customerId,
  amount,
  gateway,
  paymentMethod,
}) => {
  let orderRef = null;

  if (isSupabaseEnabled()) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();
    if (error || !data) {
      const err = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }
    orderRef = data.id || data.order_number;
  } else {
    const order = await Order.findById(orderId);
    if (!order) {
      const error = new Error("Order not found");
      error.statusCode = 404;
      throw error;
    }
    orderRef = order._id;
  }

  const payment = await Payment.create({
    order: orderRef,
    customer: customerId,
    amount,
    gateway,
    paymentMethod,
    status: "pending",
  });

  return payment;
};

const verifyPayment = async (transactionId) => {
  const payment = await Payment.findOne({ transactionId });
  if (!payment) {
    const error = new Error("Payment not found");
    error.statusCode = 404;
    throw error;
  }

  payment.status = "succeeded";
  payment.paidAt = new Date();
  await payment.save();

  // Update order payment status in Supabase when available
  if (isSupabaseEnabled()) {
    try {
      await updateSupabaseOrderStatus(payment.order, "confirmed", "paid");
    } catch (e) {
      console.warn(
        "Failed to update Supabase order payment status:",
        e.message,
      );
    }
  } else {
    await Order.findByIdAndUpdate(payment.order, { paymentStatus: "paid" });
  }

  return payment;
};

module.exports = {
  createPayment,
  verifyPayment,
};
