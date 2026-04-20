const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },       
  phone: { type: String, required: true },      
  source: { type: String },                     
  comment: { type: String },                    
  status: { 
    type: String, 
    enum: ['Новый', 'В работе', 'Закрыт', 'Отказ'], 
    default: 'Новый' 
  },
  adminName: { type: String, default: 'Andrew' },
  
  // --- НОВЫЕ ПОЛЯ ---
  price: { type: Number, default: 0 }, // Цена проекта
  businessType: { 
    type: String, 
    enum: ['Ресторан', 'Барбершоп', 'Цветочный магазин', 'Другое'], 
    default: 'Другое' 
  },
  servicesRequested: [{ type: String }] // Массив строк (выбранные услуги)
  
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);