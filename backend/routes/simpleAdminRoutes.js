const express = require("express");
const fs = require("fs");
const path = require("path");
const Product = require("../models/Product");
const Category = require("../models/Category");
const { uploadToCloudinary } = require("../config/cloudinary");
const {
  normalizeAdminProductPayload,
} = require("../utils/adminProductAdapter");
const upload = require("../middleware/upload");

const router = express.Router();
const productsFile = path.join(__dirname, "../data/products.json");
const githubRepository =
  process.env.GITHUB_REPOSITORY ||
  (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
    ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
    : "");
const githubBranch =
  process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || "main";
const githubToken = process.env.GITHUB_TOKEN;
const GITHUB_API_BASE = "https://api.github.com";
const uploadFields = upload.fields([
  { name: "images", maxCount: 8 },
  { name: "video", maxCount: 1 },
]);

const {
  isSupabaseEnabled,
  getSupabaseClient,
  createOrder: createSupabaseOrder,
  getOrders: getSupabaseOrders,
  updateOrderStatus: updateSupabaseOrderStatus,
} = require("../services/supabaseService");
const {
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendAdminNotification,
} = require("../services/emailService");

const cartSessions = new Map();

const getCookieValue = (req, name) => {
  const cookieHeader = req.headers.cookie || "";
  const cookie = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`));

  if (!cookie) return null;
  return decodeURIComponent(cookie.slice(name.length + 1));
};

const setSessionCookie = (
  res,
  name,
  value,
  maxAgeSeconds = 60 * 60 * 24 * 7,
) => {
  const cookieValue = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Lax`;
  res.setHeader("Set-Cookie", cookieValue);
};

const clearSessionCookie = (res, name) => {
  res.setHeader(
    "Set-Cookie",
    `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
  );
};

const getCartSession = (req) => {
  const existingSession = getCookieValue(req, "bindaud_cart_session");
  const sessionId =
    existingSession ||
    `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const cart = cartSessions.get(sessionId) || [];
  cartSessions.set(sessionId, cart);
  return { sessionId, cart };
};

const persistCartSession = (req, res, nextCart) => {
  const { sessionId } = getCartSession(req);
  cartSessions.set(sessionId, nextCart);
  setSessionCookie(res, "bindaud_cart_session", sessionId);
  return { sessionId, cart: nextCart };
};

const encodeGithubPath = (filePath) =>
  filePath.split("/").map(encodeURIComponent).join("/");

const getGithubHeaders = () => ({
  Authorization: `Bearer ${githubToken}`,
  "Content-Type": "application/json",
  "User-Agent": "bindaud-admin-backend",
});

const getGithubFileSha = async (filePath) => {
  const url = `${GITHUB_API_BASE}/repos/${githubRepository}/contents/${encodeGithubPath(filePath)}?ref=${githubBranch}`;
  const response = await fetch(url, { headers: getGithubHeaders() });
  if (response.status === 404) return null;
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `GitHub content lookup failed: ${response.status} ${errorText}`,
    );
  }
  const data = await response.json();
  return data.sha;
};

const commitGithubFile = async (filePath, content, message) => {
  if (!githubToken || !githubRepository) {
    throw new Error(
      "GitHub repository configuration is missing. Set GITHUB_TOKEN and GITHUB_REPOSITORY in your environment.",
    );
  }

  const sha = await getGithubFileSha(filePath);
  const encodedContent =
    typeof content === "string"
      ? Buffer.from(content, "utf8").toString("base64")
      : Buffer.from(content).toString("base64");

  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${githubRepository}/contents/${encodeGithubPath(filePath)}`,
    {
      method: "PUT",
      headers: getGithubHeaders(),
      body: JSON.stringify({
        message,
        content: encodedContent,
        branch: githubBranch,
        ...(sha ? { sha } : {}),
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub commit failed: ${response.status} ${errorText}`);
  }

  return response.json();
};

const normalizeFilename = (filename) => {
  const safeName = path.basename(filename || `product-${Date.now()}.jpg`);
  return safeName.replace(/[^a-zA-Z0-9._-]/g, "_");
};

const serializeProduct = (product) => {
  const plain = product.toObject ? product.toObject() : product;
  const images = Array.isArray(plain.images) ? plain.images : [];
  return {
    ...plain,
    id: plain._id?.toString() || plain.id,
    category:
      plain.category && typeof plain.category === "object"
        ? plain.category.name
        : plain.category,
    image: images[0]?.url || "",
    images,
    price: Number(plain.price) || 0,
    salePrice: Number(plain.salePrice) || 0,
    stock: Number(plain.stock) || 0,
    createdAt: plain.createdAt || new Date().toISOString(),
    updatedAt: plain.updatedAt || plain.createdAt || new Date().toISOString(),
  };
};

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const normalizeOrderForResponse = (order) => {
  if (!order) return order;
  const plain = order.toObject ? order.toObject() : order;
  const customer =
    plain.customer && typeof plain.customer === "object" ? plain.customer : {};

  return {
    id: plain._id?.toString() || plain.id,
    orderNumber:
      plain.orderNumber ||
      plain.orderNumber ||
      `ORD-${Date.now().toString().slice(-6)}`,
    customerName: customer.name || plain.customerName || "Guest Customer",
    email: plain.email || "",
    phone: plain.phone || "",
    address: plain.shippingAddress?.street || plain.address || "",
    city: plain.shippingAddress?.city || plain.city || "",
    province: plain.shippingAddress?.province || plain.province || "",
    postalCode: plain.shippingAddress?.postalCode || plain.postalCode || "",
    products: Array.isArray(plain.products) ? plain.products : [],
    subtotal: Number(plain.subtotal) || 0,
    discount: Number(plain.discount) || 0,
    shipping: Number(plain.shippingCost || plain.shipping) || 0,
    tax: Number(plain.tax) || 0,
    total: Number(plain.total) || 0,
    paymentMethod: plain.paymentMethod || "Cash on Delivery",
    status: plain.orderStatus || plain.status || "pending",
    paymentStatus: plain.paymentStatus || "pending",
    trackingNumber: plain.trackingNumber || "",
    notes: plain.notes || "",
    createdAt: plain.createdAt || plain.date || new Date().toISOString(),
    updatedAt: plain.updatedAt || new Date().toISOString(),
  };
};

const ensureOrderCustomer = async (payload) => {
  const Customer = require("../models/Customer");
  const safePayload = payload && typeof payload === "object" ? payload : {};
  const normalizedEmail = safePayload.email
    ? String(safePayload.email).trim().toLowerCase()
    : "";
  let customer = null;

  if (normalizedEmail) {
    customer = await Customer.findOne({ email: normalizedEmail });
  }

  if (!customer) {
    customer = await Customer.create({
      name:
        String(safePayload.customerName || "Guest Customer").trim() ||
        "Guest Customer",
      email: normalizedEmail || `guest+${Date.now()}@example.com`,
      phone: String(safePayload.phone || "").trim(),
      password: `Guest!${Date.now()}`,
      address: {
        street: String(safePayload.address || "").trim(),
        city: String(safePayload.city || "").trim(),
        province: String(safePayload.province || "").trim(),
        country: "Pakistan",
        postalCode: String(safePayload.postalCode || "").trim(),
      },
    });
  }

  return customer._id;
};

const getOrCreateCategory = async (categoryName) => {
  const normalizedName =
    String(categoryName || "Essentials").trim() || "Essentials";
  const slug = slugify(normalizedName);

  let category = await Category.findOne({
    $or: [{ name: normalizedName }, { slug }],
  });
  if (!category) {
    category = await Category.create({
      name: normalizedName,
      slug,
      description: `${normalizedName} products`,
      isActive: true,
    });
  }

  return category._id;
};

const uploadImageFiles = async (files = []) => {
  const uploadedImages = [];

  for (const file of files || []) {
    if (!file?.buffer) continue;

    try {
      const result = await uploadToCloudinary(file.buffer, "bindaud/products");
      uploadedImages.push({
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (error) {
      console.warn("Cloudinary upload skipped:", error.message);
    }
  }

  return uploadedImages;
};

const buildProductDocument = async (payload, files = []) => {
  const normalizedPayload = normalizeAdminProductPayload(payload || {});
  const category = await getOrCreateCategory(normalizedPayload.category);
  const uploadedImages = await uploadImageFiles(files.images || files);
  const persistedImages = uploadedImages.length
    ? uploadedImages
    : normalizedPayload.images;

  return {
    name: normalizedPayload.name || "New Product",
    description: normalizedPayload.description || "Premium BIN DAUD piece.",
    price: Number(normalizedPayload.price) || 0,
    salePrice: Number(normalizedPayload.salePrice) || 0,
    category,
    sizes: normalizedPayload.sizes,
    colors: normalizedPayload.colors,
    stock: Number(normalizedPayload.stock) || 0,
    images: persistedImages,
    featured: normalizedPayload.featured,
    bestSeller: normalizedPayload.bestSeller,
    collectionName: normalizedPayload.collectionName,
    isActive: normalizedPayload.isActive,
    code: normalizedPayload.code,
  };
};

// Auth Middleware (cookie-based)
const isAuthenticatedAdmin = (req) => {
  const cookieToken = getCookieValue(req, "bindaud_admin_session");
  const token = req.headers.authorization?.split(" ")[1];
  const normalizedToken = typeof token === "string" ? token.trim() : "";

  return (
    cookieToken === "admin-token-2026" ||
    (normalizedToken !== "" &&
      (normalizedToken === process.env.ADMIN_TOKEN ||
        normalizedToken === "admin-token-2026"))
  );
};

const authMiddleware = (req, res, next) => {
  if (isAuthenticatedAdmin(req)) {
    next();
  } else {
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

// GET /api/admin/session - Report whether an admin session is currently active
router.get("/session", (req, res) => {
  res.json({
    success: true,
    authenticated: isAuthenticatedAdmin(req),
  });
});

// POST /api/admin/login - Simple login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "Bindaud@2026") {
    setSessionCookie(res, "bindaud_admin_session", "admin-token-2026");
    res.json({
      success: true,
      token: "admin-token-2026",
      message: "Login successful",
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }
});

// POST /api/admin/logout - Clear the admin session cookie
router.post("/logout", (req, res) => {
  clearSessionCookie(res, "bindaud_admin_session");
  res.json({ success: true, message: "Logged out" });
});

// GET /api/admin/products - Get all products
router.get("/products", authMiddleware, async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category")
      .sort({ createdAt: -1 });
    res.json({ success: true, products: products.map(serializeProduct) });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to read products" });
  }
});

// POST /api/admin/products - Add new product
router.post("/products", authMiddleware, uploadFields, async (req, res) => {
  try {
    const productData = await buildProductDocument(req.body, req.files || {});
    const newProduct = await Product.create(productData);

    try {
      await commitGithubFile(
        "data/products.json",
        JSON.stringify({ products: [serializeProduct(newProduct)] }, null, 2),
        `Admin: add product ${newProduct.name}`,
      );
    } catch (gitError) {
      console.warn("GitHub commit failed:", gitError.message);
    }

    res.json({
      success: true,
      product: serializeProduct(newProduct),
      message: "Product added",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to add product: ${error.message}`,
    });
  }
});

// PUT /api/admin/products/:id - Update product
router.put("/products/:id", authMiddleware, uploadFields, async (req, res) => {
  try {
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const productData = await buildProductDocument(req.body, req.files || {});
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ...productData,
        images:
          Array.isArray(productData.images) && productData.images.length
            ? productData.images
            : existingProduct.images,
      },
      { new: true },
    );

    try {
      await commitGithubFile(
        "data/products.json",
        JSON.stringify(
          { products: [serializeProduct(updatedProduct)] },
          null,
          2,
        ),
        `Admin: update product ${updatedProduct.name}`,
      );
    } catch (gitError) {
      console.warn("GitHub commit failed:", gitError.message);
    }

    res.json({
      success: true,
      product: serializeProduct(updatedProduct),
      message: "Product updated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to update product: ${error.message}`,
    });
  }
});

// DELETE /api/admin/products/:id - Delete product
router.delete("/products/:id", authMiddleware, async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    try {
      await commitGithubFile(
        "data/products.json",
        JSON.stringify({ products: [] }, null, 2),
        `Admin: delete product ${req.params.id}`,
      );
    } catch (gitError) {
      console.warn("GitHub commit failed:", gitError.message);
    }

    res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to delete product: ${error.message}`,
    });
  }
});

// POST /api/admin/upload - Upload image to repository
router.post("/upload", authMiddleware, async (req, res) => {
  try {
    const { file, filename } = req.body;

    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "No file provided" });
    }

    const normalizedFilename = normalizeFilename(
      filename || `product-${Date.now()}.jpg`,
    );
    const filePath = `assets/products/${normalizedFilename}`;
    const fileData = file.includes(",") ? file.split(",")[1] : file;
    const buffer = Buffer.from(fileData, "base64");

    await commitGithubFile(
      filePath,
      buffer,
      `Admin: upload image ${normalizedFilename}`,
    );

    res.json({
      success: true,
      file: {
        name: normalizedFilename,
        path: filePath,
        uploadedAt: new Date().toISOString(),
      },
      message: "Image uploaded successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to upload image: ${error.message}`,
    });
  }
});

// PUBLIC: GET /api/admin/cart - Read the current cart for the active browser session
router.get("/cart", (req, res) => {
  const { sessionId, cart } = getCartSession(req);
  setSessionCookie(res, "bindaud_cart_session", sessionId);
  res.json({ success: true, data: { sessionId, cart } });
});

// PUBLIC: PUT /api/admin/cart - Persist cart state without browser storage
router.put("/cart", (req, res) => {
  try {
    const nextCart = Array.isArray(req.body?.cart) ? req.body.cart : [];
    const { sessionId, cart } = persistCartSession(req, res, nextCart);
    res.json({ success: true, data: { sessionId, cart } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUBLIC: DELETE /api/admin/cart - Clear the active cart session
router.delete("/cart", (req, res) => {
  const { sessionId } = getCartSession(req);
  cartSessions.set(sessionId, []);
  setSessionCookie(res, "bindaud_cart_session", sessionId);
  res.json({ success: true, data: { sessionId, cart: [] } });
});

// PUBLIC: GET /api/admin/orders/customer - Fetch a customer's order history from the server
router.get("/orders/customer", async (req, res) => {
  try {
    const searchQuery = String(req.query.query || "").trim();
    const email = String(req.query.email || "")
      .trim()
      .toLowerCase();
    const phone = String(req.query.phone || "").trim();
    const orderNumber = String(req.query.orderNumber || "").trim();

    let orders = [];
    if (isSupabaseEnabled()) {
      orders = await getSupabaseOrders(
        searchQuery || orderNumber || email || phone,
      );
    } else {
      const Order = require("../models/Order");
      const query = {};
      if (email) {
        query.email = email;
      }
      if (phone) {
        query.phone = phone;
      }
      if (orderNumber) {
        query.orderNumber = orderNumber;
      }

      const orderDocuments = await Order.find(query).sort({ createdAt: -1 });
      orders = orderDocuments.map(normalizeOrderForResponse);
    }

    const filteredOrders = orders.filter((order) => {
      if (email && String(order.email || "").toLowerCase() !== email) {
        return false;
      }
      if (phone && String(order.phone || "") !== phone) {
        return false;
      }
      if (orderNumber && String(order.orderNumber || "") !== orderNumber) {
        return false;
      }
      return true;
    });

    res.json({ success: true, data: filteredOrders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to fetch customer orders: ${error.message}`,
    });
  }
});

// PUBLIC: POST /api/admin/orders - Create order from customer checkout
router.post("/orders", upload.single("paymentProof"), async (req, res) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const rawProducts = body.products;
    let parsedProducts = [];

    if (Array.isArray(rawProducts)) {
      parsedProducts = rawProducts;
    } else if (typeof rawProducts === "string") {
      try {
        parsedProducts = JSON.parse(rawProducts);
      } catch (error) {
        parsedProducts = [];
      }
    }

    const paymentMethod = body.paymentMethod || "Cash on Delivery";
    const orderNumber =
      body.orderNumber || `ORD-${Date.now().toString().slice(-6)}`;
    const status = body.status || body.orderStatus || "Payment Pending";
    const paymentStatus =
      body.paymentStatus ||
      (paymentMethod === "Cash on Delivery" ? "cod" : "pending");
    const trackingNumber =
      body.trackingNumber ||
      `BD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const orderPayload = {
      customerName: body.customerName || "Guest",
      email: body.email || "",
      phone: body.phone || "",
      address: body.address || "",
      city: body.city || "",
      province: body.province || "",
      postalCode: body.postalCode || "",
      notes: body.notes || "",
      products: Array.isArray(parsedProducts) ? parsedProducts : [],
      subtotal: Number(body.subtotal) || 0,
      discount: Number(body.discount) || 0,
      shipping: Number(body.shipping) || 0,
      tax: Number(body.tax) || 0,
      total: Number(body.total) || 0,
      paymentMethod,
      status,
      paymentStatus,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: body.updatedAt || new Date().toISOString(),
      orderNumber,
      trackingNumber,
      metadata: {
        billingAddress: {
          fullName: body.billingName || body.customerName || "",
          address: body.billingAddress || "",
          city: body.billingCity || "",
          province: body.billingProvince || "",
          postalCode: body.billingPostalCode || "",
        },
        shippingAddress: {
          fullName: body.customerName || "",
          address: body.address || "",
          city: body.city || "",
          province: body.province || "",
          postalCode: body.postalCode || "",
        },
      },
    };

    let savedOrder;
    let paymentProofUrl = "";

    if (req.file && paymentMethod !== "Cash on Delivery") {
      try {
        const client = getSupabaseClient();
        const fileName = `${orderPayload.orderNumber}-${Date.now()}-${req.file.originalname || "payment-proof"}`;
        const uploadPath = `payment-proofs/${fileName}`;
        const { data, error } = await client.storage
          .from("bindaud-assets")
          .upload(uploadPath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: true,
          });

        if (!error && data?.path) {
          paymentProofUrl = `${process.env.SUPABASE_URL || ""}/storage/v1/object/public/bindaud-assets/${data.path}`;
          orderPayload.metadata.paymentProofUrl = paymentProofUrl;
          orderPayload.paymentProofUrl = paymentProofUrl;
        }
      } catch (uploadError) {
        console.warn("Payment proof upload skipped:", uploadError.message);
      }
    }

    if (!isSupabaseEnabled()) {
      return res.status(500).json({
        success: false,
        message:
          "Supabase is not configured for order persistence. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      });
    }

    // Persist order to Supabase (orders + order_items)
    savedOrder = await createSupabaseOrder(orderPayload);

    if (orderPayload.email) {
      try {
        await sendOrderConfirmation(savedOrder);
      } catch (emailError) {
        console.warn(
          "Email send failed, but order created:",
          emailError.message,
        );
      }
    }

    if (orderPayload.email && paymentProofUrl) {
      try {
        await sendAdminNotification({
          email: process.env.ADMIN_EMAIL || "hello@bindaud.com",
          subject: `Payment proof received for ${orderPayload.orderNumber}`,
          message: `A payment proof upload was attached to order ${orderPayload.orderNumber}. Please verify it in the admin dashboard.`,
        });
      } catch (notificationError) {
        console.warn("Admin notification failed:", notificationError.message);
      }
    }

    const responseOrder = savedOrder?.toObject
      ? normalizeOrderForResponse(savedOrder)
      : savedOrder;

    res.status(201).json({
      success: true,
      data: responseOrder,
      message: "Order created successfully",
    });
  } catch (error) {
    console.error("Order creation failed:", error);
    res.status(500).json({
      success: false,
      message: `Failed to create order: ${error.message}`,
      stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
    });
  }
});

// ADMIN: GET /api/admin/orders - Fetch all orders (admin view)
router.get("/orders", async (req, res) => {
  try {
    const searchQuery = String(req.query.query || "").trim();
    let orders = [];

    if (isSupabaseEnabled()) {
      orders = await getSupabaseOrders(searchQuery);
    } else {
      const Order = require("../models/Order");
      const query = {};

      if (searchQuery) {
        const searchRegExp = new RegExp(searchQuery, "i");
        query.$or = [
          { orderNumber: searchRegExp },
          { phone: searchRegExp },
          { email: searchRegExp },
          { "shippingAddress.city": searchRegExp },
        ];
      }

      const orderDocuments = await Order.find(query)
        .populate("customer")
        .sort({ createdAt: -1 });
      orders = orderDocuments.map(normalizeOrderForResponse);
    }

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to fetch orders: ${error.message}`,
    });
  }
});

// ADMIN: PUT /api/admin/orders/:id - Update order status
router.put("/orders/:id", async (req, res) => {
  try {
    const status = req.body.status || req.body.orderStatus;
    const paymentStatus = req.body.paymentStatus;
    let order;

    if (isSupabaseEnabled()) {
      order = await updateSupabaseOrderStatus(
        req.params.id,
        status,
        paymentStatus,
      );
    } else {
      const Order = require("../models/Order");
      order = await Order.findByIdAndUpdate(
        req.params.id,
        {
          orderStatus: status,
          paymentStatus,
          updatedAt: new Date(),
        },
        { new: true },
      ).populate("customer");

      if (order) {
        order = normalizeOrderForResponse(order);
      }
    }

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order?.email && typeof status === "string" && status.trim()) {
      try {
        const normalizedStatus = status.trim();
        const statusLabel = normalizedStatus.replace(/^./, (char) =>
          char.toUpperCase(),
        );
        await sendOrderStatusUpdate(order, statusLabel);
      } catch (emailError) {
        console.warn("Email send failed:", emailError.message);
      }
    }

    res.json({
      success: true,
      data: order,
      message: "Order updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to update order: ${error.message}`,
    });
  }
});

// PUBLIC: POST /api/email - Send email notifications (order confirmation, shipping updates)
router.post("/email", async (req, res) => {
  try {
    const { type, email, customerName, orderData, orderNumber } = req.body;

    if (!email || !type) {
      return res
        .status(400)
        .json({ success: false, message: "Email and type are required" });
    }

    const { sendMail } = require("../services/emailService");

    if (type === "order-confirmation") {
      // Send order confirmation email
      const emailHtml = `
        <h2>Order Confirmation</h2>
        <p>Hi ${customerName || "Customer"},</p>
        <p>Thank you for your order! We've received your order and will process it shortly.</p>
        <h3>Order Details:</h3>
        <p><strong>Order Number:</strong> ${orderNumber || "N/A"}</p>
        <p><strong>Total Amount:</strong> ${orderData?.total ? `Rs. ${Number(orderData.total).toFixed(2)}` : "N/A"}</p>
        <h4>Items:</h4>
        <ul>
          ${orderData?.products?.map((item) => `<li>${item.name || "Product"} × ${item.quantity || 1}</li>`).join("") || "<li>No items</li>"}
        </ul>
        <p>We'll send you a shipping update once your order is dispatched.</p>
        <p>Thank you for shopping with BIN DAUD!</p>
      `;

      await sendMail({
        to: email,
        subject: `Order Confirmation - ${orderNumber || "Your Order"}`,
        html: emailHtml,
      });

      return res.json({
        success: true,
        message: "Order confirmation email sent",
      });
    }

    if (type === "shipping-update") {
      // Send shipping update email
      const emailHtml = `
        <h2>Your Order is on the Way!</h2>
        <p>Hi ${customerName || "Customer"},</p>
        <p>Good news! Your order has been dispatched and is on its way to you.</p>
        <p><strong>Tracking Number:</strong> ${orderData?.trackingNumber || "N/A"}</p>
        <p>You can track your shipment using the tracking number above.</p>
        <p>Thank you for your patience!</p>
      `;

      await sendMail({
        to: email,
        subject: `Shipping Update - ${orderNumber || "Your Order"}`,
        html: emailHtml,
      });

      return res.json({ success: true, message: "Shipping update email sent" });
    }

    res
      .status(400)
      .json({ success: false, message: `Unknown email type: ${type}` });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to send email: ${error.message}`,
    });
  }
});

module.exports = router;
