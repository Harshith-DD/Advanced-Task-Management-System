import {
    registerUser,
    loginUser
} from "../services/auth_services.js";

import User from "../models/user_model.js";


export async function registerController(
    req,
    res
) {

    try {

        const {
            name,
            email,
            password
        } = req.body;


        if (
            !name ||
            !email ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email and password are required"
            });
        }


        const user =
            await registerUser({
                name,
                email,
                password
            });


        res.status(201).json({
            success: true,
            data: user
        });

    } catch (error) {

        console.error(
            "Registration failed:",
            error
        );


        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


export async function loginController(
    req,
    res
) {

    try {

        const {
            email,
            password
        } = req.body;


        if (
            !email ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required"
            });
        }


        const result =
            await loginUser(
                email,
                password
            );


        res.cookie(
            "authToken",
            result.token,
            {
                httpOnly: true,

                secure:
                    process.env.COOKIE_SECURE === "true",

                sameSite: "lax",

                maxAge:
                    24 * 60 * 60 * 1000
            }
        );


        res.status(200).json({
            success: true,
            data: {
                user: result.user
            }
        });

    } catch (error) {

        console.error(
            "Login failed:",
            error
        );


        res.status(401).json({
            success: false,
            message:
                "Invalid email or password"
        });
    }
}


export async function getCurrentUserController(
    req,
    res
) {

    try {

        const user =
            await User.findById(
                req.user.userId
            ).select(
                "_id name email role"
            );


        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });

    } catch (error) {

        console.error(
            "Failed to get current user:",
            error
        );


        res.status(500).json({
            success: false,
            message:
                "Failed to get current user"
        });
    }
}


export function logoutController(
    req,
    res
) {

    res.clearCookie(
        "authToken",
        {
            httpOnly: true,

            secure:
                process.env.COOKIE_SECURE === "true",

            sameSite: "lax"
        }
    );


    res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
}