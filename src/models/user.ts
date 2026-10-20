import mongoose, { Schema, type Document } from "mongoose";

export const USER_ROLES = ["USER", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface IUser extends Document {
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  refreshTokenHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "USER",
      required: true,
    },
    refreshTokenHash: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;
