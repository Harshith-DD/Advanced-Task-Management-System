import User from "../models/user_model.js";

export async function getAllUsers() {
    return await User
        .find({})
        .select(
            "_id name email role"
        )
        .sort({
            name: 1
        });
}