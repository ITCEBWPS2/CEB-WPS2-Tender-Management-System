const supabase = require('../config/supabase');
const AuditLog = require('../models/AuditLog');

// Helper to format Supabase row into standard DTO expected by frontend
const formatCategory = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    description: row.description || '',
    status: row.status || 'Active',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

exports.list = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const items = (data || []).map(formatCategory);
    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, description, status } = req.body;

    const { data, error } = await supabase
      .from('categories')
      .insert([{
        name,
        description: description || null,
        status: status || 'Active'
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Category name already exists' });
      }
      throw error;
    }

    const item = formatCategory(data);

    await AuditLog.create({ 
      user: req.user?.email, 
      type: 'create:category', 
      message: `Created category ${item.name}` 
    }).catch(err => console.error('AuditLog error:', err));

    res.status(201).json(item);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Category name already exists' });
    }
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Not found' });

    res.json(formatCategory(data));
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.status !== undefined) updates.status = req.body.status;

    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Category name already exists' });
      }
      throw error;
    }

    if (!data) return res.status(404).json({ message: 'Not found' });

    const item = formatCategory(data);

    await AuditLog.create({ 
      user: req.user?.email, 
      type: 'update:category', 
      message: `Updated category ${item.name}` 
    }).catch(err => console.error('AuditLog error:', err));

    res.json(item);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Category name already exists' });
    }
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { data: item } = await supabase
      .from('categories')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    if (item) {
      await AuditLog.create({ 
        user: req.user?.email, 
        type: 'delete:category', 
        message: `Deleted category ${item.name}` 
      }).catch(err => console.error('AuditLog error:', err));
    }

    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};
