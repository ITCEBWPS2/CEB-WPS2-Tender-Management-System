const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

exports.register = async (req, res, next) => {
  try {
    
    const { name, email, epfNumber, password, role } = req.body; 
    
    if (!email || !password || !name || !epfNumber) {
      return res.status(400).json({ message: 'Missing fields' });
    }

   
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: 'Email already registered' });

    const existingEPF = await User.findOne({ epfNumber });
    if (existingEPF) return res.status(400).json({ message: 'EPF Number already registered' });

    const hash = await bcrypt.hash(password, 10);
    
   
    const user = await User.create({ name, email, epfNumber, password: hash, role });
    
    await AuditLog.create({ user: email, type: 'register', message: `User registered: ${email} (EPF: ${epfNumber})` });
    
    res.status(201).json({ id: user._id, name: user.name, email: user.email, epfNumber: user.epfNumber, role: user.role });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try { 
    const { email, password } = req.body; 
    
    const user = await User.findOne({
      $or: [
        { email: email },
        { epfNumber: email }
      ]
    });

    if (!user) {
      console.log(`❌ LOGIN FAILED: Identifier not found -> ${email}`);
      return res.status(400).json({ message: 'Invalid email/EPF or password' });
    }

    const match = await bcrypt.compare(password, user.password); 
    
    console.log("--- LOGIN ATTEMPT ---");
    console.log("Input Identifier:", email);
    console.log("Found User Email:", user.email);
    console.log("Password Match Result:", match); 

    if (match === false || !match) {
      console.log(`❌ LOGIN FAILED: Password Mismatch for -> ${user.email}`);
      return res.status(401).json({ message: 'Invalid email/EPF or password' });
    }

    console.log(`✅ LOGIN SUCCESS: Authenticated -> ${user.email}`);
    
    
    const payload = { id: user._id, email: user.email, epfNumber: user.epfNumber, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } }).catch(() => {});
    await AuditLog.create({ user: user.email, type: 'login', message: `User logged in: ${user.email}` }).catch(() => {});
    
    return res.status(200).json({ token, user: payload });

  } catch (err) { 
    console.error("Server Error:", err);
    next(err); 
  }
};

exports.verify = async (req, res, next) => {
  try {
    res.json({ user: req.user });
  } catch (err) { next(err); }
};