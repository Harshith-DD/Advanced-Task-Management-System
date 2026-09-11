import jwt from "jsonwebtoken";

export function authenticateUser(
    req,
    res,
    next
) {
    const authorizationHeader =
        req.headers.authorization;

    if (!authorizationHeader) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    const [scheme, token] =
        authorizationHeader.split(" ");

    if (
        scheme !== "Bearer" ||
        !token
    ) {
        return res.status(401).json({
            success: false,
            message:
                "Invalid authentication format"
        });
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
        return res.status(401).json({
            success: false,
            message:
                "Invalid or expired token"
        });
    }
}