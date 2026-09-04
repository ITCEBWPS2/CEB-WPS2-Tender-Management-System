const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const AuditLog = require('../utils/auditLogger');

const formatUserPayload = (row) => ({
  _id: row.id,
  id: row.id,
  name: row.name || '',
  email: row.email || '',
  epfNumber: row.epf_number || '',
  role: row.role || 'Clerk'
});

exports.login = async (req, res, next) => {
  try { 
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Invalid email/EPF or password' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${email},epf_number.eq.${email}`)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      console.log(`❌ LOGIN FAILED: Identifier not found -> ${email}`);
      return res.status(400).json({ message: 'Invalid email/EPF or password' });
    }

    const match = await bcrypt.compare(password, user.password); 

    if (match === false || !match) {
      console.log(`❌ LOGIN FAILED: Password Mismatch for -> ${user.email}`);
      return res.status(401).json({ message: 'Invalid email/EPF or password' });
    }

    console.log(`✅ LOGIN SUCCESS: Authenticated -> ${user.email}`);

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not configured');
    }

    const payload = formatUserPayload(user);
    const token = jwt.sign(payload, secret, { expiresIn: '8h' });

    try {
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);
    } catch (llErr) {
      console.error('Last login update error:', llErr);
    }

    await AuditLog.create({ 
      user: user.email, 
      type: 'login', 
      message: `User logged in: ${user.email}` 
    }).catch(err => console.error('AuditLog error:', err));

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