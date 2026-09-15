import jwt from "jsonwebtoken";

import {
    AuthenticationError
} from "../errors/app_error.js";


export function authenticateUser(
    req,
    res,
    next
) {
    const token =
        req.cookies?.authToken;


    if (!token) {
        throw new AuthenticationError();
    }


    try {
        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        req.user = {
            userId: decoded.userId,
            role: decoded.role
        };

        next();

    } catch (error) {

        if (
            error instanceof AuthenticationError
        ) {
            throw error;
        }

        throw new AuthenticationError(
            "Invalid or expired token"
        );
    }
}