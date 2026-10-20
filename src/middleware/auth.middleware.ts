import type { RequestHandler } from "express";
import { verifyAccessToken } from "../utils/tokens.ts";

export const requireAuth: RequestHandler = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  try {
    const token = authorization.slice(7).trim();
    const payload = verifyAccessToken(token);

    if (!payload.sub || !payload.role) {
      res.status(401).json({
        success: false,
        message: "Invalid access token",
      });
      return;
    }

    res.locals.auth = {
      userId: payload.sub,
      role: payload.role,
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  const auth = res.locals.auth as { userId: string; role: string } | undefined;

  if (!auth) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  if (auth.role !== "ADMIN") {
    res.status(403).json({
      success: false,
      message: "Admin access required",
    });
    return;
  }

  next();
};
