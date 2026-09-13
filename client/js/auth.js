let currentUser = null;

export function saveUser(user) {
    currentUser = user;
}

export function getUser() {
    return currentUser;
}

export function isLoggedIn() {
    return Boolean(currentUser);
}

export function clearUser() {
    currentUser = null;
}