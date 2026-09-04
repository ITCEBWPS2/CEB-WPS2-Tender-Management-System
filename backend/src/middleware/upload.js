const multer = require('multer');
const path = require('path');

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/jpeg',
  'image/png',
  'image/pjpeg',
  'image/x-png'
];

// Use memoryStorage so file buffers are kept in memory for direct Supabase Storage uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);
  const isMimeAllowed = ALLOWED_MIME_TYPES.includes(mime) || mime === 'application/octet-stream';

  if (isExtAllowed && isMimeAllowed) {
    return cb(null, true);
  }

  const err = new Error('Invalid file type. Only PDF, DOCX, DOC, JPG, and PNG documents are allowed.');
  err.code = 'INVALID_FILE_TYPE';
  err.status = 400;
  cb(err, false);
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: fileFilter
});

const handleDocumentUpload = (req, res, next) => {
  upload.array('files', 10)(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File is too large. Maximum allowed size is 10MB.' });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      }
      if (err.status === 400 || err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ message: err.message });
      }
      return res.status(400).json({ message: err.message || 'Failed to upload document.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files provided. Please select at least one document to upload.' });
    }

    next();
  });
};

module.exports = {
  handleDocumentUpload
};
