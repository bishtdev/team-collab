// services/cloudinaryService.js
// Handles Cloudinary image upload, deletion for task attachments.
// https://cloudinary.com/documentation/node_integration
const cloudinary = require('cloudinary').v2;
const { v4: uuidv4 } = require('uuid');
const streamifier = require('streamifier');

const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 10;

/**
 * Initialize Cloudinary with env vars.
 * Called automatically on first upload.
 */
let initialized = false;
const initCloudinary = () => {
  if (initialized) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  initialized = true;
};

/**
 * Validate a single file against size and MIME constraints.
 */
const validateFile = (file) => {
  if (!ALLOWED_MIMES.has(file.mimetype)) {
    throw new Error(`File type "${file.mimetype}" is not supported. Allowed: JPEG, PNG, GIF, WebP, SVG.`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File "${file.originalname}" exceeds the 5 MB size limit.`);
  }
};

/**
 * Upload a single file buffer to Cloudinary.
 * Returns a promise that resolves with the Cloudinary upload result.
 */
const uploadSingleFile = (buffer, taskId, originalname) => {
  return new Promise((resolve, reject) => {
    initCloudinary();

    const publicId = `tasks/${taskId}/${uuidv4()}`;

    // Append extension for better URL readability
    const ext = originalname.split('.').pop()?.toLowerCase() || 'png';

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: 'image',
        format: ext === 'svg' ? 'svg' : undefined,
        folder: '', // public_id already includes the full path
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) return reject(new Error(error.message || 'Cloudinary upload failed'));
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Upload an array of files to Cloudinary.
 * @param {Array<{buffer: Buffer, originalname: string, mimetype: string, size: number}>} files
 * @param {string} taskId
 * @param {string} userId
 * @returns {Promise<Array<{url: string, key: string, name: string, size: number, type: string, uploadedBy: string, uploadedAt: Date}>>}
 */
const uploadFiles = async (files, taskId, userId) => {
  if (!files || files.length === 0) return [];
  if (files.length > MAX_FILES) {
    throw new Error(`Maximum ${MAX_FILES} files allowed per upload.`);
  }

  // Validate all files first
  files.forEach(validateFile);

  const uploaded = [];

  for (const file of files) {
    const result = await uploadSingleFile(file.buffer, taskId, file.originalname);

    uploaded.push({
      url: result.secure_url,
      key: result.public_id,        // Cloudinary public_id — used for deletion
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      uploadedBy: userId,
      uploadedAt: new Date(),
    });
  }

  return uploaded;
};

/**
 * Delete a single file from Cloudinary.
 * @param {string} publicId - Cloudinary public_id
 */
const deleteFile = async (publicId) => {
  initCloudinary();
  await cloudinary.uploader.destroy(publicId);
};

/**
 * Delete multiple files from Cloudinary.
 * @param {string[]} publicIds - Array of Cloudinary public_ids
 */
const deleteFiles = async (publicIds) => {
  if (!publicIds || publicIds.length === 0) return;
  initCloudinary();

  // Cloudinary supports batch delete via an array of public_ids
  await Promise.all(publicIds.map((id) => deleteFile(id)));
};

module.exports = {
  uploadFiles,
  deleteFile,
  deleteFiles,
  validateFile,
  ALLOWED_MIMES,
  MAX_FILE_SIZE,
  MAX_FILES,
};
