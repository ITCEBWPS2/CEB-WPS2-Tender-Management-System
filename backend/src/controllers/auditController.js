const supabase = require('../config/supabase');

const formatAuditLog = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    user: row.user || 'System',
    type: row.type || '',
    message: row.message || '',
    ipAddress: row.ip_address || '',
    timestamp: row.created_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

exports.list = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;

    const items = (data || []).map(formatAuditLog);
    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Not found' });

    res.json(formatAuditLog(data));
  } catch (err) {
    next(err);
  }
};
