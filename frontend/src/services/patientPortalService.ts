import { apiRequest } from './apiClient';

export type RiskLevel = 'normal' | 'medium' | 'high';

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type PortalUser = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'patient' | 'doctor' | 'admin';
};

export type PortalVitalRecord = {
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

export type PortalAppointment = {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorEmail?: string;
  doctorPhone?: string;
  type: 'in_person' | 'teleconsult';
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdBy?: 'patient' | 'doctor' | 'admin';
};

export type PortalDashboard = {
  latestVitals: PortalVitalRecord[];
  metrics: {
    highRiskCount: number;
    upcomingAppointments: number;
    prescriptionCount: number;
  };
  upcomingAppointments: PortalAppointment[];
};

export type PatientProfile = {
  id: string;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  heightCm?: number;
  weightKg?: number;
  allergies: string[];
  medications: string[];
  medicalHistory?: string;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  connectedDoctorIds: string[];
};

export type PatientProfileUpdateInput = {
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  heightCm?: number;
  weightKg?: number;
  allergies?: string[];
  medications?: string[];
  medicalHistory?: string;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
};

export type ConnectedDoctor = {
  profileId: string;
  doctorUserId: string;
  fullName: string;
  email?: string;
  phone?: string;
  specialization?: string;
  experienceYears?: number;
  hospital?: string;
  fee?: number;
  rating?: number;
  availability?: string;
};

export type DoctorDirectoryResult = {
  doctors: Array<{
    doctorUserId: string;
    fullName: string;
    specialization?: string;
    experienceYears?: number;
    hospital?: string;
    fee?: number;
    rating?: number;
    reviewsCount?: number;
  }>;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
};

export type VitalCreateInput = {
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
};

export type VitalTrendResult = {
  periodDays: number;
  totalRecords: number;
  average: {
    heartRate: number | null;
    spo2: number | null;
    temperatureC: number | null;
    weightKg: number | null;
    systolic: number | null;
    diastolic: number | null;
  };
  vitals: PortalVitalRecord[];
};

export type PortalPrescription = {
  id: string;
  doctorName: string;
  doctorId: string;
  diagnosis?: string;
  medications: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
  }>;
  instructions?: string;
  followUpDate?: string;
  issuedAt?: string;
};

export type ChatParticipant = {
  id: string;
  fullName: string;
  email?: string;
  role?: 'patient' | 'doctor' | 'admin';
};

export type ChatConversation = {
  id: string;
  participants: ChatParticipant[];
  lastMessageAt?: string;
  updatedAt?: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderRole?: 'patient' | 'doctor' | 'admin';
  messageType: 'text' | 'file' | 'prescription';
  text?: string;
  fileUrl?: string;
  readBy: string[];
  createdAt?: string;
};

export type PortalNotification = {
  id: string;
  type: string;
  title: string;
  body?: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};

type BackendUser = {
  _id?: string;
  id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: 'patient' | 'doctor' | 'admin';
};

type BackendDoctorProfile = {
  _id: string;
  userId?: BackendUser;
  specialization?: string;
  experienceYears?: number;
  hospital?: string;
  fee?: number;
  rating?: number;
  availability?: string;
};

type BackendVitalRecord = {
  _id: string;
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
  _id: string;
  doctorId?: BackendUser | string;
  type?: 'in_person' | 'teleconsult';
  date?: string;
  time?: string;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdBy?: 'patient' | 'doctor' | 'admin';
};

type BackendPrescription = {
  _id: string;
  doctorId?: BackendUser | string;
  diagnosis?: string;
  medications?: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
  }>;
  instructions?: string;
  followUpDate?: string;
  issuedAt?: string;
};

type BackendConversation = {
  _id: string;
  participantIds: Array<BackendUser | string>;
  lastMessageAt?: string;
  updatedAt?: string;
};

type BackendMessage = {
  _id: string;
  conversationId?: string;
  senderId?: BackendUser | string;
  messageType?: 'text' | 'file' | 'prescription';
  text?: string;
  fileUrl?: string;
  readBy?: Array<BackendUser | string>;
  createdAt?: string;
};

function safeUserId(user?: BackendUser | string): string {
  if (!user) return '';
  if (typeof user === 'string') return user;
  return user.id || user._id || '';
}

function mapVital(record: BackendVitalRecord): PortalVitalRecord {
  return {
    id: record._id,
    datetime: record.datetime || new Date().toISOString(),
    bloodPressure: record.bloodPressure,
    heartRate: record.heartRate,
    spo2: record.spo2,
    temperatureC: record.temperatureC,
    glucose: record.glucose,
    weightKg: record.weightKg,
    notes: record.notes,
    riskLevel: record.riskLevel || 'normal',
    riskReasons: record.riskReasons || []
  };
}

function mapAppointment(appointment: BackendAppointment): PortalAppointment {
  const doctorUser = typeof appointment.doctorId === 'string' ? undefined : appointment.doctorId;
  const doctorId = safeUserId(appointment.doctorId);

  return {
    id: appointment._id,
    doctorId,
    doctorName: doctorUser?.fullName || 'Doctor',
    doctorEmail: doctorUser?.email,
    doctorPhone: doctorUser?.phone,
    type: appointment.type || 'in_person',
    date: appointment.date || '',
    time: appointment.time || '',
    status: appointment.status || 'pending',
    notes: appointment.notes,
    createdBy: appointment.createdBy
  };
}

function mapPrescription(prescription: BackendPrescription): PortalPrescription {
  const doctorUser = typeof prescription.doctorId === 'string' ? undefined : prescription.doctorId;

  return {
    id: prescription._id,
    doctorName: doctorUser?.fullName || 'Doctor',
    doctorId: safeUserId(prescription.doctorId),
    diagnosis: prescription.diagnosis,
    medications: prescription.medications || [],
    instructions: prescription.instructions,
    followUpDate: prescription.followUpDate,
    issuedAt: prescription.issuedAt
  };
}

function mapConversation(conversation: BackendConversation): ChatConversation {
  return {
    id: conversation._id,
    participants: (conversation.participantIds || []).map((participant) => {
      if (typeof participant === 'string') {
        return {
          id: participant,
          fullName: 'User'
        };
      }

      return {
        id: participant.id || participant._id || '',
        fullName: participant.fullName || 'User',
        email: participant.email,
        role: participant.role
      };
    }),
    lastMessageAt: conversation.lastMessageAt,
    updatedAt: conversation.updatedAt
  };
}

function mapMessage(message: BackendMessage): ChatMessage {
  const sender = typeof message.senderId === 'string' ? undefined : message.senderId;
  const normalizedReadBy = (message.readBy || []).map((item) => safeUserId(item)).filter(Boolean);

  return {
    id: message._id,
    conversationId: message.conversationId || '',
    senderId: safeUserId(message.senderId),
    senderName: sender?.fullName,
    senderRole: sender?.role,
    messageType: message.messageType || 'text',
    text: message.text,
    fileUrl: message.fileUrl,
    readBy: normalizedReadBy,
    createdAt: message.createdAt
  };
}

export async function getCurrentUser(): Promise<PortalUser> {
  const response = await apiRequest<ApiEnvelope<{ user: PortalUser }>>('/auth/me');
  return response.data.user;
}

export async function getPatientDashboard(): Promise<PortalDashboard> {
  const response = await apiRequest<
    ApiEnvelope<{
      latestVitals: BackendVitalRecord[];
      metrics: {
        highRiskCount: number;
        upcomingAppointments: number;
        prescriptionCount: number;
      };
      upcomingAppointments: BackendAppointment[];
    }>
  >('/patients/me/dashboard');

  return {
    latestVitals: (response.data.latestVitals || []).map(mapVital),
    metrics: {
      highRiskCount: response.data.metrics?.highRiskCount || 0,
      upcomingAppointments: response.data.metrics?.upcomingAppointments || 0,
      prescriptionCount: response.data.metrics?.prescriptionCount || 0
    },
    upcomingAppointments: (response.data.upcomingAppointments || []).map(mapAppointment)
  };
}

export async function getPatientProfile(): Promise<PatientProfile> {
  const response = await apiRequest<ApiEnvelope<{ profile: PatientProfile & { _id?: string } }>>(
    '/patients/me/profile'
  );
  const profile = response.data.profile;

  return {
    id: profile.id || profile._id || '',
    dob: profile.dob,
    gender: profile.gender,
    bloodGroup: profile.bloodGroup,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    allergies: profile.allergies || [],
    medications: profile.medications || [],
    medicalHistory: profile.medicalHistory,
    emergencyContact: profile.emergencyContact,
    connectedDoctorIds: profile.connectedDoctorIds || []
  };
}

export async function updatePatientProfile(payload: PatientProfileUpdateInput): Promise<PatientProfile> {
  const response = await apiRequest<ApiEnvelope<{ profile: PatientProfile & { _id?: string } }>>(
    '/patients/me/profile',
    {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }
  );

  const profile = response.data.profile;

  return {
    id: profile.id || profile._id || '',
    dob: profile.dob,
    gender: profile.gender,
    bloodGroup: profile.bloodGroup,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    allergies: profile.allergies || [],
    medications: profile.medications || [],
    medicalHistory: profile.medicalHistory,
    emergencyContact: profile.emergencyContact,
    connectedDoctorIds: profile.connectedDoctorIds || []
  };
}

export async function getPatientVitals(limit = 80): Promise<PortalVitalRecord[]> {
  const response = await apiRequest<ApiEnvelope<{ vitals: BackendVitalRecord[] }>>(`/vitals/me?limit=${limit}`);
  return (response.data.vitals || []).map(mapVital);
}

export async function createPatientVital(payload: VitalCreateInput): Promise<PortalVitalRecord> {
  const response = await apiRequest<ApiEnvelope<{ vital: BackendVitalRecord }>>('/vitals/me', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return mapVital(response.data.vital);
}

export async function updatePatientVital(vitalId: string, payload: VitalCreateInput): Promise<PortalVitalRecord> {
  const response = await apiRequest<ApiEnvelope<{ vital: BackendVitalRecord }>>(`/vitals/me/${vitalId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

  return mapVital(response.data.vital);
}

export async function deletePatientVital(vitalId: string): Promise<void> {
  await apiRequest<ApiEnvelope<Record<string, never>>>(`/vitals/me/${vitalId}`, {
    method: 'DELETE'
  });
}

export async function getPatientTrends(days: number): Promise<VitalTrendResult> {
  const response = await apiRequest<
    ApiEnvelope<{
      periodDays: number;
      totalRecords: number;
      average: VitalTrendResult['average'];
      vitals: BackendVitalRecord[];
    }>
  >(`/vitals/me/trends?days=${days}`);

  return {
    periodDays: response.data.periodDays,
    totalRecords: response.data.totalRecords,
    average: response.data.average,
    vitals: (response.data.vitals || []).map(mapVital)
  };
}

export async function getConnectedDoctors(): Promise<ConnectedDoctor[]> {
  const response = await apiRequest<ApiEnvelope<{ doctors: BackendDoctorProfile[] }>>('/patients/me/doctors');

  return (response.data.doctors || []).map((doctor) => ({
    profileId: doctor._id,
    doctorUserId: safeUserId(doctor.userId),
    fullName: (typeof doctor.userId === 'string' ? undefined : doctor.userId?.fullName) || 'Doctor',
    email: typeof doctor.userId === 'string' ? undefined : doctor.userId?.email,
    phone: typeof doctor.userId === 'string' ? undefined : doctor.userId?.phone,
    specialization: doctor.specialization,
    experienceYears: doctor.experienceYears,
    hospital: doctor.hospital,
    fee: doctor.fee,
    rating: doctor.rating,
    availability: doctor.availability
  }));
}

export async function connectDoctor(doctorId: string): Promise<void> {
  await apiRequest<ApiEnvelope<Record<string, never>>>(`/patients/me/doctors/${doctorId}/connect`, {
    method: 'POST'
  });
}

export async function disconnectDoctor(doctorId: string): Promise<void> {
  await apiRequest<ApiEnvelope<Record<string, never>>>(`/patients/me/doctors/${doctorId}/disconnect`, {
    method: 'DELETE'
  });
}

export async function getDoctorDirectory(params: {
  page?: number;
  search?: string;
  specialization?: string;
}): Promise<DoctorDirectoryResult> {
  const qs = new URLSearchParams();
  qs.set('limit', '18');
  qs.set('page', String(params.page || 1));

  if (params.search) {
    qs.set('search', params.search);
  }

  if (params.specialization && params.specialization !== 'All') {
    qs.set('specializations', params.specialization);
  }

  const response = await apiRequest<
    ApiEnvelope<{
      doctors: Array<{
        _id: string;
        userId?: {
          _id?: string;
          fullName?: string;
        };
        specialization?: string;
        experienceYears?: number;
        hospital?: string;
        fee?: number;
        rating?: number;
        reviewsCount?: number;
      }>;
      pagination: {
        page: number;
        totalPages: number;
        total: number;
      };
    }>
  >(`/doctors?${qs.toString()}`);

  return {
    doctors: (response.data.doctors || []).map((doctor) => ({
      doctorUserId: doctor.userId?._id || doctor._id,
      fullName: doctor.userId?.fullName || 'Doctor',
      specialization: doctor.specialization,
      experienceYears: doctor.experienceYears,
      hospital: doctor.hospital,
      fee: doctor.fee,
      rating: doctor.rating,
      reviewsCount: doctor.reviewsCount
    })),
    pagination: {
      page: response.data.pagination?.page || 1,
      totalPages: response.data.pagination?.totalPages || 1,
      total: response.data.pagination?.total || 0
    }
  };
}

export async function getPatientAppointments(): Promise<PortalAppointment[]> {
  const response = await apiRequest<ApiEnvelope<{ appointments: BackendAppointment[] }>>('/appointments/me');
  return (response.data.appointments || []).map(mapAppointment);
}

export async function createPatientAppointment(payload: {
  doctorId: string;
  type: 'in_person' | 'teleconsult';
  date: string;
  time: string;
  notes?: string;
}): Promise<PortalAppointment> {
  const response = await apiRequest<ApiEnvelope<{ appointment: BackendAppointment }>>('/appointments/me', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return mapAppointment(response.data.appointment);
}

export async function updatePatientAppointment(
  appointmentId: string,
  payload: Partial<{
    type: 'in_person' | 'teleconsult';
    date: string;
    time: string;
    notes?: string;
  }>
): Promise<PortalAppointment> {
  const response = await apiRequest<ApiEnvelope<{ appointment: BackendAppointment }>>(
    `/appointments/me/${appointmentId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }
  );

  return mapAppointment(response.data.appointment);
}

export async function cancelPatientAppointment(appointmentId: string): Promise<PortalAppointment> {
  const response = await apiRequest<ApiEnvelope<{ appointment: BackendAppointment }>>(
    `/appointments/me/${appointmentId}/cancel`,
    {
      method: 'POST'
    }
  );

  return mapAppointment(response.data.appointment);
}

export async function getPatientPrescriptions(): Promise<PortalPrescription[]> {
  const response = await apiRequest<ApiEnvelope<{ prescriptions: BackendPrescription[] }>>('/prescriptions/me');
  return (response.data.prescriptions || []).map(mapPrescription);
}

export async function getPrescriptionPdfUrl(prescriptionId: string): Promise<string> {
  const response = await apiRequest<ApiEnvelope<{ prescriptionId: string; pdfUrl: string }>>(
    `/prescriptions/me/${prescriptionId}/pdf`
  );
  return response.data.pdfUrl;
}

export async function getMyConversations(): Promise<ChatConversation[]> {
  const response = await apiRequest<ApiEnvelope<{ conversations: BackendConversation[] }>>('/chat/me/conversations');
  return (response.data.conversations || []).map(mapConversation);
}

export async function createOrGetConversationWithUser(userId: string): Promise<ChatConversation> {
  const response = await apiRequest<ApiEnvelope<{ conversation: BackendConversation }>>(
    '/chat/me/conversations',
    {
      method: 'POST',
      body: JSON.stringify({ toUserId: userId })
    }
  );

  return mapConversation(response.data.conversation);
}

export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  const response = await apiRequest<
    ApiEnvelope<{ conversation: BackendConversation; messages: BackendMessage[] }>
  >(`/chat/me/conversations/${conversationId}/messages`);

  return (response.data.messages || []).map(mapMessage);
}

export async function sendConversationMessage(
  conversationId: string,
  payload: {
    text?: string;
    fileUrl?: string;
    messageType?: 'text' | 'file' | 'prescription';
  }
): Promise<ChatMessage> {
  const response = await apiRequest<ApiEnvelope<{ message: BackendMessage }>>(
    `/chat/me/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify(payload)
    }
  );

  return mapMessage(response.data.message);
}

export async function getMyNotifications(limit = 30): Promise<{
  notifications: PortalNotification[];
  unreadCount: number;
}> {
  const response = await apiRequest<
    ApiEnvelope<{
      notifications: Array<{
        _id: string;
        type: string;
        title: string;
        body?: string;
        isRead: boolean;
        metadata?: Record<string, unknown>;
        createdAt?: string;
      }>;
      unreadCount: number;
    }>
  >(`/notifications/me?limit=${limit}`);

  return {
    notifications: (response.data.notifications || []).map((item) => ({
      id: item._id,
      type: item.type,
      title: item.title,
      body: item.body,
      isRead: item.isRead,
      metadata: item.metadata,
      createdAt: item.createdAt
    })),
    unreadCount: response.data.unreadCount || 0
  };
}

export async function getMyUnreadNotificationCount(): Promise<number> {
  const response = await apiRequest<ApiEnvelope<{ unreadCount: number }>>('/notifications/me/unread-count');
  return response.data.unreadCount || 0;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await apiRequest<ApiEnvelope<Record<string, never>>>(`/notifications/me/${notificationId}/read`, {
    method: 'PATCH'
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiRequest<ApiEnvelope<Record<string, never>>>('/notifications/me/read-all', {
    method: 'PATCH'
  });
}
