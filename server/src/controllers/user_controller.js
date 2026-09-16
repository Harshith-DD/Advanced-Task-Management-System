import { getAllUsers } from "../services/user_services.js";

export async function getAllUsersController(req, res) {
  const users = await getAllUsers();

  res.status(200).json({
    success: true,
    data: users,
  });
}
