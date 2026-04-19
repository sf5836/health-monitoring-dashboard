export const sessionStore = {
  getAccessToken: () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token'),
  getRole: () => localStorage.getItem('role') as 'patient' | 'doctor' | 'admin' | null,
  getFullName: () => localStorage.getItem('full_name'),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  },
  setRole: (role: string) => localStorage.setItem('role', role),
  setFullName: (name: string) => localStorage.setItem('full_name', name),
  clear: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('role');
    localStorage.removeItem('full_name');
  }
};
