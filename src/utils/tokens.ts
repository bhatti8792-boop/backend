import "dotenv/config";

import jwt, { type JwtPayload } from "jsonwebtoken";
import { createHash } from "node:crypto";
import type { UserRole } from "../models/user.ts";

const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

if (!accessSecret || !refreshSecret) {
  throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required");
}

if (accessSecret.length < 32 || refreshSecret.length < 32) {
  throw new Error("JWT secrets must be at least 32 characters long");
}

if (accessSecret === refreshSecret) {
  throw new Error("Access and refresh secrets must be different");
}

const issuer = "node-express-ts-backend";

export interface AccessPayload extends JwtPayload {
  role: UserRole;
}

export interface RefreshPayload extends JwtPayload {
  type: "refresh";
}

export const createAccessToken = (userId: string, role: UserRole): string =>
  jwt.sign({ role }, accessSecret, {
    subject: userId,
    expiresIn: "15m",
    issuer,
    algorithm: "HS256",
  });

export const createRefreshToken = (userId: string): string =>
  jwt.sign({ type: "refresh" }, refreshSecret, {
    subject: userId,
    expiresIn: "7d",
    issuer,
    algorithm: "HS256",
  });

export const verifyAccessToken = (token: string): AccessPayload =>
  jwt.verify(token, accessSecret, {
    issuer,
    algorithms: ["HS256"],
  }) as AccessPayload;

export const verifyRefreshToken = (token: string): RefreshPayload =>
  jwt.verify(token, refreshSecret, {
    issuer,
    algorithms: ["HS256"],
  }) as RefreshPayload;

export const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");
