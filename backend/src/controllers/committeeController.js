const supabase = require('../config/supabase');
const AuditLog = require('../models/AuditLog');

const formatCommittee = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    committeeNumber: row.committee_number || '',
    member1: row.member1 || '',
    member2: row.member2 || '',
    member3: row.member3 || '',
    additionalMembers: Array.isArray(row.additional_members) ? row.additional_members : [],
    appointedDate: row.appointed_date ? String(row.appointed_date).slice(0, 10) : '',
    status: row.status || 'Active',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

exports.list = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('committees')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const items = (data || []).map(formatCommittee);
    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const committeeNumber = req.body.committeeNumber || req.body.committee_number;
    const member1 = req.body.member1;
    const member2 = req.body.member2;
    const member3 = req.body.member3;
    const additionalMembers = Array.isArray(req.body.additionalMembers) 
      ? req.body.additionalMembers 
      : (Array.isArray(req.body.additional_members) ? req.body.additional_members : []);
    const appointedDate = req.body.appointedDate || req.body.appointed_date;
    const status = req.body.status || 'Active';

    const insertData = {
      committee_number: committeeNumber || null,
      member1: member1 || null,
      member2: member2 || null,
      member3: member3 || null,
      additional_members: additionalMembers,
      appointed_date: appointedDate ? String(appointedDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
      status
    };

    const { data, error } = await supabase
      .from('committees')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Committee number already exists' });
      }
      throw error;
    }

    const item = formatCommittee(data);

    await AuditLog.create({ 
      user: req.user?.email, 
      type: 'create:committee', 
      message: `Created committee ${item.committeeNumber}` 
    }).catch(err => console.error('AuditLog error:', err));

    res.status(201).json(item);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Committee number already exists' });
    }
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('committees')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Not found' });

    res.json(formatCommittee(data));
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.committeeNumber !== undefined) updates.committee_number = req.body.committeeNumber;
    else if (req.body.committee_number !== undefined) updates.committee_number = req.body.committee_number;

    if (req.body.member1 !== undefined) updates.member1 = req.body.member1;
    if (req.body.member2 !== undefined) updates.member2 = req.body.member2;
    if (req.body.member3 !== undefined) updates.member3 = req.body.member3;

    if (req.body.additionalMembers !== undefined) {
      updates.additional_members = Array.isArray(req.body.additionalMembers) ? req.body.additionalMembers : [];
    } else if (req.body.additional_members !== undefined) {
      updates.additional_members = Array.isArray(req.body.additional_members) ? req.body.additional_members : [];
    }

    if (req.body.appointedDate !== undefined) updates.appointed_date = String(req.body.appointedDate).slice(0, 10);
    else if (req.body.appointed_date !== undefined) updates.appointed_date = String(req.body.appointed_date).slice(0, 10);

    if (req.body.status !== undefined) updates.status = req.body.status;

    const { data, error } = await supabase
      .from('committees')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Committee number already exists' });
      }
      throw error;
    }

    if (!data) return res.status(404).json({ message: 'Not found' });

    const item = formatCommittee(data);

    await AuditLog.create({ 
      user: req.user?.email, 
      type: 'update:committee', 
      message: `Updated committee ${item.committeeNumber}` 
    }).catch(err => console.error('AuditLog error:', err));

    res.json(item);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Committee number already exists' });
    }
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { data: item } = await supabase
      .from('committees')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    const { error } = await supabase
      .from('committees')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    if (item) {
      await AuditLog.create({ 
        user: req.user?.email, 
        type: 'delete:committee', 
        message: `Deleted committee ${item.committeeNumber}` 
      }).catch(err => console.error('AuditLog error:', err));
    }

    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};
