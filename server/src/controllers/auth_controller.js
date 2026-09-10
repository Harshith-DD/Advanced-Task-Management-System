import {
    registerUser,
    loginUser
} from "../services/auth_services.js";


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


        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {

        console.error(
            "Login failed:",
            error
        );


        res.status(401).json({
            success: false,
            message: "Invalid email or password"
        });
    }
}