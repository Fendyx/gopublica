const mongoose = require('mongoose');

const newsPostSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
      default: 'gopublica',
    },
    type: {
      type: String,
      enum: ['info', 'marketing', 'alert'],
      default: 'info',
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    // Таргетинг
    targetTenants: [
      {
        type: String,
      },
    ],
    targetTariffs: [
      {
        type: String,
      },
    ],
    // Показывать ли клиентам, зарегистрированным после публикации
    showToNewClients: {
      type: Boolean,
      default: false,
    },
    // Дата, после которой новость не показывается
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('NewsPost', newsPostSchema);