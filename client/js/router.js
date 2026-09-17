const DEFAULT_ROUTE = "dashboard";

const ALLOWED_ROUTES = [
  "dashboard",
  "tasks",
  "activity",
  "notifications",
  "reports",
];

const routeElements = () => document.querySelectorAll("[data-route-view]");

const navLinks = () => document.querySelectorAll("[data-route]");

function normalizeRoute(route) {
  const value = String(route || "").replace(/^#\/?/, "");

  return ALLOWED_ROUTES.includes(value) ? value : DEFAULT_ROUTE;
}

export function getCurrentRoute() {
  return normalizeRoute(window.location.hash);
}

export function navigate(route) {
  const nextRoute = normalizeRoute(route);

  if (getCurrentRoute() === nextRoute) {
    renderRoute(nextRoute);
    return;
  }

  window.location.hash = `/${nextRoute}`;
}

function renderRoute(route) {
  const currentRoute = normalizeRoute(route);

  routeElements().forEach((element) => {
    const isActive = element.dataset.routeView === currentRoute;

    element.hidden = !isActive;
    element.classList.toggle("is-active", isActive);
  });

  navLinks().forEach((link) => {
    const isActive = link.dataset.route === currentRoute;

    link.classList.toggle("is-active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

export function initializeRouter() {
  window.addEventListener("hashchange", () => {
    renderRoute(getCurrentRoute());
  });

  if (!window.location.hash) {
    window.location.hash = `/${DEFAULT_ROUTE}`;
    return;
  }

  renderRoute(getCurrentRoute());
}

export function handleProtectedRoute(isAuthenticated) {
  const route = getCurrentRoute();

  if (!isAuthenticated) {
    document.body.classList.remove("is-authenticated");
    renderRoute(DEFAULT_ROUTE);
    return;
  }

  document.body.classList.add("is-authenticated");
  renderRoute(route);
}
