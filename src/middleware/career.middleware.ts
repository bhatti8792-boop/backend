
import multer from "multer";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";

const dir = path.resolve(
  process.cwd(),
  "private-uploads/careers"
);

// Create upload directory if it doesn't exist
mkdirSync(dir, { recursive: true });

const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const careerUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, dir);
    },

    filename: (_req, file, cb) => {
      const extension = path
        .extname(file.originalname)
        .toLowerCase();

      const filename = `${randomUUID()}${extension}`;

      cb(null, filename);
    },
  }),

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 2,
    fields: 12,
  },

  fileFilter: (_req, file, cb) => {
    const validExtension = /\.(pdf|doc|docx)$/i.test(
      file.originalname
    );

    const validMimeType = allowedMimeTypes.includes(
      file.mimetype
    );

    if (!validExtension || !validMimeType) {
      return cb(
        new Error(
          "Only PDF, DOC and DOCX files are allowed"
        )
      );
    }

    cb(null, true);
  },
}).fields([
  {
    name: "cv",
    maxCount: 1,
  },
  {
    name: "coverLetter",
    maxCount: 1,
  },
]);
