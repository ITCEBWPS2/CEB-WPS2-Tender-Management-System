const supabase = require('../config/supabase');
const AuditLog = require('../models/AuditLog');

const formatStaff = (row) => {
  if (!row) return null;
  const dept = row.departments || null;
  const formattedDept = dept ? {
    _id: dept.id,
    id: dept.id,
    name: dept.name || '',
    code: dept.code || '',
    description: dept.description || '',
    headOfDepartment: dept.head_of_department || '',
    status: dept.status || 'Active'
  } : null;

  return {
    _id: row.id,
    id: row.id,
    name: row.name || '',
    email: row.email || '',
    area: row.area || '',
    designation: row.designation || '',
    department_id: row.department_id || null,
    department: formattedDept || row.department_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

// Helper to extract clean UUID for department_id
const extractDepartmentId = (body) => {
  if (!body) return null;
  if (body.department_id && typeof body.department_id === 'string' && body.department_id.trim() !== '') {
    return body.department_id.trim();
  }
  if (body.department) {
    if (typeof body.department === 'string' && body.department.trim() !== '') {
      return body.department.trim();
    }
    if (typeof body.department === 'object' && body.department.id) {
      return body.department.id;
    }
  }
  return null;
};

exports.list = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*, departments(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const items = (data || []).map(formatStaff);
    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, email, area, designation } = req.body;
    const departmentId = extractDepartmentId(req.body);

    const insertData = {
      name: name || null,
      email: email || null,
      area: area || null,
      designation: designation || null,
      department_id: departmentId
    };

    const { data: inserted, error } = await supabase
      .from('staff')
      .insert([insertData])
      .select('*, departments(*)')
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Staff member already exists' });
      }
      throw error;
    }

    const item = formatStaff(inserted);

    await AuditLog.create({ 
      user: req.user?.email, 
      type: 'create:staff', 
      message: `Created staff ${item.name}` 
    }).catch(err => console.error('AuditLog error:', err));

    res.status(201).json(item);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Staff member already exists' });
    }
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*, departments(*)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Not found' });

    res.json(formatStaff(data));
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.email !== undefined) updates.email = req.body.email;
    if (req.body.area !== undefined) updates.area = req.body.area;
    if (req.body.designation !== undefined) updates.designation = req.body.designation;

    const departmentId = extractDepartmentId(req.body);
    if (departmentId !== null || req.body.department !== undefined || req.body.department_id !== undefined) {
      updates.department_id = departmentId;
    }

    const { data: updated, error } = await supabase
      .from('staff')
      .update(updates)
      .eq('id', req.params.id)
      .select('*, departments(*)')
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Staff member already exists' });
      }
      throw error;
    }

    if (!updated) return res.status(404).json({ message: 'Not found' });

    const item = formatStaff(updated);

    await AuditLog.create({ 
      user: req.user?.email, 
      type: 'update:staff', 
      message: `Updated staff ${item.name}` 
    }).catch(err => console.error('AuditLog error:', err));

    res.json(item);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Staff member already exists' });
    }
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { data: item } = await supabase
      .from('staff')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    if (item) {
      await AuditLog.create({ 
        user: req.user?.email, 
        type: 'delete:staff', 
        message: `Deleted staff ${item.name}` 
      }).catch(err => console.error('AuditLog error:', err));
    }

    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};
