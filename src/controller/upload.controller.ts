
import type { RequestHandler } from "express";
import { randomUUID } from "node:crypto";
import path from "node:path";
import cloudinary from "../config/cloudinary.ts";

export const uploadFile: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const file = req.file;

    // CHECK FILE
    if (!file) {
      res.status(400).json({
        success: false,
        message: "Please select a file to upload",
      });
      return;
    }

    // CHECK FILE BUFFER
    if (!file.buffer || file.buffer.length === 0) {
      res.status(400).json({
        success: false,
        message:
          "File buffer is empty. Check Multer memoryStorage configuration.",
      });
      return;
    }

    console.log("UPLOAD FILE:", {
      name: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    // FILE INFORMATION
    const isImage = file.mimetype.startsWith("image/");
    const resourceType = isImage ? "image" : "raw";

    const originalName = path.basename(file.originalname);
    const extension = path.extname(originalName).toLowerCase();

    const baseName = path
      .basename(originalName, extension)
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .slice(0, 80);

    const publicId = isImage
      ? `${baseName || "image"}-${randomUUID()}`
      : `${baseName || "document"}-${randomUUID()}${extension}`;

    // UPLOAD TO CLOUDINARY
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
            reject(
              new Error(
                "Cloudinary did not return an upload result"
              )
            );
            return;
          }

          resolve({
            secure_url: uploadedFile.secure_url,
            public_id: uploadedFile.public_id,
            resource_type: uploadedFile.resource_type,
            format: uploadedFile.format ?? "",
            bytes: uploadedFile.bytes,
          });
        }
      );

      stream.on("error", reject);
      stream.end(file.buffer);
    });

    console.log("CLOUDINARY UPLOAD SUCCESS:", result.public_id);

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
    console.error("CLOUDINARY UPLOAD ERROR:", error);
    next(error);
  }
};
