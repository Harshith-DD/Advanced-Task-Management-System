import { getActivities } from "../services/activity_services.js";

// ========================================
// GET ACTIVITIES
// ========================================

export async function getActivitiesController(req, res) {
  const activities = await getActivities(req.user);

  res.status(200).json({
    success: true,
    data: activities,
  });
}
