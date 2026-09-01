const path = require('path');
const fs = require('fs');
const Record = require('../models/Record');
const AuditLog = require('../models/AuditLog');

exports.list = async (req, res, next) => {
  try {
    const items = await Record.find().sort('-createdAt');
    res.json(items);
  } catch (err) { 
    console.error(err);
    next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const item = await Record.create(req.body);
    await AuditLog.create({ 
      user: req.user?.email, 
      type: 'create:record', 
      message: `Created record ${item.tenderNumber}` 
    });
    res.status(201).json(item);
  } catch (err) { 
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Tender number already exists' });
    }
    next(err); 
  }
};

exports.get = async (req, res, next) => {
  try {
    const item = await Record.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const item = await Record.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: 'Not found' });
    
    await AuditLog.create({ 
      user: req.user?.email, 
      type: 'update:record', 
      message: `Updated record ${item.tenderNumber}` 
    });
    res.json(item);
  } catch (err) { 
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Tender number already exists' });
    }
    next(err); 
  }
};

exports.remove = async (req, res, next) => {
  try {
    const item = await Record.findByIdAndDelete(req.params.id);
    if (item) {
      await AuditLog.create({ 
        user: req.user?.email, 
        type: 'delete:record', 
        message: `Deleted record ${item.tenderNumber}` 
      });
      // Clean up uploaded documents directory if exists
      const recordDir = path.join(__dirname, '../../uploads/records', req.params.id);
      if (fs.existsSync(recordDir)) {
        fs.rmSync(recordDir, { recursive: true, force: true });
      }
    }
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};

// Documents Management Handlers

exports.uploadDocuments = async (req, res, next) => {
  try {
    const record = await Record.findById(req.params.id);
    if (!record) {
      // Clean up uploaded files if record not found
      if (req.files && req.files.length > 0) {
        req.files.forEach(f => {
          if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
        });
      }
      return res.status(404).json({ message: 'Tender record not found' });
    }

    const uploadedDocs = [];
    for (const file of req.files) {
      const doc = {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedBy: req.user?.id || req.user?._id,
        uploadedByName: req.user?.name || req.user?.email || 'User',
        uploadedByEmail: req.user?.email || '',
        uploadedAt: new Date()
      };
      record.documents.push(doc);
      uploadedDocs.push(doc);
    }

    await record.save();

    await AuditLog.create({
      user: req.user?.email,
      type: 'document_upload',
      message: `Uploaded ${uploadedDocs.length} document(s) to Record ${record.tenderNumber || record._id}`
    });

    res.status(201).json({
      message: 'Documents uploaded successfully',
      documents: record.documents
    });
  } catch (err) {
    next(err);
  }
};

exports.listDocuments = async (req, res, next) => {
  try {
    const record = await Record.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Tender record not found' });
    }
    res.json(record.documents || []);
  } catch (err) {
    next(err);
  }
};

exports.downloadDocument = async (req, res, next) => {
  try {
    const record = await Record.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Tender record not found' });
    }

    const doc = record.documents.id(req.params.docId) || record.documents.find(d => d._id?.toString() === req.params.docId);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const filePath = path.join(__dirname, '../../uploads/records', req.params.id, doc.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on storage disk' });
    }

    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    res.download(filePath, doc.originalName, (err) => {
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
    const record = await Record.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Tender record not found' });
    }

    const doc = record.documents.id(req.params.docId) || record.documents.find(d => d._id?.toString() === req.params.docId);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const filePath = path.join(__dirname, '../../uploads/records', req.params.id, doc.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkErr) {
        console.warn('Failed to delete physical file:', unlinkErr.message);
      }
    }

    const docName = doc.originalName;
    record.documents.pull(doc._id);
    await record.save();

    await AuditLog.create({
      user: req.user?.email,
      type: 'document_delete',
      message: `Deleted document ${docName} from Record ${record.tenderNumber || record._id}`
    });

    res.json({
      message: 'Document deleted successfully',
      documents: record.documents
    });
  } catch (err) {
    next(err);
  }
};
