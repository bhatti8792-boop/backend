
import multer from "multer";

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
]);

// Existing upload middleware - keep for other APIs
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      return callback(
        new Error(
          "Unsupported file type. Upload an image or supported document."
        )
      );
    }

    callback(null, true);
  },
});

// Career-specific allowed files
const careerAllowedTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

// Career upload middleware - CV and cover letter
export const careerUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 2,
    fields: 12,
  },

  fileFilter: (_req, file, callback) => {
    const validExtension = /\.(pdf|doc|docx)$/i.test(
      file.originalname
    );

    const validMimeType = careerAllowedTypes.has(
      file.mimetype
    );

    if (!validExtension || !validMimeType) {
      return callback(
        new Error(
          "Only PDF, DOC and DOCX files are allowed."
        )
      );
    }

    callback(null, true);
  },
}).fields([
  { name: "cv", maxCount: 1 },
  { name: "coverLetter", maxCount: 1 },
]);
