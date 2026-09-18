import jwt from "jsonwebtoken";

import User from "../models/user_model.js";

import {
  AuthenticationError,
  ValidationError,
} from "../errors/app_error.js";

export async function registerUser(userData) {
  const { name, email, password } = userData;

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw new ValidationError(
      "An account with this email already exists",
    );
  }

  const user = new User({
    name,
    email: normalizedEmail,
    role: "user",
  });

  await user.setPassword(password);
  await user.save();

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function loginUser(email, password) {
  const authenticate = User.authenticate();

  const result = await authenticate(email, password);

  const user = result.user;

  if (!user) {
    throw new AuthenticationError("Invalid email or password");
  }

  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    },
  );

  return {
    token,

    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}
