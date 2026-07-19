// services/s3Service.js
// Handles AWS S3 file upload, retrieval, and deletion for task attachments.
const { S3Client, DeleteObjectCommand, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 10;

let s3Client = null;

const getS3Client = () => {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
};

const getBucket = () => {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) throw new Error('AWS_S3_BUCKET environment variable is not set');
  return bucket;
};

/**
 * Validate a single file against size and MIME constraints.
 * Throws a descriptive error if validation fails.
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
 * Upload an array of files to S3.
 * @param {Array<{buffer: Buffer, originalname: string, mimetype: string, size: number}>} files
 * @param {string} taskId - The task ID for organizing S3 keys
 * @param {string} userId - The user ID performing the upload
 * @returns {Promise<Array<{url: string, key: string, name: string, size: number, type: string, uploadedBy: string, uploadedAt: Date}>>}
 */
const uploadFiles = async (files, taskId, userId) => {
  if (!files || files.length === 0) return [];
  if (files.length > MAX_FILES) {
    throw new Error(`Maximum ${MAX_FILES} files allowed per upload.`);
  }

  // Validate all files first
  files.forEach(validateFile);

  const client = getS3Client();
  const bucket = getBucket();
  const uploaded = [];

  for (const file of files) {
    const ext = path.extname(file.originalname);
    const key = `tasks/${taskId}/${uuidv4()}${ext}`;

    const upload = new Upload({
      client,
      params: {
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      },
    });

    await upload.done();

    uploaded.push({
      url: `https://${bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`,
      key,
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
 * Delete a single file from S3.
 * @param {string} key - S3 object key
 */
const deleteFile = async (key) => {
  const client = getS3Client();
  const bucket = getBucket();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
};

/**
 * Delete multiple files from S3.
 * @param {string[]} keys - Array of S3 object keys
 */
const deleteFiles = async (keys) => {
  if (!keys || keys.length === 0) return;
  const client = getS3Client();
  const bucket = getBucket();

  // S3 batch delete supports up to 1000 objects per request
  await client.send(new DeleteObjectsCommand({
    Bucket: bucket,
    Delete: { Objects: keys.map((key) => ({ Key: key })), Quiet: true },
  }));
};

/**
 * Build a public S3 URL from a key.
 */
const getFileUrl = (key) => {
  return `https://${getBucket()}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
};

module.exports = {
  uploadFiles,
  deleteFile,
  deleteFiles,
  getFileUrl,
  validateFile,
  ALLOWED_MIMES,
  MAX_FILE_SIZE,
  MAX_FILES,
};
