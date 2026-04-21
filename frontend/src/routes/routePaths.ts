export const ROUTE_PATHS = {
  public: {
    home: '/',
    doctors: '/doctors',
    doctorDetail: '/doctors/:id',
    blogs: '/blogs',
    blogDetail: '/blogs/:id'
  },
  auth: {
    login: '/login',
    register: '/register',
    adminRoot: '/admin',
    adminLogin: '/admin/login'
  },
  patient: {
    dashboard: '/patient/dashboard',
    vitals: '/patient/vitals',
    trends: '/patient/trends',
    doctors: '/patient/doctors',
    appointments: '/patient/appointments',
    prescriptions: '/patient/prescriptions',
    messages: '/patient/messages',
    notifications: '/patient/notifications',
    profile: '/patient/profile'
  },
  doctor: {
    dashboard: '/doctor/dashboard',
    onboarding: '/doctor/onboarding',
    patients: '/doctor/patients',
    patientDetail: '/doctor/patients/:id',
    appointments: '/doctor/appointments',
    prescriptions: '/doctor/prescriptions',
    blogs: '/doctor/blogs',
    messages: '/doctor/messages',
    profile: '/doctor/profile',
    pendingApproval: '/doctor/pending-approval'
  },
  admin: {
    dashboard: '/admin/dashboard',
    doctors: '/admin/doctors',
    patients: '/admin/patients',
    blogs: '/admin/blogs',
    appointments: '/admin/appointments',
    analytics: '/admin/analytics',
    notifications: '/admin/notifications',
    settings: '/admin/settings'
  }
} as const;
