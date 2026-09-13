import jwt from "jsonwebtoken";

import User from "../models/user_model.js";

export async function registerUser(userData) {
    const {
        name,
        email,
        password
    } = userData;

    const user = new User({
        name,
        email,
        role: "user"
    });

    await user.setPassword(password);
    await user.save();

    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    };
}

export async function loginUser(
    email,
    password
) {
    const authenticate =
        User.authenticate();

    const result =
        await authenticate(email, password);

    const user = result.user;

    if (!user) {
        throw new Error(
            "Invalid email or password"
        );
    }

    const token = jwt.sign(
        {
            userId: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d"
        }
    );

    return {
        token,

        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    };
}