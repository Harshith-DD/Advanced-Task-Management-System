import { registerUser, loginUser } from "../services/auth_services.js";

import User from "../models/user_model.js";

import { ValidationError, NotFoundError } from "../errors/app_error.js";

export async function registerController(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ValidationError("Name, email and password are required");
  }

  const user = await registerUser({
    name,
    email,
    password,
  });

  res.status(201).json({
    success: true,
    data: user,
  });
}

export async function loginController(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ValidationError("Email and password are required");
  }

  const result = await loginUser(email, password);

  res.cookie("authToken", result.token, {
    httpOnly: true,

    secure: process.env.COOKIE_SECURE === "true",

    sameSite: "lax",

    maxAge: 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    data: {
      user: result.user,
    },
  });
}

export async function getCurrentUserController(req, res) {
  const user = await User.findById(req.user.userId).select(
    "_id name email role",
  );

  if (!user) {
    throw new NotFoundError("User not found");
  }

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
}

export function logoutController(req, res) {
  res.clearCookie("authToken", {
    httpOnly: true,

    secure: process.env.COOKIE_SECURE === "true",

    sameSite: "lax",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}
