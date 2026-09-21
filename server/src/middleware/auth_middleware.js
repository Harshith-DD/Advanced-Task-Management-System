import jwt from "jsonwebtoken";

import User from "../models/user_model.js";
import { AuthenticationError } from "../errors/app_error.js";

export async function authenticateUser(req, res, next) {
  const token = req.cookies?.authToken;

  if (!token) {
    throw new AuthenticationError();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.userId) {
      throw new AuthenticationError("Invalid authentication token");
    }

    // The token establishes identity, but the current database role is the
    // authorization source of truth. This prevents an old JWT role from
    // continuing to grant admin access after a role change.
    const user = await User.findById(decoded.userId).select("_id role");

    if (!user) {
      throw new AuthenticationError("User account no longer exists");
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }

    throw new AuthenticationError("Invalid or expired token");
  }
}
