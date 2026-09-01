const supabase = require('../config/supabase');
const AuditLog = require('../models/AuditLog');

const formatDepartment = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name || '',
    code: row.code || '',
    description: row.description || '',
    headOfDepartment: row.head_of_department || '',
    status: row.status || 'Active',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

exports.list = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const items = (data || []).map(formatDepartment);
    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, code, description, headOfDepartment, head_of_department, status } = req.body;

    const insertData = {
      name: name || null,
      code: code || null,
      description: description || null,
      head_of_department: headOfDepartment !== undefined ? headOfDepartment : (head_of_department || null),
      status: status || 'Active'
    };

    const { data, error } = await supabase
      .from('departments')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Department already exists' });
      }
      throw error;
    }

    const item = formatDepartment(data);

    await AuditLog.create({ 
      user: req.user?.email, 
      type: 'create:department', 
      message: `Created department ${item.name} (${item.code})` 
    }).catch(err => console.error('AuditLog error:', err));

    res.status(201).json(item);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Department already exists' });
    }
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Not found' });

    res.json(formatDepartment(data));
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.code !== undefined) updates.code = req.body.code;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.headOfDepartment !== undefined) updates.head_of_department = req.body.headOfDepartment;
    else if (req.body.head_of_department !== undefined) updates.head_of_department = req.body.head_of_department;
    if (req.body.status !== undefined) updates.status = req.body.status;

    const { data, error } = await supabase
      .from('departments')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Department already exists' });
      }
      throw error;
    }

    if (!data) return res.status(404).json({ message: 'Not found' });

    const item = formatDepartment(data);

    await AuditLog.create({ 
      user: req.user?.email, 
      type: 'update:department', 
      message: `Updated department ${item.name}` 
    }).catch(err => console.error('AuditLog error:', err));

    res.json(item);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Department already exists' });
    }
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { data: item } = await supabase
      .from('departments')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    if (item) {
      await AuditLog.create({ 
        user: req.user?.email, 
        type: 'delete:department', 
        message: `Deleted department ${item.name}` 
      }).catch(err => console.error('AuditLog error:', err));
    }

    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};
