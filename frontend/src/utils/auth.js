
export function getCurrentUser() {
  try {
    const stored = sessionStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function getUserRole() {
  const user = getCurrentUser();

  const role = user?.role;

  if (typeof role === "string") {
    return role.toUpperCase();
  }

  if (role && typeof role.name === "string") {
    return role.name.toUpperCase();
  }

  return null;
}

export function isAdmin() {
  return getUserRole() === "ADMIN";
}
