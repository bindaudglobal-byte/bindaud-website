(() => {
  const config = window.BINDAUD_CONFIG || {};
  const origin = window.location.origin || "https://bindaud.com";
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const pageKey =
    path === "/" ? "home" : path.replace(/\.html$/, "").replace(/^\//, "");

  const pageMeta = {
    home: {
      title: "BIN DAUD | Premium Streetwear",
      description:
        "Premium oversized streetwear in Pakistan with bold design, comfort, and luxury craftsmanship.",
      url: `${origin}/`,
      image: `${origin}/assets/banners/banner.png`,
    },
    about: {
      title: "About BIN DAUD | Premium Streetwear",
      description:
        "Discover the story behind BIN DAUD and our premium streetwear philosophy.",
      url: `${origin}/about.html`,
      image: `${origin}/assets/logo/logo.png`,
    },
    shop: {
      title: "Shop BIN DAUD | Premium Streetwear",
      description:
        "Browse the latest premium streetwear collections from BIN DAUD.",
      url: `${origin}/pages/shop.html`,
      image: `${origin}/assets/products/product1.jpg`,
    },
    cart: {
      title: "Cart | BIN DAUD",
      description: "Review your premium streetwear cart before checkout.",
      url: `${origin}/pages/cart.html`,
      image: `${origin}/assets/products/product2.png`,
    },
    checkout: {
      title: "Checkout | BIN DAUD",
      description: "Complete your BIN DAUD order quickly and securely.",
      url: `${origin}/pages/checkout.html`,
      image: `${origin}/assets/products/product3.png`,
    },
    collections: {
      title: "Collections | BIN DAUD",
      description:
        "Discover BIN DAUD collections created for modern streetwear culture.",
      url: `${origin}/pages/collections.html`,
      image: `${origin}/assets/banners/banner.png`,
    },
    contact: {
      title: "Contact BIN DAUD",
      description:
        "Get in touch with BIN DAUD for orders, support, and collaborations.",
      url: `${origin}/pages/contact.html`,
      image: `${origin}/assets/logo/logo.png`,
    },
    default: {
      title: "BIN DAUD | Premium Streetwear",
      description:
        "Premium oversized streetwear in Pakistan with bold design, comfort, and luxury craftsmanship.",
      url: `${origin}${path || "/"}`,
      image: `${origin}/assets/logo/logo.png`,
    },
  };

  const meta = pageMeta[pageKey] || pageMeta.default;

  const setMeta = (name, content) => {
    let tag = document.querySelector(`meta[name="${name}"]`);
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("name", name);
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", content);
  };

  const setProp = (prop, content) => {
    let tag = document.querySelector(`meta[property="${prop}"]`);
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("property", prop);
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", content);
  };

  document.title = meta.title;
  setMeta("description", meta.description);
  setMeta("robots", "index,follow,max-image-preview:large");
  setMeta("theme-color", config.themeColor || "#21486B");
  setProp("og:title", meta.title);
  setProp("og:description", meta.description);
  setProp("og:type", "website");
  setProp("og:url", meta.url);
  setProp("og:image", meta.image);
  setProp("og:site_name", "BIN DAUD");
  setProp("twitter:card", "summary_large_image");
  setProp("twitter:title", meta.title);
  setProp("twitter:description", meta.description);
  setProp("twitter:image", meta.image);

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", meta.url);

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "BIN DAUD",
      url: origin,
      logo: `${origin}/assets/logo/logo.png`,
      sameAs: [
        config.instagram || "https://www.instagram.com/bindaudglobal/",
        config.facebook ||
          "https://www.facebook.com/profile.php?id=61591782530716",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        telephone: config.phone || "+92 328 8582902",
        contactType: "customer service",
        areaServed: "PK",
        availableLanguage: ["English", "Urdu"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "BIN DAUD",
      url: origin,
      potentialAction: {
        "@type": "SearchAction",
        target: `${origin}/pages/shop.html?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Dragon Kimono",
          url: `${origin}/pages/shop.html`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Crane Kimono",
          url: `${origin}/pages/shop.html`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Premium Collection",
          url: `${origin}/pages/shop.html`,
        },
      ],
    },
  ];

  const existing = document.querySelectorAll(
    'script[type="application/ld+json"]',
  );
  existing.forEach((node) => node.remove());

  schema.forEach((entry) => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(entry);
    document.head.appendChild(script);
  });
})();
