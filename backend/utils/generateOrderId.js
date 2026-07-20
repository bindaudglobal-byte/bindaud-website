const generateOrderId = () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BIN-${datePart}-${randomPart}`;
};

module.exports = generateOrderId;
