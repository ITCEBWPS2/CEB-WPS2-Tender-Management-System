const supabase = require('../config/supabase');

exports.create = async function(data) {
  try {
    const payload = Array.isArray(data) ? data : [data];
    const rows = payload.map(item => ({
      user: item.user || item.username || 'System',
      type: item.type || 'action',
      message: item.message || '',
      ip_address: item.ipAddress || item.ip_address || ''
    }));

    const { data: inserted, error } = await supabase
      .from('audit_logs')
      .insert(rows)
      .select();

    if (error) {
      console.error('[Supabase AuditLog] Error inserting log into Supabase:', error.message);
    }

    return inserted && inserted.length > 0 ? inserted[0] : rows[0];
  } catch (err) {
    console.error('[AuditLog] Exception creating audit log:', err.message);
    return null;
  }
};
