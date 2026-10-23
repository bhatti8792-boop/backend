import type { CookieOptions, RequestHandler } from "express";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import jwt from "jsonwebtoken";
import User from "../models/user.ts";
import { registerSchema, loginSchema } from "../validation/auth.validation.ts";
import {
  createAccessToken,
  createRefreshToken,
  hashToken,
  verifyRefreshToken,
} from "../utils/tokens.ts";

const isProduction = process.env.NODE_ENV === "production";

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const setRefreshCookie = (
  res: Parameters<RequestHandler>[1],
  token: string,
): void => {
  res.cookie("refreshToken", token, refreshCookieOptions);
};

const clearRefreshCookie = (res: Parameters<RequestHandler>[1]): void => {
  const { maxAge: _maxAge, ...options } = refreshCookieOptions;
  res.clearCookie("refreshToken", options);
};

const publicUser = (user: {
  _id: unknown;
  fullName: string;
  email: string;
  role: string;
  createdAt: Date;
}) => ({
  id: String(user._id),
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

export const register: RequestHandler = async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await User.exists({
      email: data.email,
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await User.create({
      fullName: data.fullName,
      email: data.email,
      passwordHash,
      role: "USER",
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        user: publicUser(user),
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: "Invalid registration data",
        errors: error.issues,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const login: RequestHandler = async (req, res) => {
  const data = loginSchema.parse(req.body);

  const user = await User.findOne({ email: data.email }).select(
    "+passwordHash +refreshTokenHash",
  );

  if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
    res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
    return;
  }

  const accessToken = createAccessToken(String(user._id), user.role);
  const refreshToken = createRefreshToken(String(user._id));

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  setRefreshCookie(res, refreshToken);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      user: publicUser(user),
      accessToken,
      tokenType: "Bearer",
      expiresIn: 900,
    },
  });
};

export const refresh: RequestHandler = async (req, res) => {
  const token = req.cookies?.refreshToken as string | undefined;

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Refresh token is required",
    });
    return;
  }

  let payload;

  try {
    payload = verifyRefreshToken(token);
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError
    ) {
      clearRefreshCookie(res);
      res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
      return;
    }

    throw error;
  }

  if (!payload.sub || payload.type !== "refresh") {
    clearRefreshCookie(res);
    res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
    return;
  }

  const user = await User.findById(payload.sub).select("+refreshTokenHash");

  if (
    !user ||
    !user.refreshTokenHash ||
    user.refreshTokenHash !== hashToken(token)
  ) {
    clearRefreshCookie(res);
    res.status(401).json({
      success: false,
      message: "Refresh session is no longer valid",
    });
    return;
  }

  const newRefreshToken = createRefreshToken(String(user._id));
  user.refreshTokenHash = hashToken(newRefreshToken);
  await user.save();

  const accessToken = createAccessToken(String(user._id), user.role);
  setRefreshCookie(res, newRefreshToken);

  res.status(200).json({
    success: true,
    message: "Token refreshed successfully",
    data: {
      accessToken,
      tokenType: "Bearer",
      expiresIn: 900,
    },
  });
};

export const logout: RequestHandler = async (req, res) => {
  const token = req.cookies?.refreshToken as string | undefined;

  if (token) {
    try {
      const payload = verifyRefreshToken(token);

      if (payload.sub && payload.type === "refresh") {
        const user = await User.findById(payload.sub).select(
          "+refreshTokenHash",
        );

        if (user?.refreshTokenHash === hashToken(token)) {
          user.refreshTokenHash = undefined;
          await user.save();
        }
      }
    } catch {
      // Invalid or expired tokens are still cleared from the browser.
    }
  }

  clearRefreshCookie(res);

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const me: RequestHandler = async (_req, res) => {
  const auth = res.locals.auth as { userId: string; role: string } | undefined;

  if (!auth) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const user = await User.findById(auth.userId);

  if (!user) {
    res.status(404).json({
      success: false,
      message: "User not found",
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: { user: publicUser(user) },
  });
};
