import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/user_model.js";


export async function registerUser(userData) {

    const {
        name,
        email,
        password
    } = userData;


    const existingUser =
        await User.findOne({ email });


    if (existingUser) {
        throw new Error(
            "User with this email already exists"
        );
    }


    const hashedPassword =
        await bcrypt.hash(password, 12);


    const user =
        await User.create({
            name,
            email,
            password: hashedPassword
        });


    return {
        id: user._id,
        name: user.name,
        email: user.email
    };
}


export async function loginUser(
    email,
    password
) {

    const user =
        await User.findOne({ email });


    if (!user) {
        throw new Error(
            "Invalid email or password"
        );
    }


    const passwordMatches =
        await bcrypt.compare(
            password,
            user.password
        );


    if (!passwordMatches) {
        throw new Error(
            "Invalid email or password"
        );
    }


    const token =
        jwt.sign(
            {
                userId: user._id
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
            email: user.email
        }
    };
}