export const sessionStore = {
  getAccessToken: () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token'),
  getRole: () => localStorage.getItem('role') as 'patient' | 'doctor' | 'admin' | null,
<<<<<<< HEAD
  getUserId: () => localStorage.getItem('user_id'),
=======
>>>>>>> 3679fdb51da36730665e1e953a244aa81087f3e4
  getFullName: () => localStorage.getItem('full_name'),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  },
  setRole: (role: string) => localStorage.setItem('role', role),
<<<<<<< HEAD
  setUserId: (id: string) => localStorage.setItem('user_id', id),
=======
>>>>>>> 3679fdb51da36730665e1e953a244aa81087f3e4
  setFullName: (name: string) => localStorage.setItem('full_name', name),
  clear: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('role');
<<<<<<< HEAD
    localStorage.removeItem('user_id');
=======
>>>>>>> 3679fdb51da36730665e1e953a244aa81087f3e4
    localStorage.removeItem('full_name');
  }
};
