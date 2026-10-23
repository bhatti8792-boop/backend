import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";

import Job from "../models/career.model.ts";
import CareerApplication from "../models/career.model.ts";

const GENERAL_APPLICATION = "General Application";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATUSES = ["pending", "reviewed", "shortlisted", "rejected"];

// Read a body field as a trimmed string (never trust the client's types).
const text = (value: unknown, max = 5000) =>
  String(value ?? "").trim().slice(0, max);

const isHttpsUrl = (value: string) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

// PUBLIC: POST /jobs/apply
export const createApplication = async (
  req: Request,
  res: Response
) => {
  try {
    const body = req.body ?? {};

    const name = text(body.name, 200);
    const email = text(body.email, 200).toLowerCase();
    const role = text(body.role, 200);
    const experience = text(body.experience, 100);

    const cvUrl = text(body.cvUrl, 2000);
    const cvPublicId = text(body.cvPublicId, 500);

    const coverLetterUrl = text(body.coverLetterUrl, 2000);
    const coverLetterPublicId = text(body.coverLetterPublicId, 500);

    if (!name || !email || !role || !experience) {
      return res.status(400).json({
        success: false,
        message: "Please complete all required fields.",
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (!cvUrl || !cvPublicId || !isHttpsUrl(cvUrl)) {
      return res.status(400).json({
        success: false,
        message: "CV or resume is required.",
      });
    }

    if (coverLetterUrl && !isHttpsUrl(coverLetterUrl)) {
      return res.status(400).json({
        success: false,
        message: "Cover letter link is not valid.",
      });
    }

    // The role must be an active job, or the general application option.
    if (role !== GENERAL_APPLICATION) {
      const jobExists = await Job.exists({
        title: role,
        status: "active",
      });

      if (!jobExists) {
        return res.status(400).json({
          success: false,
          message: "Please select a valid position.",
        });
      }
    }

    const application = await CareerApplication.create({
      name,
      email,
      phone: text(body.phone, 50),
      role,
      experience,
      qualifications: text(body.qualifications, 500),
      linkedin: text(body.linkedin, 500),
      message: text(body.message, 5000),
      cvUrl,
      cvPublicId,
      coverLetterUrl,
      coverLetterPublicId,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully.",
      data: {
        id: application._id,
        role: application.role,
        status: application.status,
      },
    });
  } catch (error) {
    console.error("Create career application error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit your application.",
    });
  }
};

// ADMIN: GET /jobs/applications
// Optional query: ?status=pending&page=1&limit=20
export const getApplications = async (
  req: Request,
  res: Response
) => {
  try {
    const status = text(req.query.status, 20);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit) || 20)
    );

    const filter: Record<string, string> = {};

    if (status) {
      if (!STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status filter.",
        });
      }

      filter.status = status;
    }

    const [applications, total] = await Promise.all([
      CareerApplication.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      CareerApplication.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: applications.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: applications,
    });
  } catch (error) {
    console.error("Get applications error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch applications.",
    });
  }
};

// ADMIN: GET /jobs/applications/:id
export const getApplicationById = async (
  req: Request,
  res: Response
) => {
  try {
    const id = String(req.params.id ?? "");

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID.",
      });
    }

    const application = await CareerApplication.findById(id).lean();

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error("Get application error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch application.",
    });
  }
};