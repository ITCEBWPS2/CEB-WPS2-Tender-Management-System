const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');
const AuditLog = require('../utils/auditLogger');

const formatUser = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name || '',
    email: row.email || '',
    epfNumber: row.epf_number || '',
    role: row.role || 'Clerk',
    status: row.status || 'Active',
    lastLogin: row.last_login || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const SELECT_SAFE_USER_FIELDS = 'id, name, email, epf_number, role, status, last_login, created_at, updated_at';

exports.list = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(SELECT_SAFE_USER_FIELDS)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const items = (data || []).map(formatUser);
    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, email, epfNumber, password, role, status } = req.body;

    if (!email || !password || !name || !epfNumber) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingEmail) return res.status(400).json({ message: 'Email already registered' });

    const { data: existingEPF } = await supabase
      .from('users')
      .select('id')
      .eq('epf_number', epfNumber)
      .maybeSingle();

    if (existingEPF) return res.status(400).json({ message: 'EPF Number already registered' });

    const hash = await bcrypt.hash(password, 10);

    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        name,
        email,
        epf_number: epfNumber,
        password: hash,
        role: role || 'Clerk',
        status: status || 'Active'
      }])
      .select(SELECT_SAFE_USER_FIELDS)
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Email or EPF Number already registered' });
      }
      throw error;
    }

    const item = formatUser(newUser);

    await AuditLog.create({ 
      user: req.user?.email, 
      type: 'create:user', 
      message: `Created user ${email} (EPF: ${epfNumber})` 
    }).catch(err => console.error('AuditLog error:', err));

    res.status(201).json(item);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Email or EPF Number already registered' });
    }
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(SELECT_SAFE_USER_FIELDS)
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Not found' });

    res.json(formatUser(data));
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { email, epfNumber, password, name, role, status } = req.body;
    const userId = req.params.id;

    if (epfNumber) {
      const { data: existingEPF } = await supabase
        .from('users')
        .select('id')
        .eq('epf_number', epfNumber)
        .neq('id', userId)
        .maybeSingle();

      if (existingEPF) return res.status(400).json({ message: 'EPF Number already in use by another user' });
    }

    if (email) {
      const { data: existingEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', userId)
        .maybeSingle();

      if (existingEmail) return res.status(400).json({ message: 'Email already in use by another user' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (epfNumber !== undefined) updates.epf_number = epfNumber;
    if (role !== undefined) updates.role = role;
    if (status !== undefined) updates.status = status;
    if (password) updates.password = await bcrypt.hash(password, 10);

    const { data: updated, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select(SELECT_SAFE_USER_FIELDS)
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Email or EPF Number already in use by another user' });
      }
      throw error;
    }

    if (!updated) return res.status(404).json({ message: 'Not found' });

    const item = formatUser(updated);

    await AuditLog.create({ 
      user: req.user?.email, 
      type: 'update:user', 
      message: `Updated user ${item.email}` 
    }).catch(err => console.error('AuditLog error:', err));

    res.json(item);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Email or EPF Number already in use by another user' });
    }
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { data: item } = await supabase
      .from('users')
      .select('id, email, epf_number')
      .eq('id', req.params.id)
      .maybeSingle();

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    if (item) {
      await AuditLog.create({ 
        user: req.user?.email, 
        type: 'delete:user', 
        message: `Deleted user ${item.email}` 
      }).catch(err => console.error('AuditLog error:', err));
    }

    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};