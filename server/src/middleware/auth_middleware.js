import jwt from "jsonwebtoken";


export function authenticateUser(
    req,
    res,
    next
) {

    const token =
        req.cookies?.authToken;


    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
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