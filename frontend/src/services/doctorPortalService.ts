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
  userId?: BackendUser;
  specialization?: string;
  licenseNumber?: string;
  qualifications?: string[];
  experienceYears?: number;
  hospital?: string;
  fee?: number;
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
};

type BackendPatientProfile = {
  _id?: string;
  userId?: BackendUser;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  allergies?: string[];
  medications?: string[];
  medicalHistory?: string;
  connectedDoctorIds?: Array<string | BackendUser>;
  doctorNotes?: BackendDoctorNote[];
  updatedAt?: string;
};

type BackendDoctorNote = {
  _id?: string;
  doctorId?: string | BackendUser;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
};

type BackendVital = {
  _id?: string;
  datetime?: string;
  bloodPressure?: {
    systolic?: number;
    diastolic?: number;
  };
  heartRate?: number;
  spo2?: number;
  temperatureC?: number;
  glucose?: {
    value?: number;
    mode?: 'fasting' | 'post_meal' | 'random';
  };
  weightKg?: number;
  notes?: string;
  riskLevel?: RiskLevel;
  riskReasons?: string[];
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

type BackendPrescription = {
  _id?: string;
  patientId?: string | BackendUser;
  doctorId?: string | BackendUser;
  diagnosis?: string;
  medications?: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
  }>;
  instructions?: string;
  followUpDate?: string;
  pdfUrl?: string;
  issuedAt?: string;
};

type BackendBlog = {
  _id?: string;
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

type BackendNotification = {
  _id?: string;
  type?: string;
  title?: string;
  body?: string;
  isRead?: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};

function safeId(value?: string | BackendUser): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.id || value._id || '';
}

function ageFromDob(dob?: string): number | null {
  if (!dob) return null;
  const parsed = new Date(dob);
  if (Number.isNaN(parsed.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - parsed.getFullYear();
  const monthDelta = now.getMonth() - parsed.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < parsed.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export type DoctorUser = {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  role?: 'patient' | 'doctor' | 'admin';
};

export type DoctorProfile = {
  user: DoctorUser;
  specialization?: string;
  licenseNumber?: string;
  qualifications: string[];
  experienceYears?: number;
  hospital?: string;
  fee?: number;
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
    fileUrl?: string;
    contentType?: string;
    uploadedAt?: string;
  }>;
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'suspended';
};

export type DoctorDashboardMetrics = {
  connectedPatients: number;
  highRiskPatients: number;
  pendingAppointments: number;
  completedAppointments: number;
  prescriptionCount: number;
  draftBlogs: number;
};

export type DoctorPatientSummary = {
  profileId: string;
  patientId: string;
  fullName: string;
  email?: string;
  phone?: string;
  dob?: string;
  age: number | null;
  gender?: string;
  bloodGroup?: string;
  allergies: string[];
  medications: string[];
  medicalHistory?: string;
  updatedAt?: string;
};

export type DoctorVitalRecord = {
  id: string;
  datetime: string;
  bloodPressure?: {
    systolic?: number;
    diastolic?: number;
  };
  heartRate?: number;
  spo2?: number;
  temperatureC?: number;
  glucose?: {
    value?: number;
    mode?: 'fasting' | 'post_meal' | 'random';
  };
  weightKg?: number;
  notes?: string;
  riskLevel: RiskLevel;
  riskReasons: string[];
};

export type DoctorAppointment = {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  doctorId: string;
  type: 'in_person' | 'teleconsult';
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdBy?: 'patient' | 'doctor' | 'admin';
  createdAt?: string;
  updatedAt?: string;
};

export type DoctorPrescription = {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  diagnosis?: string;
  medications: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
  }>;
  instructions?: string;
  followUpDate?: string;
  pdfUrl?: string;
  issuedAt?: string;
};

export type DoctorNote = {
  id: string;
  doctorId: string;
  note: string;
  createdAt?: string;
  updatedAt?: string;
};

export type DoctorPatientDetail = {
  user: DoctorUser;
  profile: {
    id: string;
    dob?: string;
    gender?: string;
    bloodGroup?: string;
    allergies: string[];
    medications: string[];
    medicalHistory?: string;
    doctorNotes: DoctorNote[];
  };
  doctorNotes: DoctorNote[];
  latestVitals: DoctorVitalRecord[];
  recentAppointments: DoctorAppointment[];
  prescriptionCount: number;
};

export type DoctorPatientTrends = {
  patientId: string;
  periodDays: number;
  totalRecords: number;
  vitals: DoctorVitalRecord[];
};

export type DoctorBlog = {
  id: string;
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

export type DoctorNotification = {
  id: string;
  type: string;
  title: string;
  body?: string;
  isRead: boolean;
  createdAt?: string;
};

function mapDoctorUser(value?: BackendUser): DoctorUser {
  return {
    id: safeId(value),
    fullName: value?.fullName || 'User',
    email: value?.email,
    phone: value?.phone,
    role: value?.role
  };
}

function mapVital(item: BackendVital): DoctorVitalRecord {
  return {
    id: item._id || '',
    datetime: item.datetime || new Date().toISOString(),
    bloodPressure: item.bloodPressure,
    heartRate: item.heartRate,
    spo2: item.spo2,
    temperatureC: item.temperatureC,
    glucose: item.glucose,
    weightKg: item.weightKg,
    notes: item.notes,
    riskLevel: item.riskLevel || 'normal',
    riskReasons: item.riskReasons || []
  };
}

function mapAppointment(item: BackendAppointment): DoctorAppointment {
  const patient = typeof item.patientId === 'string' ? undefined : item.patientId;

  return {
    id: item._id || '',
    patientId: safeId(item.patientId),
    patientName: patient?.fullName || 'Patient',
    patientEmail: patient?.email,
    patientPhone: patient?.phone,
    doctorId: safeId(item.doctorId),
    type: item.type || 'in_person',
    date: item.date || '',
    time: item.time || '',
    status: item.status || 'pending',
    notes: item.notes,
    createdBy: item.createdBy,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

function mapPrescription(item: BackendPrescription): DoctorPrescription {
  const patient = typeof item.patientId === 'string' ? undefined : item.patientId;

  return {
    id: item._id || '',
    patientId: safeId(item.patientId),
    patientName: patient?.fullName || 'Patient',
    patientEmail: patient?.email,
    diagnosis: item.diagnosis,
    medications: item.medications || [],
    instructions: item.instructions,
    followUpDate: item.followUpDate,
    pdfUrl: item.pdfUrl,
    issuedAt: item.issuedAt
  };
}

function mapDoctorNote(item: BackendDoctorNote): DoctorNote {
  return {
    id: item._id || crypto.randomUUID(),
    doctorId: safeId(item.doctorId),
    note: item.note || '',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

function mapPatientSummary(profile: BackendPatientProfile): DoctorPatientSummary {
  const user = profile.userId;
  const dob = profile.dob;

  return {
    profileId: profile._id || '',
    patientId: safeId(user),
    fullName: user?.fullName || 'Patient',
    email: user?.email,
    phone: user?.phone,
    dob,
    age: ageFromDob(dob),
    gender: profile.gender,
    bloodGroup: profile.bloodGroup,
    allergies: profile.allergies || [],
    medications: profile.medications || [],
    medicalHistory: profile.medicalHistory,
    updatedAt: profile.updatedAt
  };
}

function mapBlog(item: BackendBlog): DoctorBlog {
  return {
    id: item._id || '',
    title: item.title || 'Untitled',
    excerpt: item.excerpt,
    content: item.content || '',
    coverImageUrl: item.coverImageUrl,
    category: item.category,
    tags: item.tags || [],
    status: item.status || 'draft',
    rejectionReason: item.rejectionReason,
    submittedAt: item.submittedAt,
    publishedAt: item.publishedAt,
    views: item.views || 0,
    likes: item.likes || 0,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

export async function getDoctorDashboardMetrics(): Promise<DoctorDashboardMetrics> {
  const response = await apiRequest<
    ApiEnvelope<{
      metrics: DoctorDashboardMetrics;
    }>
  >('/doctors/me/dashboard');

  return {
    connectedPatients: response.data.metrics?.connectedPatients || 0,
    highRiskPatients: response.data.metrics?.highRiskPatients || 0,
    pendingAppointments: response.data.metrics?.pendingAppointments || 0,
    completedAppointments: response.data.metrics?.completedAppointments || 0,
    prescriptionCount: response.data.metrics?.prescriptionCount || 0,
    draftBlogs: response.data.metrics?.draftBlogs || 0
  };
}

export async function getDoctorPatients(): Promise<DoctorPatientSummary[]> {
  const response = await apiRequest<ApiEnvelope<{ patients: BackendPatientProfile[] }>>('/doctors/me/patients');
  return (response.data.patients || []).map(mapPatientSummary);
}

export async function getDoctorPatientDetail(patientId: string): Promise<DoctorPatientDetail> {
  const response = await apiRequest<
    ApiEnvelope<{
      patient: {
        user?: BackendUser;
        profile?: BackendPatientProfile;
        doctorNotes?: BackendDoctorNote[];
        latestVitals?: BackendVital[];
        recentAppointments?: BackendAppointment[];
        prescriptionCount?: number;
      };
    }>
  >(`/doctors/me/patients/${patientId}`);

  const payload = response.data.patient || {};
  const profile = payload.profile || {};
  const doctorNotes = (payload.doctorNotes || profile.doctorNotes || []).map(mapDoctorNote);

  return {
    user: mapDoctorUser(payload.user),
    profile: {
      id: profile._id || '',
      dob: profile.dob,
      gender: profile.gender,
      bloodGroup: profile.bloodGroup,
      allergies: profile.allergies || [],
      medications: profile.medications || [],
      medicalHistory: profile.medicalHistory,
      doctorNotes
    },
    doctorNotes,
    latestVitals: (payload.latestVitals || []).map(mapVital),
    recentAppointments: (payload.recentAppointments || []).map(mapAppointment),
    prescriptionCount: payload.prescriptionCount || 0
  };
}

export async function getDoctorPatientTrends(patientId: string, days = 30): Promise<DoctorPatientTrends> {
  const response = await apiRequest<
    ApiEnvelope<{
      patientId: string;
      periodDays: number;
      totalRecords: number;
      vitals: BackendVital[];
    }>
  >(`/doctors/me/patients/${patientId}/trends?days=${days}`);

  return {
    patientId: response.data.patientId,
    periodDays: response.data.periodDays,
    totalRecords: response.data.totalRecords,
    vitals: (response.data.vitals || []).map(mapVital)
  };
}

export async function addDoctorPatientNote(patientId: string, note: string): Promise<DoctorNote> {
  const response = await apiRequest<ApiEnvelope<{ note: BackendDoctorNote }>>(
    `/doctors/me/patients/${patientId}/notes`,
    {
      method: 'POST',
      body: JSON.stringify({ note })
    }
  );

  return mapDoctorNote(response.data.note);
}

export async function getDoctorProfile(): Promise<DoctorProfile> {
  const response = await apiRequest<
    ApiEnvelope<{
      profile: {
        user?: BackendUser;
        doctorProfile?: BackendDoctorProfile;
      };
    }>
  >('/doctors/me/profile');

  const data = response.data.profile || {};
  const doctorProfile = data.doctorProfile || {};

  return {
    user: mapDoctorUser(data.user),
    specialization: doctorProfile.specialization,
    licenseNumber: doctorProfile.licenseNumber,
    qualifications: doctorProfile.qualifications || [],
    experienceYears: doctorProfile.experienceYears,
    hospital: doctorProfile.hospital,
    fee: doctorProfile.fee,
    bio: doctorProfile.bio,
    availability: doctorProfile.availability,
    availabilitySchedule: (doctorProfile.availabilitySchedule || []).map((slot) => ({
      day: (slot.day || 'monday') as DoctorProfile['availabilitySchedule'][number]['day'],
      startTime: slot.startTime || '09:00',
      endTime: slot.endTime || '17:00'
    })),
    legalDocuments: (doctorProfile.legalDocuments || [])
      .filter((item) => Boolean(item?.fileName))
      .map((item) => ({
        label: item?.label,
        fileName: item?.fileName || 'document.pdf',
        fileUrl: item?.fileUrl,
        contentType: item?.contentType,
        uploadedAt: item?.uploadedAt
      })),
    approvalStatus: doctorProfile.approvalStatus
  };
}

export async function updateDoctorProfile(payload: {
  fullName?: string;
  phone?: string;
  specialization?: string;
  licenseNumber?: string;
  qualifications?: string[];
  experienceYears?: number;
  hospital?: string;
  fee?: number;
  bio?: string;
  availability?: string;
  availabilitySchedule?: Array<{
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    startTime: string;
    endTime: string;
  }>;
  legalDocuments?: Array<{
    label?: string;
    fileName: string;
    contentType: string;
    dataBase64: string;
  }>;
}): Promise<DoctorProfile> {
  const response = await apiRequest<
    ApiEnvelope<{
      profile: {
        user?: BackendUser;
        doctorProfile?: BackendDoctorProfile;
      };
    }>
  >('/doctors/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

  const data = response.data.profile || {};
  const doctorProfile = data.doctorProfile || {};

  return {
    user: mapDoctorUser(data.user),
    specialization: doctorProfile.specialization,
    licenseNumber: doctorProfile.licenseNumber,
    qualifications: doctorProfile.qualifications || [],
    experienceYears: doctorProfile.experienceYears,
    hospital: doctorProfile.hospital,
    fee: doctorProfile.fee,
    bio: doctorProfile.bio,
    availability: doctorProfile.availability,
    availabilitySchedule: (doctorProfile.availabilitySchedule || []).map((slot) => ({
      day: (slot.day || 'monday') as DoctorProfile['availabilitySchedule'][number]['day'],
      startTime: slot.startTime || '09:00',
      endTime: slot.endTime || '17:00'
    })),
    legalDocuments: (doctorProfile.legalDocuments || [])
      .filter((item) => Boolean(item?.fileName))
      .map((item) => ({
        label: item?.label,
        fileName: item?.fileName || 'document.pdf',
        fileUrl: item?.fileUrl,
        contentType: item?.contentType,
        uploadedAt: item?.uploadedAt
      })),
    approvalStatus: doctorProfile.approvalStatus
  };
}

export async function getDoctorAppointments(): Promise<DoctorAppointment[]> {
  const response = await apiRequest<ApiEnvelope<{ appointments: BackendAppointment[] }>>('/doctors/me/appointments');
  return (response.data.appointments || []).map(mapAppointment);
}

export async function updateDoctorAppointment(
  appointmentId: string,
  payload: Partial<{
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    notes: string;
    date: string;
    time: string;
    type: 'in_person' | 'teleconsult';
  }>
): Promise<DoctorAppointment> {
  const response = await apiRequest<ApiEnvelope<{ appointment: BackendAppointment }>>(
    `/doctors/me/appointments/${appointmentId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }
  );

  return mapAppointment(response.data.appointment);
}

export async function getDoctorPrescriptions(): Promise<DoctorPrescription[]> {
  const response = await apiRequest<ApiEnvelope<{ prescriptions: BackendPrescription[] }>>('/doctors/me/prescriptions');
  return (response.data.prescriptions || []).map(mapPrescription);
}

export async function createDoctorPrescription(
  patientId: string,
  payload: {
    diagnosis?: string;
    medications: Array<{
      name: string;
      dosage?: string;
      frequency?: string;
      duration?: string;
    }>;
    instructions?: string;
    followUpDate?: string;
    pdfUrl?: string;
  }
): Promise<DoctorPrescription> {
  const response = await apiRequest<ApiEnvelope<{ prescription: BackendPrescription }>>(
    `/doctors/me/patients/${patientId}/prescriptions`,
    {
      method: 'POST',
      body: JSON.stringify(payload)
    }
  );

  return mapPrescription(response.data.prescription);
}

export async function getDoctorBlogs(): Promise<DoctorBlog[]> {
  const response = await apiRequest<ApiEnvelope<{ blogs: BackendBlog[] }>>('/doctors/me/blogs');
  return (response.data.blogs || []).map(mapBlog);
}

export async function createDoctorBlog(payload: {
  title: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string;
  category?: string;
  tags?: string[];
}): Promise<DoctorBlog> {
  const response = await apiRequest<ApiEnvelope<{ blog: BackendBlog }>>('/doctors/me/blogs', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return mapBlog(response.data.blog);
}

export async function updateDoctorBlog(
  blogId: string,
  payload: Partial<{
    title: string;
    excerpt: string;
    content: string;
    coverImageUrl?: string;
    category?: string;
    tags?: string[];
  }>
): Promise<DoctorBlog> {
  const response = await apiRequest<ApiEnvelope<{ blog: BackendBlog }>>(`/doctors/me/blogs/${blogId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

  return mapBlog(response.data.blog);
}

export async function submitDoctorBlog(blogId: string): Promise<DoctorBlog> {
  const response = await apiRequest<ApiEnvelope<{ blog: BackendBlog }>>(`/doctors/me/blogs/${blogId}/submit`, {
    method: 'POST'
  });

  return mapBlog(response.data.blog);
}

export async function getDoctorInboxOverview(limit = 80): Promise<{
  notifications: DoctorNotification[];
  unreadCount: number;
  unreadChatCount: number;
}> {
  const response = await apiRequest<
    ApiEnvelope<{
      notifications: BackendNotification[];
      unreadCount: number;
    }>
  >(`/notifications/me?limit=${limit}`);

  const notifications = (response.data.notifications || []).map((item) => ({
    id: item._id || crypto.randomUUID(),
    type: item.type || 'system',
    title: item.title || 'Notification',
    body: item.body,
    isRead: Boolean(item.isRead),
    createdAt: item.createdAt
  }));

  const unreadChatCount = notifications.filter((item) => !item.isRead && item.type === 'chat').length;

  return {
    notifications,
    unreadCount: response.data.unreadCount || 0,
    unreadChatCount
  };
}
