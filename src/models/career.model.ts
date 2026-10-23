import mongoose, { Schema } from "mongoose";

const careerApplicationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    role: { type: String, required: true, trim: true },
    experience: { type: String, required: true, trim: true },
    qualifications: { type: String, default: "", trim: true },
    linkedin: { type: String, default: "", trim: true },
    message: { type: String, default: "", trim: true },

    cvUrl: { type: String, required: true, trim: true },
    cvPublicId: { type: String, required: true, trim: true },

    coverLetterUrl: { type: String, default: "", trim: true },
    coverLetterPublicId: { type: String, default: "", trim: true },

    status: {
      type: String,
      enum: ["pending", "reviewed", "shortlisted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const CareerApplication =
  mongoose.models.CareerApplication ||
  mongoose.model("CareerApplication", careerApplicationSchema);

export default CareerApplication;