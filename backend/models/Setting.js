const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      default: 'BIN DAUD',
    },
    contactEmail: {
      type: String,
      default: 'hello@bindaud.com',
    },
    supportPhone: {
      type: String,
      default: '+92 300 0000000',
    },
    currency: {
      type: String,
      default: 'PKR',
    },
    shippingCost: {
      type: Number,
      default: 250,
    },
    taxRate: {
      type: Number,
      default: 0,
    },
    storeAddress: {
      type: String,
      default: 'Lahore, Pakistan',
    },
    socialLinks: {
      instagram: { type: String, default: '' },
      facebook: { type: String, default: '' },
      tiktok: { type: String, default: '' },
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Setting', settingSchema);
