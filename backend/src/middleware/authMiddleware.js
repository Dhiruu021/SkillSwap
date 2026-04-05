import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* ---------------- AUTH PROTECT MIDDLEWARE ---------------- */

export const protect = async (req, res, next) => {
  try {
    let token = null;

    /* -------- GET TOKEN FROM HEADER -------- */

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    /* -------- GET TOKEN FROM COOKIE -------- */

    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    /* -------- NO TOKEN -------- */

    if (!token) {
      return res.status(401).json({
        message: "Not authorized, no token",
      });
    }

    /* -------- VERIFY TOKEN -------- */

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "changeme"
    );

    /* -------- FIND USER -------- */

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "Not authorized, user not found",
      });
    }

    /* -------- ATTACH USER -------- */

    req.user = user;

    next();
  } catch (error) {
    console.error("JWT AUTH ERROR:", error.message);

    return res.status(401).json({
      message: "Not authorized, token failed",
    });
  }
};

/* ---------------- OPTIONAL ADMIN CHECK ---------------- */

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      message: "Admin access required",
    });
  }
};