const multer = require('multer');

const storage = multer.memoryStorage();

const imageMimeTypes = ['image/png', 'image/jpeg', 'image/webp'];
const videoMimeTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'video') {
    if (videoMimeTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
  }

  if (imageMimeTypes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error('Unsupported file type'));
};

const upload = multer({
  storage,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE || 25 * 1024 * 1024),
  },
  fileFilter,
});

module.exports = upload;
