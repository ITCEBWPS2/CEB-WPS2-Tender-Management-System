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
    
    // 
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ LOGIN FAILED: Email not found -> ${email}`);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // 
    const match = await bcrypt.compare(password, user.password); 
    
    console.log("--- LOGIN ATTEMPT ---");
    console.log("User Email:", email);
    console.log("Password Match Result:", match); //checking the matching password

    // 
    if (match === false || !match) {
      console.log(`❌ LOGIN FAILED: Password Mismatch for -> ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 4. 
    console.log(`✅ LOGIN SUCCESS: Authenticated -> ${email}`);
    const payload = { id: user._id, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' });

    await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } }).catch(() => {});
    await AuditLog.create({ user: email, type: 'login', message: `User logged in: ${email}` }).catch(() => {});
    
    return res.status(200).json({ token, user: payload });

  } catch (err) { 
    console.error("Server Error:", err);
    next(err); 
  }
};

exports.verify = async (req, res, next) => {
  try {
    // If the auth middleware passed, req.user is already populated
    res.json({ user: req.user });
  } catch (err) { next(err); }
};