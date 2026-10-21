import type { Request, Response } from "express";
import mongoose from "mongoose";
import Contact, { CONTACT_SERVICES } from "../models/contact.model.ts";

export const createContact = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { fullName, email, phone, service, message } = req.body ?? {};

    // Validate required fields
    if (
      typeof fullName !== "string" ||
      typeof email !== "string" ||
      typeof service !== "string" ||
      typeof message !== "string"
    ) {
      res.status(400).json({
        success: false,
        message: "Full name, email, service, and message are required.",
      });
      return;
    }

    // Validate email
    const normalizedEmail = email.trim().toLowerCase();

    if (
      normalizedEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
      return;
    }

    const isValidService = (
      value: string,
    ): value is (typeof CONTACT_SERVICES)[number] => {
      return CONTACT_SERVICES.some((item) => item === value);
    };

    if (!isValidService(service)) {
      res.status(400).json({
        success: false,
        message: "Please select a valid service.",
      });
      return;
    }

    // Validate phone if provided
    if (phone !== undefined && phone !== null && typeof phone !== "string") {
      res.status(400).json({
        success: false,
        message: "Phone number must be a string.",
      });
      return;
    }

    const trimmedName = fullName.trim();
    const trimmedMessage = message.trim();
    const trimmedPhone = typeof phone === "string" ? phone.trim() : "";

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      res.status(400).json({
        success: false,
        message: "Full name must be between 2 and 100 characters.",
      });
      return;
    }

    if (trimmedMessage.length < 10 || trimmedMessage.length > 5000) {
      res.status(400).json({
        success: false,
        message: "Message must be between 10 and 5000 characters.",
      });
      return;
    }

    if (trimmedPhone.length > 30) {
      res.status(400).json({
        success: false,
        message: "Phone number cannot exceed 30 characters.",
      });
      return;
    }

    const contact = await Contact.create({
      fullName: trimmedName,
      email: normalizedEmail,
      ...(trimmedPhone ? { phone: trimmedPhone } : {}),
      service,
      message: trimmedMessage,
    });

    res.status(201).json({
      success: true,
      message: "Your inquiry has been submitted successfully.",
      data: contact,
    });
  } catch (error: unknown) {
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: Object.values(error.errors).map((item) => item.message),
      });
      return;
    }

    console.error("Create contact error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong while submitting your inquiry.",
    });
  }
};
export const getAllContacts = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error: unknown) {
    console.error("Get all contacts error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch contacts.",
    });
  }
};

export const getContactById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid contact ID.",
      });
      return;
    }

    const contact = await Contact.findById(id);

    if (!contact) {
      res.status(404).json({
        success: false,
        message: "Contact not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error: unknown) {
    console.error("Get contact by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch contact.",
    });
  }
};

export const updateContact = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid contact ID.",
      });
      return;
    }

    const allowedFields = ["fullName", "email", "phone", "service", "message"];

    const body = req.body ?? {};
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({
        success: false,
        message: "Provide at least one field to update.",
      });
      return;
    }

    if (typeof updates.email === "string") {
      updates.email = updates.email.trim().toLowerCase();
    }

    if (typeof updates.fullName === "string") {
      updates.fullName = updates.fullName.trim();
    }

    if (typeof updates.message === "string") {
      updates.message = updates.message.trim();
    }

    if (typeof updates.phone === "string") {
      updates.phone = updates.phone.trim();
    }

    const contact = await Contact.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!contact) {
      res.status(404).json({
        success: false,
        message: "Contact not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Contact updated successfully.",
      data: contact,
    });
  } catch (error: unknown) {
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: Object.values(error.errors).map((item) => item.message),
      });
      return;
    }

    console.error("Update contact error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update contact.",
    });
  }
};

export const deleteContact = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid contact ID.",
      });
      return;
    }

    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      res.status(404).json({
        success: false,
        message: "Contact not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Contact deleted successfully.",
    });
  } catch (error: unknown) {
    console.error("Delete contact error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete contact.",
    });
  }
};
