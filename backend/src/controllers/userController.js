const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

exports.list = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    res.json(users);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    
    const { name, email, epfNumber, password, role, status } = req.body;
    
   
    if (!email || !password || !name || !epfNumber) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    
   
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: 'Email already registered' });

    const existingEPF = await User.findOne({ epfNumber });
    if (existingEPF) return res.status(400).json({ message: 'EPF Number already registered' });

    const hash = await bcrypt.hash(password, 10);
    
   
    const user = await User.create({ name, email, epfNumber, password: hash, role, status });
    
    await AuditLog.create({ user: req.user?.email, type: 'create:user', message: `Created user ${email} (EPF: ${epfNumber})` });
    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json(user);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { email, epfNumber } = req.body;
    const userId = req.params.id;

    
    if (epfNumber) {
      const existingEPF = await User.findOne({ epfNumber, _id: { $ne: userId } });
      if (existingEPF) return res.status(400).json({ message: 'EPF Number already in use by another user' });
    }

    if (email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
      if (existingEmail) return res.status(400).json({ message: 'Email already in use by another user' });
    }

    const updateData = { ...req.body };
    if (updateData.password) updateData.password = await bcrypt.hash(updateData.password, 10);
    
    const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
    res.json(user);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};