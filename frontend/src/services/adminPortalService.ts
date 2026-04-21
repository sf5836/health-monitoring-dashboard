import { APP_ENV } from '../config/env';
import { apiRequest } from './apiClient';

export type RiskLevel = 'normal' | 'medium' | 'high';

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

type BackendUser = {
  _id?: string;
  id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: 'patient' | 'doctor' | 'admin';
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type BackendDoctorProfile = {
  _id?: string;
  userId?: string | BackendUser;
  specialization?: string;
  licenseNumber?: string;
  qualifications?: string[];
  experienceYears?: number;
  hospital?: string;
  fee?: number;
  rating?: number;
  reviewsCount?: number;
  bio?: string;
  availability?: string;
  availabilitySchedule?: Array<{
    day?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    startTime?: string;
    endTime?: string;
  }>;
  legalDocuments?: Array<{
    label?: string;
    fileName?: string;
    fileUrl?: string;
    contentType?: string;
    uploadedAt?: string;
  }>;
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'suspended';
  approvalNote?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

type BackendBlog = {
  _id?: string;
  authorId?: string | BackendUser;
  authorRole?: 'doctor' | 'admin';
  title?: string;
  excerpt?: string;
  content?: string;
  coverImageUrl?: string;
  category?: string;
  tags?: string[];
  status?: 'draft' | 'pending_review' | 'published' | 'rejected' | 'unpublished';
  rejectionReason?: string;
  submittedAt?: string;
  publishedAt?: string;
  views?: number;
  likes?: number;
  createdAt?: string;
  updatedAt?: string;
};

type BackendAppointment = {
  _id?: string;
  patientId?: string | BackendUser;
  doctorId?: string | BackendUser;
  type?: 'in_person' | 'teleconsult';
  date?: string;
  time?: string;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdBy?: 'patient' | 'doctor' | 'admin';
  createdAt?: string;
  updatedAt?: string;
};

type BackendPatientRow = {
  profileId?: string;
  patientId?: string;
  user?: BackendUser;
  profile?: {
    dob?: string;
    gender?: string;
    bloodGroup?: string;
    heightCm?: number;
    weightKg?: number;
    allergies?: string[];
    medications?: string[];
    medicalHistory?: string;
    updatedAt?: string;
  };
  highRiskEvents?: number;
  appointmentCount?: number;
};

type BackendAuditActivity = {
  _id?: string;
  actorId?: BackendUser;
  actorRole?: 'patient' | 'doctor' | 'admin';
  action?: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  createdAt?: string;
};

type BackendNotification = {
  _id?: string;
  type?: string;
  title?: string;
  body?: string;
  isRead?: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};

export type AdminDoctor = {
  id: string;
  userId: string;
  fullName: string;
  email?: string;
  phone?: string;
  specialization?: string;
  licenseNumber?: string;
  qualifications: string[];
  experienceYears?: number;
  hospital?: string;
  fee?: number;
  rating?: number;
  reviewsCount?: number;
  bio?: string;
  availability?: string;
  availabilitySchedule: Array<{
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    startTime: string;
    endTime: string;
  }>;
  legalDocuments: Array<{
    label?: string;
    fileName: string;
    fileUrl: string;
    contentType?: string;
    uploadedAt?: string;
  }>;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  approvalNote?: string;
  approvedAt?: string;
  createdAt?: string;
  isActive: boolean;
};

export type AdminBlog = {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'doctor' | 'admin';
  title: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string;
  category?: string;
  tags: string[];
  status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'unpublished';
  rejectionReason?: string;
  submittedAt?: string;
  publishedAt?: string;
  views: number;
  likes: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminPatient = {
  profileId: string;
  patientId: string;
  fullName: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  heightCm?: number;
  weightKg?: number;
  allergies: string[];
  medications: string[];
  medicalHistory?: string;
  highRiskEvents: number;
  appointmentCount: number;
  updatedAt?: string;
};

export type AdminAppointment = {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  type: 'in_person' | 'teleconsult';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdBy?: 'patient' | 'doctor' | 'admin';
  createdAt?: string;
  updatedAt?: string;
};

export type AdminDashboardMetrics = {
  doctors: {
    total: number;
    pending: number;
    approved: number;
    suspended: number;
  };
  patients: {
    total: number;
  };
  blogs: {
    total: number;
    pending: number;
    published: number;
  };
  clinical: {
    highRiskVitals: number;
    activeAppointments: number;
    totalPrescriptions: number;
  };
};

export type AdminOverviewKpis = {
  days: number;
  totalUsers: number;
  activeDoctors: number;
  totalPatients: number;
  totalBlogs: number;
  pendingBlogs: number;
  highRiskVitals: number;
  headlineKpis: {
    newPatients: number;
    newDoctors: number;
    vitalsLogged: number;
    appointmentsCompleted: number;
    blogsPublished: number;
  };
};

export type AdminGrowthSeries = {
  days: number;
  cumulative: Array<{ date: string; doctors: number; patients: number }>;
  doctorsDaily: Array<{ date: string; count: number }>;
  patientsDaily: Array<{ date: string; count: number }>;
  vitalsDaily: Array<{ date: string; count: number }>;
};

export type AdminBlogAnalytics = {
  statusBreakdown: Array<{ _id: string; count: number }>;
  categoryBreakdown: Array<{ _id: string; count: number }>;
  topBlogs: Array<{
    _id: string;
    title: string;
    views: number;
    likes: number;
    category?: string;
    status: string;
    publishedAt?: string;
  }>;
};

export type AdminAnalyticsPerformance = {
  topDoctors: Array<{
    doctorId: string;
    appointments: number;
    completed: number;
    patientsCount: number;
    user?: BackendUser;
    profile?: BackendDoctorProfile;
  }>;
  appointmentFunnel: {
    requested: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  riskDistribution: {
    normal: number;
    medium: number;
    high: number;
  };
};

export type AdminActivity = {
  id: string;
  actorName: string;
  actorRole?: 'patient' | 'doctor' | 'admin';
  action: string;
  entityType?: string;
  details?: Record<string, unknown>;
  createdAt?: string;
};

export type AdminNotification = {
  id: string;
  type: string;
  title: string;
  body?: string;
  isRead: boolean;
  createdAt?: string;
};

function userId(value?: string | BackendUser): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.id || value._id || '';
}

function backendOrigin(): string {
  try {
    const resolved = new URL(APP_ENV.apiBaseUrl, window.location.origin);
    return resolved.origin;
  } catch {
    return window.location.origin;
  }
}

function normalizeDocumentUrl(fileUrl?: string): string {
  const raw = String(fileUrl || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/')) return `${backendOrigin()}${raw}`;
  return `${backendOrigin()}/${raw}`;
}

function mapDoctor(value: BackendDoctorProfile): AdminDoctor {
  const user = typeof value.userId === 'string' ? undefined : value.userId;
  const fullName = String(user?.fullName || '').trim();

  return {
    id: value._id || '',
    userId: userId(value.userId),
    fullName: fullName || 'Unknown Doctor',
    email: user?.email,
    phone: user?.phone,
    specialization: value.specialization,
    licenseNumber: value.licenseNumber,
    qualifications: value.qualifications || [],
    experienceYears: value.experienceYears,
    hospital: value.hospital,
    fee: value.fee,
    rating: value.rating,
    reviewsCount: value.reviewsCount,
    bio: value.bio,
    availability: value.availability,
    availabilitySchedule: (value.availabilitySchedule || []).map((slot) => ({
      day: (slot.day || 'monday') as AdminDoctor['availabilitySchedule'][number]['day'],
      startTime: slot.startTime || '09:00',
      endTime: slot.endTime || '17:00'
    })),
    legalDocuments: (value.legalDocuments || [])
      .filter((item) => Boolean(item.fileName && item.fileUrl))
      .map((item) => ({
        label: item.label,
        fileName: item.fileName || 'document.pdf',
        fileUrl: normalizeDocumentUrl(item.fileUrl),
        contentType: item.contentType,
        uploadedAt: item.uploadedAt
      })),
    approvalStatus: value.approvalStatus || 'pending',
    approvalNote: value.approvalNote,
    approvedAt: value.approvedAt,
    createdAt: value.createdAt,
    isActive: Boolean(user?.isActive)
  };
}

function mapBlog(value: BackendBlog): AdminBlog {
  const author = typeof value.authorId === 'string' ? undefined : value.authorId;

  return {
    id: value._id || '',
    authorId: userId(value.authorId),
    authorName: author?.fullName || 'Author',
    authorRole: value.authorRole || 'doctor',
    title: value.title || 'Untitled',
    excerpt: value.excerpt,
    content: value.content || '',
    coverImageUrl: value.coverImageUrl,
    category: value.category,
    tags: value.tags || [],
    status: value.status || 'draft',
    rejectionReason: value.rejectionReason,
    submittedAt: value.submittedAt,
    publishedAt: value.publishedAt,
    views: value.views || 0,
    likes: value.likes || 0,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
}

function mapAppointment(value: BackendAppointment): AdminAppointment {
  const patient = typeof value.patientId === 'string' ? undefined : value.patientId;
  const doctor = typeof value.doctorId === 'string' ? undefined : value.doctorId;
  const patientName = String(patient?.fullName || '').trim();
  const doctorName = String(doctor?.fullName || '').trim();

  return {
    id: value._id || '',
    patientId: userId(value.patientId),
    patientName: patientName || 'Unknown Patient',
    doctorId: userId(value.doctorId),
    doctorName: doctorName || 'Unknown Doctor',
    date: value.date || '',
    time: value.time || '',
    type: value.type || 'in_person',
    status: value.status || 'pending',
    notes: value.notes,
    createdBy: value.createdBy,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
}

function mapPatient(value: BackendPatientRow): AdminPatient {
  const fullName = String(value.user?.fullName || '').trim();

  return {
    profileId: value.profileId || '',
    patientId: value.patientId || value.user?._id || '',
    fullName: fullName || 'Unknown Patient',
    email: value.user?.email,
    phone: value.user?.phone,
    isActive: Boolean(value.user?.isActive),
    dob: value.profile?.dob,
    gender: value.profile?.gender,
    bloodGroup: value.profile?.bloodGroup,
    heightCm: value.profile?.heightCm,
    weightKg: value.profile?.weightKg,
    allergies: value.profile?.allergies || [],
    medications: value.profile?.medications || [],
    medicalHistory: value.profile?.medicalHistory,
    highRiskEvents: value.highRiskEvents || 0,
    appointmentCount: value.appointmentCount || 0,
    updatedAt: value.profile?.updatedAt
  };
}

function mapActivity(value: BackendAuditActivity): AdminActivity {
  return {
    id: value._id || crypto.randomUUID(),
    actorName: value.actorId?.fullName || 'System',
    actorRole: value.actorRole,
    action: value.action || 'updated',
    entityType: value.entityType,
    details: value.details,
    createdAt: value.createdAt
  };
}

function mapNotification(value: BackendNotification): AdminNotification {
  return {
    id: value._id || crypto.randomUUID(),
    type: value.type || 'system',
    title: value.title || 'Notification',
    body: value.body,
    isRead: Boolean(value.isRead),
    createdAt: value.createdAt
  };
}

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const response = await apiRequest<ApiEnvelope<AdminDashboardMetrics>>('/admin/dashboard');
  return response.data;
}

export async function getAdminDoctors(): Promise<AdminDoctor[]> {
  const response = await apiRequest<ApiEnvelope<{ doctors: BackendDoctorProfile[] }>>('/admin/doctors');
  return (response.data.doctors || [])
    .filter((doctor) => {
      const user = typeof doctor.userId === 'string' ? undefined : doctor.userId;
      return Boolean(user?._id && user.role === 'doctor');
    })
    .map(mapDoctor);
}

export async function getAdminPendingDoctors(): Promise<AdminDoctor[]> {
  const response = await apiRequest<ApiEnvelope<{ doctors: BackendDoctorProfile[] }>>('/admin/doctors/pending');
  return (response.data.doctors || [])
    .filter((doctor) => {
      const user = typeof doctor.userId === 'string' ? undefined : doctor.userId;
      return Boolean(user?._id && user.role === 'doctor');
    })
    .map(mapDoctor);
}

export async function approveAdminDoctor(doctorUserId: string, note?: string): Promise<void> {
  await apiRequest<ApiEnvelope<{ doctor: BackendDoctorProfile }>>(`/admin/doctors/${doctorUserId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ note })
  });
}

export async function rejectAdminDoctor(doctorUserId: string, note?: string): Promise<void> {
  await apiRequest<ApiEnvelope<{ doctor: BackendDoctorProfile }>>(`/admin/doctors/${doctorUserId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ note })
  });
}

export async function suspendAdminDoctor(doctorUserId: string, note?: string): Promise<void> {
  await apiRequest<ApiEnvelope<{ doctor: BackendDoctorProfile }>>(`/admin/doctors/${doctorUserId}/suspend`, {
    method: 'POST',
    body: JSON.stringify({ note })
  });
}

export async function updateAdminDoctor(
  doctorUserId: string,
  payload: Partial<{
    fullName: string;
    email: string;
    phone: string;
    specialization: string;
    licenseNumber: string;
    qualifications: string[];
    experienceYears: number;
    hospital: string;
    fee: number;
    bio: string;
    availability: string;
    availabilitySchedule: AdminDoctor['availabilitySchedule'];
    legalDocuments: AdminDoctor['legalDocuments'];
    approvalStatus: AdminDoctor['approvalStatus'];
    isActive: boolean;
  }>
): Promise<AdminDoctor> {
  const response = await apiRequest<ApiEnvelope<{ doctor: BackendDoctorProfile }>>(
    `/admin/doctors/${doctorUserId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }
  );

  return mapDoctor(response.data.doctor);
}

export async function deleteAdminDoctor(doctorUserId: string): Promise<void> {
  await apiRequest<ApiEnvelope<{}>>(`/admin/doctors/${doctorUserId}`, {
    method: 'DELETE'
  });
}

export async function getAdminPatients(): Promise<AdminPatient[]> {
  const response = await apiRequest<ApiEnvelope<{ patients: BackendPatientRow[] }>>('/admin/patients');
  return (response.data.patients || [])
    .filter((patient) => Boolean(patient.user?._id && patient.user?.role === 'patient'))
    .map(mapPatient);
}

export async function updateAdminPatient(
  patientId: string,
  payload: Partial<{
    fullName: string;
    email: string;
    phone: string;
    isActive: boolean;
    dob: string;
    gender: string;
    bloodGroup: string;
    heightCm: number;
    weightKg: number;
    allergies: string[];
    medications: string[];
    medicalHistory: string;
    emergencyContact: {
      name?: string;
      relationship?: string;
      phone?: string;
    };
  }>
): Promise<AdminPatient> {
  const response = await apiRequest<
    ApiEnvelope<{
      patient: BackendPatientRow;
    }>
  >(`/admin/patients/${patientId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

  return mapPatient(response.data.patient);
}

export async function deleteAdminPatient(patientId: string): Promise<void> {
  await apiRequest<ApiEnvelope<{}>>(`/admin/patients/${patientId}`, {
    method: 'DELETE'
  });
}

export async function getAdminAppointments(): Promise<AdminAppointment[]> {
  const response = await apiRequest<ApiEnvelope<{ appointments: BackendAppointment[] }>>('/admin/appointments');
  return (response.data.appointments || []).map(mapAppointment);
}

export async function getAdminBlogs(): Promise<AdminBlog[]> {
  const response = await apiRequest<ApiEnvelope<{ blogs: BackendBlog[] }>>('/admin/blogs');
  return (response.data.blogs || []).map(mapBlog);
}

export async function getAdminPendingBlogs(): Promise<AdminBlog[]> {
  const response = await apiRequest<ApiEnvelope<{ blogs: BackendBlog[] }>>('/admin/blogs/pending');
  return (response.data.blogs || []).map(mapBlog);
}

export async function publishAdminBlog(blogId: string): Promise<void> {
  await apiRequest<ApiEnvelope<{ blog: BackendBlog }>>(`/admin/blogs/${blogId}/publish`, {
    method: 'POST'
  });
}

export async function rejectAdminBlog(blogId: string, reason?: string): Promise<void> {
  await apiRequest<ApiEnvelope<{ blog: BackendBlog }>>(`/admin/blogs/${blogId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
}

export async function createAdminBlog(payload: {
  title: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string;
  category?: string;
  tags?: string[];
  status?: 'draft' | 'pending_review' | 'published' | 'rejected' | 'unpublished';
}): Promise<AdminBlog> {
  const response = await apiRequest<ApiEnvelope<{ blog: BackendBlog }>>('/admin/blogs', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return mapBlog(response.data.blog);
}

export async function updateAdminBlog(
  blogId: string,
  payload: Partial<{
    title: string;
    excerpt: string;
    content: string;
    coverImageUrl: string;
    category: string;
    tags: string[];
    status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'unpublished';
    rejectionReason: string;
  }>
): Promise<AdminBlog> {
  const response = await apiRequest<ApiEnvelope<{ blog: BackendBlog }>>(`/admin/blogs/${blogId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  return mapBlog(response.data.blog);
}

export async function deleteAdminBlog(blogId: string): Promise<void> {
  await apiRequest<ApiEnvelope<{}>>(`/admin/blogs/${blogId}`, {
    method: 'DELETE'
  });
}

export async function getAdminAnalyticsOverview(days = 30): Promise<AdminOverviewKpis> {
  const response = await apiRequest<ApiEnvelope<AdminOverviewKpis>>(`/admin/analytics/overview?days=${days}`);
  return response.data;
}

export async function getAdminAnalyticsGrowth(days = 30): Promise<AdminGrowthSeries> {
  const response = await apiRequest<ApiEnvelope<AdminGrowthSeries>>(`/admin/analytics/growth?days=${days}`);
  return response.data;
}

export async function getAdminAnalyticsBlogs(): Promise<AdminBlogAnalytics> {
  const response = await apiRequest<ApiEnvelope<AdminBlogAnalytics>>('/admin/analytics/blogs');
  return response.data;
}

export async function getAdminAnalyticsPerformance(): Promise<AdminAnalyticsPerformance> {
  const response = await apiRequest<ApiEnvelope<AdminAnalyticsPerformance>>('/admin/analytics/performance');
  return response.data;
}

export async function getAdminRecentActivity(): Promise<AdminActivity[]> {
  const response = await apiRequest<ApiEnvelope<{ activities: BackendAuditActivity[] }>>('/admin/activity/recent');
  return (response.data.activities || []).map(mapActivity);
}

export async function getAdminNotifications(limit = 100): Promise<{
  notifications: AdminNotification[];
  unreadCount: number;
}> {
  const response = await apiRequest<
    ApiEnvelope<{
      notifications: BackendNotification[];
      unreadCount: number;
    }>
  >(`/notifications/me?limit=${limit}`);

  return {
    notifications: (response.data.notifications || []).map(mapNotification),
    unreadCount: response.data.unreadCount || 0
  };
}

export async function markAdminNotificationRead(notificationId: string): Promise<void> {
  await apiRequest<ApiEnvelope<{}>>(`/notifications/me/${notificationId}/read`, {
    method: 'PATCH'
  });
}

export async function markAdminNotificationsReadAll(): Promise<void> {
  await apiRequest<ApiEnvelope<{}>>('/notifications/me/read-all', {
    method: 'PATCH'
  });
}
