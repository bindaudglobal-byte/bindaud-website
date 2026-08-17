const path = require("path");
// Ensure env is loaded the same way as the app
require(path.resolve(__dirname, "..", "config", "env"));

const { createOrder } = require("../services/supabaseService");

(async () => {
  try {
    const sample = {
      orderNumber: `TEST-${Date.now().toString().slice(-6)}`,
      customerName: "Local Test",
      email: "",
      phone: "0000000000",
      address: "Test Address",
      city: "TestCity",
      products: [{ id: "p-1", name: "Test Product", price: 1000, quantity: 2 }],
      subtotal: 2000,
      discount: 0,
      shipping: 0,
      tax: 0,
      total: 2000,
      paymentMethod: "cash_on_delivery",
      status: "Payment Pending",
      paymentStatus: "pending",
      metadata: {},
    };

    console.log("Invoking createOrder with payload:", sample.orderNumber);
    const created = await createOrder(sample);
    console.log("Created order result:", created);
  } catch (err) {
    console.error(
      "Test createOrder failed:",
      err && err.message ? err.message : err,
    );
    if (err && err.details) console.error("Details:", err.details);
    process.exitCode = 2;
  }
})();
