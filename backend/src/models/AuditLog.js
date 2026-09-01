const mongoose = require('mongoose');
const supabase = require('../config/supabase');

const auditSchema = new mongoose.Schema({
  user: { type: String },
  type: { type: String },
  message: { type: String },
  ipAddress: { type: String },
}, { timestamps: true });

const MongooseAuditLog = mongoose.model('AuditLog', auditSchema);

// Static wrapper to write audit entries to Supabase audit_logs table
MongooseAuditLog.create = async function(data) {
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

    // Also persist to Mongoose if Mongoose DB connection is active
    try {
      if (mongoose.connection.readyState === 1) {
        await MongooseAuditLog.insertMany(payload);
      }
    } catch (mErr) {
      // Ignore Mongoose errors if offline
    }

    return inserted && inserted.length > 0 ? inserted[0] : rows[0];
  } catch (err) {
    console.error('[AuditLog] Exception creating audit log:', err.message);
    return null;
  }
};

module.exports = MongooseAuditLog;
