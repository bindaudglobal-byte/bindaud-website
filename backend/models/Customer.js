const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      province: { type: String, default: '' },
      country: { type: String, default: '' },
      postalCode: { type: String, default: '' },
    },
    cartItems: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        salePrice: Number,
        quantity: { type: Number, default: 1 },
        size: String,
        color: String,
        image: String,
      },
    ],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Wishlist' }],
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
    isActive: {
      type: Boolean,
      default: true,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

customerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

customerSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

customerSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

module.exports = mongoose.model('Customer', customerSchema);
