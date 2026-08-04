const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildSupabaseOrderPayload,
  normalizeSupabaseOrder,
} = require("../services/supabaseService");

test("buildSupabaseOrderPayload maps order data to snake_case columns for Supabase", () => {
  const payload = buildSupabaseOrderPayload({
    orderNumber: "ORD-123456",
    customerName: "Jane Doe",
    email: "jane@example.com",
    phone: "123456789",
    address: "Main St",
    city: "Lahore",
    province: "Punjab",
    postalCode: "54000",
    notes: "Please ring the bell",
    products: [{ name: "Shirt", price: 10 }],
    subtotal: 10,
    discount: 0,
    shipping: 5,
    tax: 1,
    total: 16,
    paymentMethod: "Cash on Delivery",
    status: "Pending",
    paymentStatus: "pending",
    trackingNumber: "TN123",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  });

  assert.deepEqual(payload, {
    id: "ORD-123456",
    order_number: "ORD-123456",
    customer_name: "Jane Doe",
    email: "jane@example.com",
    phone: "123456789",
    address: "Main St",
    city: "Lahore",
    province: "Punjab",
    postal_code: "54000",
    notes: "Please ring the bell",
    products: [{ name: "Shirt", price: 10 }],
    subtotal: 10,
    discount: 0,
    shipping: 5,
    tax: 1,
    total: 16,
    payment_method: "Cash on Delivery",
    status: "Pending",
    payment_status: "pending",
    tracking_number: "TN123",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  });
});

test("normalizeSupabaseOrder maps snake_case rows back to camelCase for the app", () => {
  const normalized = normalizeSupabaseOrder({
    id: "ORD-999",
    order_number: "ORD-999",
    customer_name: "Alex",
    email: "alex@example.com",
    payment_method: "Card",
    payment_status: "paid",
    tracking_number: "TRACK-1",
    created_at: "2024-02-01T00:00:00Z",
    updated_at: "2024-02-01T00:00:00Z",
  });

  assert.equal(normalized.orderNumber, "ORD-999");
  assert.equal(normalized.customerName, "Alex");
  assert.equal(normalized.paymentMethod, "Card");
  assert.equal(normalized.paymentStatus, "paid");
  assert.equal(normalized.trackingNumber, "TRACK-1");
  assert.equal(normalized.createdAt, "2024-02-01T00:00:00Z");
});
