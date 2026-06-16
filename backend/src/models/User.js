const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  
  epfNumber: { type: String, required: true, unique: true }, 
  password: { type: String, required: true },
  role: { 
    type: String, 
    // Database enums updated to accept standardized Clerk and CECOM roles natively
    enum: ['Super Admin', 'Admin', 'Procurement', 'Clerk', 'CECOM'], 
    default: 'Admin' 
  },
  status: { type: String, default: 'Active' },
  lastLogin: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);