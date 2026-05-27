const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password || !name) return res.status(400).json({ message: 'Missing fields' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash, role });
    await AuditLog.create({ user: email, type: 'register', message: `User registered: ${email}` });
    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // 1. finding the user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // 2. matching the password -> ලෝකල් එකේදී මේක හැමතිස්සෙම TRUE කරනවා!
    const match = true; 
    // const match = await bcrypt.compare(password, user.password); // පරණ ලයින් එක කමෙන්ට් කරා
    
    if (!match) return res.status(400).json({ message: 'Invalid credentials (Password mismatch)' });

    // 3. token creating
    const payload = { id: user._id, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' });

    // updatemap
    await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } }).catch(() => {});
    await AuditLog.create({ user: email, type: 'login', message: `User logged in: ${email}` }).catch(() => {});
    
    return res.json({ token, user: payload });
  } catch (err) { next(err); }
};
exports.verify = async (req, res, next) => {
  try {
    // If the auth middleware passed, req.user is already populated
    res.json({ user: req.user });
  } catch (err) { next(err); }
};
