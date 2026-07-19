// middlewares/upload.js
// Multer configuration for handling task attachment uploads.
// Files are stored in memory buffers and streamed directly to Cloudinary.
const multer = require('multer');
const { ALLOWED_MIMES, MAX_FILE_SIZE, MAX_FILES } = require('../services/cloudinaryService');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type "${file.mimetype}" is not supported. Allowed: JPEG, PNG, GIF, WebP, SVG.`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
});

module.exports = upload;
