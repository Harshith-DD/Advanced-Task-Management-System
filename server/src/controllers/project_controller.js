import {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
  updateProject,
} from "../services/project_services.js";

// ========================================
// GET PROJECTS
// ========================================

export async function getProjectsController(
  req,
  res,
) {
  const projects =
    await getProjects(req.user);

  res.status(200).json({
    success: true,
    data: projects,
  });
}

// ========================================
// GET PROJECT
// ========================================

export async function getProjectByIdController(
  req,
  res,
) {
  const project =
    await getProjectById(
      req.params.id,
      req.user,
    );

  res.status(200).json({
    success: true,
    data: project,
  });
}

// ========================================
// CREATE PROJECT
// ========================================

export async function createProjectController(
  req,
  res,
) {
  const project =
    await createProject(
      {
        name: req.body.name,
        key: req.body.key,
        description:
          req.body.description,
      },
      req.user,
    );

  res.status(201).json({
    success: true,
    data: project,
  });
}

// ========================================
// UPDATE PROJECT
// ========================================

export async function updateProjectController(
  req,
  res,
) {
  const project =
    await updateProject(
      req.params.id,
      {
        name: req.body.name,
        description:
          req.body.description,
      },
      req.user,
    );

  res.status(200).json({
    success: true,
    data: project,
  });
}

// ========================================
// DELETE PROJECT
// ========================================

export async function deleteProjectController(
  req,
  res,
) {
  await deleteProject(
    req.params.id,
    req.user,
  );

  res.status(200).json({
    success: true,
    message:
      "Project deleted successfully",
  });
}