const path = require('path');
const fs = require('fs');
const supabase = require('../config/supabase');
const AuditLog = require('../utils/auditLogger');

const formatRecordDocument = (doc) => {
  if (!doc) return null;
  return {
    _id: doc.id,
    id: doc.id,
    filename: doc.file_name || '',
    originalName: doc.file_name || '',
    filePath: doc.file_path || '',
    mimeType: doc.mime_type || '',
    size: Number(doc.file_size || 0),
    uploadedBy: '',
    uploadedByName: 'Staff Member',
    uploadedByEmail: '',
    uploadedAt: doc.uploaded_at
  };
};

const formatRecord = (row, documents = []) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    tenderNumber: row.tender_number || '',
    relevantTo: row.relevant_to || '',
    category: row.category || '',
    description: row.description || '',
    other: row.other || '',
    bidStartDate: row.bid_start_date || null,
    bidOpenDate: row.bid_open_date || null,
    bidClosingDate: row.bid_closing_date || null,
    approvedDate: row.approved_date || null,
    fileSentToTecDate: row.file_sent_to_tec_date || null,
    fileSentToTecSecondTime: row.file_sent_to_tec_second_time || null,
    bidBondNumber: row.bid_bond_number || '',
    bidBondBank: row.bid_bond_bank || '',
    bidValidityPeriod: row.bid_validity_period || null,
    remark: row.remark || '',
    status: row.status || 'Under Evaluation',
    tecCommitteeNumber: row.tec_committee_number || '',
    tecChairman: row.tec_chairman || '',
    tecMember1: row.tec_member1 || '',
    tecMember2: row.tec_member2 || '',
    awardedTo: row.awarded_to || '',
    serviceAgreementStartDate: row.service_agreement_start_date || null,
    serviceAgreementEndDate: row.service_agreement_end_date || null,
    performanceBondNumber: row.performance_bond_number || '',
    performanceBondBank: row.performance_bond_bank || '',
    performanceBondRemark: row.performance_bond_remark || '',
    delay: row.delay !== null && row.delay !== undefined ? Number(row.delay) : 0,
    documents: documents.map(formatRecordDocument),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const mapRecordInput = (body) => {
  const result = {};
  if (body.tenderNumber !== undefined) result.tender_number = body.tenderNumber;
  else if (body.tender_number !== undefined) result.tender_number = body.tender_number;

  if (body.relevantTo !== undefined) result.relevant_to = body.relevantTo;
  if (body.category !== undefined) result.category = body.category;
  if (body.description !== undefined) result.description = body.description;
  if (body.other !== undefined) result.other = body.other;

  if (body.bidStartDate !== undefined) result.bid_start_date = body.bidStartDate ? String(body.bidStartDate).slice(0, 10) : null;
  if (body.bidOpenDate !== undefined) result.bid_open_date = body.bidOpenDate ? String(body.bidOpenDate).slice(0, 10) : null;
  if (body.bidClosingDate !== undefined) result.bid_closing_date = body.bidClosingDate ? String(body.bidClosingDate).slice(0, 10) : null;
  if (body.approvedDate !== undefined) result.approved_date = body.approvedDate ? String(body.approvedDate).slice(0, 10) : null;
  if (body.fileSentToTecDate !== undefined) result.file_sent_to_tec_date = body.fileSentToTecDate ? String(body.fileSentToTecDate).slice(0, 10) : null;
  if (body.fileSentToTecSecondTime !== undefined) result.file_sent_to_tec_second_time = body.fileSentToTecSecondTime ? String(body.fileSentToTecSecondTime).slice(0, 10) : null;

  if (body.bidBondNumber !== undefined) result.bid_bond_number = body.bidBondNumber;
  if (body.bidBondBank !== undefined) result.bid_bond_bank = body.bidBondBank;
  if (body.bidValidityPeriod !== undefined) result.bid_validity_period = body.bidValidityPeriod ? String(body.bidValidityPeriod).slice(0, 10) : null;
  if (body.remark !== undefined) result.remark = body.remark;
  if (body.status !== undefined) result.status = body.status;

  if (body.tecCommitteeNumber !== undefined) result.tec_committee_number = body.tecCommitteeNumber;
  if (body.tecChairman !== undefined) result.tec_chairman = body.tecChairman;
  if (body.tecMember1 !== undefined) result.tec_member1 = body.tecMember1;
  if (body.tecMember2 !== undefined) result.tec_member2 = body.tecMember2;

  if (body.awardedTo !== undefined) result.awarded_to = body.awardedTo;
  if (body.serviceAgreementStartDate !== undefined) result.service_agreement_start_date = body.serviceAgreementStartDate ? String(body.serviceAgreementStartDate).slice(0, 10) : null;
  if (body.serviceAgreementEndDate !== undefined) result.service_agreement_end_date = body.serviceAgreementEndDate ? String(body.serviceAgreementEndDate).slice(0, 10) : null;
  if (body.performanceBondNumber !== undefined) result.performance_bond_number = body.performanceBondNumber;
  if (body.performanceBondBank !== undefined) result.performance_bond_bank = body.performanceBondBank;
  if (body.performanceBondRemark !== undefined) result.performance_bond_remark = body.performanceBondRemark;

  if (body.delay !== undefined && body.delay !== null) result.delay = Number(body.delay);

  return result;
};

// Helper to fetch documents for records in bulk or individually
const getDocumentsForRecord = async (recordId) => {
  const { data } = await supabase
    .from('record_documents')
    .select('*')
    .eq('record_id', recordId)
    .order('uploaded_at', { ascending: true });
  return data || [];
};

exports.list = async (req, res, next) => {
  try {
    const { data: records, error } = await supabase
      .from('records')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const { data: allDocs } = await supabase
      .from('record_documents')
      .select('*');

    const docsByRecordId = {};
    (allDocs || []).forEach(doc => {
      if (!docsByRecordId[doc.record_id]) docsByRecordId[doc.record_id] = [];
      docsByRecordId[doc.record_id].push(doc);
    });

    const items = (records || []).map(r => formatRecord(r, docsByRecordId[r.id] || []));
    res.json(items);
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const insertData = mapRecordInput(req.body);

    const { data, error } = await supabase
      .from('records')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Tender number already exists' });
      }
      throw error;
    }

    const item = formatRecord(data, []);

    await AuditLog.create({ 
      user: req.user?.email, 
      type: 'create:record', 
      message: `Created record ${item.tenderNumber}` 
    }).catch(err => console.error('AuditLog error:', err));

    res.status(201).json(item);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Tender number already exists' });
    }
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const { data: record, error } = await supabase
      .from('records')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!record) return res.status(404).json({ message: 'Not found' });

    const docs = await getDocumentsForRecord(record.id);
    res.json(formatRecord(record, docs));
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const updates = mapRecordInput(req.body);

    const { data: updated, error } = await supabase
      .from('records')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Tender number already exists' });
      }
      throw error;
    }

    if (!updated) return res.status(404).json({ message: 'Not found' });

    const docs = await getDocumentsForRecord(updated.id);
    const item = formatRecord(updated, docs);

    await AuditLog.create({ 
      user: req.user?.email, 
      type: 'update:record', 
      message: `Updated record ${item.tenderNumber}` 
    }).catch(err => console.error('AuditLog error:', err));

    res.json(item);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Tender number already exists' });
    }
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { data: item } = await supabase
      .from('records')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    const { error } = await supabase
      .from('records')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    if (item) {
      await AuditLog.create({ 
        user: req.user?.email, 
        type: 'delete:record', 
        message: `Deleted record ${item.tender_number || item.id}` 
      }).catch(err => console.error('AuditLog error:', err));

      const recordDir = path.join(__dirname, '../../uploads/records', req.params.id);
      if (fs.existsSync(recordDir)) {
        fs.rmSync(recordDir, { recursive: true, force: true });
      }
    }

    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

// Documents Management Handlers

exports.uploadDocuments = async (req, res, next) => {
  try {
    const { data: record } = await supabase
      .from('records')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!record) {
      if (req.files && req.files.length > 0) {
        req.files.forEach(f => {
          if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
        });
      }
      return res.status(404).json({ message: 'Tender record not found' });
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const { error } = await supabase
          .from('record_documents')
          .insert([{
            record_id: record.id,
            file_name: file.originalname,
            file_path: file.path,
            file_size: file.size,
            mime_type: file.mimetype
          }]);

        if (error) {
          console.error('Failed to insert record_document:', error);
        }
      }
    }

    const docs = await getDocumentsForRecord(record.id);
    const formattedDocs = docs.map(formatRecordDocument);

    await AuditLog.create({
      user: req.user?.email,
      type: 'document_upload',
      message: `Uploaded ${(req.files || []).length} document(s) to Record ${record.tender_number || record.id}`
    }).catch(err => console.error('AuditLog error:', err));

    res.status(201).json({
      message: 'Documents uploaded successfully',
      documents: formattedDocs
    });
  } catch (err) {
    next(err);
  }
};

exports.listDocuments = async (req, res, next) => {
  try {
    const { data: record } = await supabase
      .from('records')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!record) {
      return res.status(404).json({ message: 'Tender record not found' });
    }

    const docs = await getDocumentsForRecord(record.id);
    res.json(docs.map(formatRecordDocument));
  } catch (err) {
    next(err);
  }
};

exports.downloadDocument = async (req, res, next) => {
  try {
    const { data: record } = await supabase
      .from('records')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!record) {
      return res.status(404).json({ message: 'Tender record not found' });
    }

    const { data: doc } = await supabase
      .from('record_documents')
      .select('*')
      .eq('id', req.params.docId)
      .eq('record_id', record.id)
      .maybeSingle();

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const filePath = doc.file_path;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on storage disk' });
    }

    res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
    res.download(filePath, doc.file_name, (err) => {
      if (err && !res.headersSent) {
        next(err);
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteDocument = async (req, res, next) => {
  try {
    const { data: record } = await supabase
      .from('records')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!record) {
      return res.status(404).json({ message: 'Tender record not found' });
    }

    const { data: doc } = await supabase
      .from('record_documents')
      .select('*')
      .eq('id', req.params.docId)
      .maybeSingle();

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (fs.existsSync(doc.file_path)) {
      try {
        fs.unlinkSync(doc.file_path);
      } catch (unlinkErr) {
        console.warn('Failed to delete physical file:', unlinkErr.message);
      }
    }

    await supabase
      .from('record_documents')
      .delete()
      .eq('id', doc.id);

    const docs = await getDocumentsForRecord(record.id);
    const formattedDocs = docs.map(formatRecordDocument);

    await AuditLog.create({
      user: req.user?.email,
      type: 'document_delete',
      message: `Deleted document ${doc.file_name} from Record ${record.tender_number || record.id}`
    }).catch(err => console.error('AuditLog error:', err));

    res.json({
      message: 'Document deleted successfully',
      documents: formattedDocs
    });
  } catch (err) {
    next(err);
  }
};
