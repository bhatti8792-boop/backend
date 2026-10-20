import type { RequestHandler } from "express";
import { randomUUID } from "node:crypto";
import path from "node:path";
import cloudinary from "../config/cloudinary.js";

export const uploadFile: RequestHandler = async (req, res, next) => {
  try {
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        message: "Please select a file to upload",
      });
      return;
    }

    const isImage = file.mimetype.startsWith("image/");
    const resourceType = isImage ? "image" : "raw";

    const originalName = path.basename(file.originalname);
    const extension = path.extname(originalName).toLowerCase();
    const baseName = path
      .basename(originalName, extension)
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .slice(0, 80);

    // Raw documents should retain their file extension.
    const publicId = isImage
      ? `${baseName || "image"}-${randomUUID()}`
      : `${baseName || "document"}-${randomUUID()}${extension}`;

    const result = await new Promise<{
      secure_url: string;
      public_id: string;
      resource_type: string;
      format: string;
      bytes: number;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "node-backend-uploads",
          resource_type: resourceType,
          public_id: publicId,
        },
        (error, uploadedFile) => {
          if (error) {
            reject(error);
            return;
          }

          if (!uploadedFile) {
            reject(new Error("Cloudinary did not return an upload result"));
            return;
          }

          resolve({
            secure_url: uploadedFile.secure_url,
            public_id: uploadedFile.public_id,
            resource_type: uploadedFile.resource_type,
            format: uploadedFile.format ?? "",
            bytes: uploadedFile.bytes,
          });
        },
      );

      stream.end(file.buffer);
    });

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format,
        size: result.bytes,
        originalName: file.originalname,
      },
    });
  } catch (error) {
    next(error);
  }
};
