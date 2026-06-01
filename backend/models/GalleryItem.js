const mongoose = require('mongoose');

const galleryItemSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
  image: {
    type: String, // URL из Cloudinary
    required: true,
  },
  caption: {
    type: String,
    default: '',
  },
  order: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('GalleryItem', galleryItemSchema);