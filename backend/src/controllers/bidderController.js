const supabase = require('../config/supabase');
const AuditLog = require('../models/AuditLog');

const formatBidder = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name || '',
    email: row.email || '',
    address: row.address || '',
    contact: row.contact || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

exports.list = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('bidders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const items = (data || []).map(formatBidder);
    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, email, address, contact } = req.body;

    const insertData = {
      name: name || null,
      email: email || null,
      address: address || null,
      contact: contact || null
    };

    const { data, error } = await supabase
      .from('bidders')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Supplier/Bidder already exists' });
      }
      throw error;
    }

    const item = formatBidder(data);

    await AuditLog.create({ 
      user: req.user?.email, 
      type: 'create:bidder', 
      message: `Created bidder ${item.name}` 
    }).catch(err => console.error('AuditLog error:', err));

    res.status(201).json(item);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Supplier/Bidder already exists' });
    }
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('bidders')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Not found' });

    res.json(formatBidder(data));
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.email !== undefined) updates.email = req.body.email;
    if (req.body.address !== undefined) updates.address = req.body.address;
    if (req.body.contact !== undefined) updates.contact = req.body.contact;

    const { data, error } = await supabase
      .from('bidders')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Supplier/Bidder already exists' });
      }
      throw error;
    }

    if (!data) return res.status(404).json({ message: 'Not found' });

    const item = formatBidder(data);

    await AuditLog.create({ 
      user: req.user?.email, 
      type: 'update:bidder', 
      message: `Updated bidder ${item.name}` 
    }).catch(err => console.error('AuditLog error:', err));

    res.json(item);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Supplier/Bidder already exists' });
    }
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { data: item } = await supabase
      .from('bidders')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    const { error } = await supabase
      .from('bidders')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    if (item) {
      await AuditLog.create({ 
        user: req.user?.email, 
        type: 'delete:bidder', 
        message: `Deleted bidder ${item.name}` 
      }).catch(err => console.error('AuditLog error:', err));
    }

    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};
