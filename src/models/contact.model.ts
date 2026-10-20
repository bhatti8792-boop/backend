import mongoose, { Schema, type Document } from "mongoose";

export const CONTACT_SERVICES = [
  "Bookkeeping & Accounting",
  "US Tax Preparation",
  "UK Tax Services",
  "Canada Tax Services",
  "Financial Reporting",
  "CFO & Advisory Services",
  "Business Consulting",
  "Other Services",
] as const;

export interface IContact extends Document {
  fullName: string;
  email: string;
  phone?: string;
  service: (typeof CONTACT_SERVICES)[number];
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactSchema = new Schema<IContact>(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [100, "Full name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [30, "Phone number cannot exceed 30 characters"],
      default: undefined,
    },
    service: {
      type: String,
      required: [true, "Please select a service"],
      enum: {
        values: [...CONTACT_SERVICES],
        message: "Please select a valid service",
      },
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: [10, "Message must be at least 10 characters"],
      maxlength: [5000, "Message cannot exceed 5000 characters"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Contact = mongoose.model<IContact>("Contact", contactSchema);

export default Contact;
