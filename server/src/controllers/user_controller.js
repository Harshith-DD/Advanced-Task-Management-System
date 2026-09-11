import {
    getAllUsers
} from "../services/user_services.js";

export async function getAllUsersController(
    req,
    res
) {
    try {
        const users =
            await getAllUsers();

        res.status(200).json({
            success: true,
            data: users
        });

    } catch (error) {
        console.error(
            "Failed to fetch users:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch users"
        });
    }
}