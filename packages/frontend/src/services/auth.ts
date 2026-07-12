export function getAuthToken(): string | null {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.token || null;
    } catch {
      return null;
    }
  }
  return null;
}

export function setAuthUser(user: any): void {
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuthUser(): void {
  localStorage.removeItem('user');
}

export function getUser(): any | null {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export function hasRole(roles: string[]): boolean {
  const user = getUser();
  if (!user) return false;
  return roles.includes(user.role);
}