const hostname = (
  typeof window !== "undefined" ? window.location.hostname : ""
).toLowerCase();
const isLocalHost = ["localhost", "127.0.0.1", "0.0.0.0"].includes(hostname);

window.BINDAUD_CONFIG = {
  businessName: "BIN DAUD",
  whatsapp: "https://wa.me/923288582902",
  instagram: "https://www.instagram.com/bindaudglobal/",
  facebook: "https://www.facebook.com/profile.php?id=61591782530716",
  googleBusiness: "https://www.google.com/search?q=BIN+DAUD",
  phone: "+92 328 8582902",
  email: "hello@bindaud.com",
  shipping: "Free shipping across Pakistan on qualifying orders.",
  cod: "Cash on delivery is available for supported regions.",
  businessHours: "Mon - Sat • 10:00 AM - 8:00 PM",
  currency: "PKR",
  api: {
    adminBase: isLocalHost ? "http://127.0.0.1:5000/api/admin" : "",
    // Example: 'https://your-backend-domain.com/api/admin'
    // Supabase project URL (configured from your project ID)
    supabaseUrl: "https://tkggzqoyeldymegwrhax.supabase.co",
    // Supabase anon key (client-side)
    supabaseAnonKey: "", // DO NOT hardcode in source for production.
    // Configure this value at build/deploy time (e.g. Vercel NEXT_PUBLIC_SUPABASE_ANON_KEY)
    // Example: 'https://your-supabase-project-url.supabase.co'
    googleSheetsEndpoint: "",
    // Example: 'https://script.google.com/macros/s/your-script-id/exec'
  },
};
