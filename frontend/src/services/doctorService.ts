import { apiRequest } from './apiClient';

export type DoctorDashboardMetrics = {
	connectedPatients: number;
	highRiskPatients: number;
	pendingAppointments: number;
	completedAppointments: number;
	prescriptionCount: number;
	draftBlogs: number;
};

export type DoctorPatientProfile = {
	_id: string;
	userId: { _id: string; fullName?: string; email?: string; phone?: string; isActive?: boolean };
	connectedDoctorIds?: string[];
	doctorNotes?: Array<{ _id?: string; doctorId: string; note: string; createdAt: string }>;
};

export type DoctorAppointment = {
	_id: string;
	patientId: { _id: string; fullName?: string; email?: string; phone?: string };
	date: string;
	time: string;
	type: 'in_person' | 'teleconsult';
	status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
	notes?: string;
};

export type DoctorPrescription = {
	_id: string;
	patientId: { _id: string; fullName?: string; email?: string; phone?: string };
	diagnosis?: string;
	medications: Array<{ name: string; dosage?: string; frequency?: string; duration?: string }>;
	instructions?: string;
	issuedAt: string;
};

export type DoctorBlog = {
	_id: string;
	title: string;
	excerpt?: string;
	content: string;
	category?: string;
	tags?: string[];
	status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'unpublished';
	createdAt?: string;
	updatedAt?: string;
};

async function getMyDashboard(): Promise<DoctorDashboardMetrics> {
	const data = await apiRequest<{ metrics: DoctorDashboardMetrics }>('/doctors/me/dashboard', { auth: true });
	return data.metrics;
}

async function getMyPatients(): Promise<DoctorPatientProfile[]> {
	const data = await apiRequest<{ patients: DoctorPatientProfile[] }>('/doctors/me/patients', { auth: true });
	return data.patients;
}

async function getMyPatientDetail(patientId: string) {
	return apiRequest<{ patient: unknown }>(`/doctors/me/patients/${patientId}`, { auth: true });
}

async function getMyPatientTrends(patientId: string, days = 30) {
	return apiRequest<{ vitals: unknown[]; totalRecords: number }>(
		`/doctors/me/patients/${patientId}/trends?days=${days}`,
		{ auth: true }
	);
}

async function addPatientNote(patientId: string, note: string) {
	return apiRequest(`/doctors/me/patients/${patientId}/notes`, {
		method: 'POST',
		auth: true,
		body: { note }
	});
}

async function getMyAppointments(): Promise<DoctorAppointment[]> {
	const data = await apiRequest<{ appointments: DoctorAppointment[] }>('/doctors/me/appointments', { auth: true });
	return data.appointments;
}

async function updateMyAppointment(appointmentId: string, payload: Partial<DoctorAppointment>) {
	const data = await apiRequest<{ appointment: DoctorAppointment }>(
		`/doctors/me/appointments/${appointmentId}`,
		{
			method: 'PATCH',
			auth: true,
			body: payload
		}
	);
	return data.appointment;
}

async function getMyPrescriptions(): Promise<DoctorPrescription[]> {
	const data = await apiRequest<{ prescriptions: DoctorPrescription[] }>('/doctors/me/prescriptions', {
		auth: true
	});
	return data.prescriptions;
}

async function createPatientPrescription(patientId: string, payload: unknown) {
	const data = await apiRequest<{ prescription: DoctorPrescription }>(
		`/doctors/me/patients/${patientId}/prescriptions`,
		{
			method: 'POST',
			auth: true,
			body: payload
		}
	);
	return data.prescription;
}

async function getMyBlogs(): Promise<DoctorBlog[]> {
	const data = await apiRequest<{ blogs: DoctorBlog[] }>('/doctors/me/blogs', { auth: true });
	return data.blogs;
}

async function createMyBlog(payload: Partial<DoctorBlog>) {
	const data = await apiRequest<{ blog: DoctorBlog }>('/doctors/me/blogs', {
		method: 'POST',
		auth: true,
		body: payload
	});
	return data.blog;
}

async function updateMyBlog(blogId: string, payload: Partial<DoctorBlog>) {
	const data = await apiRequest<{ blog: DoctorBlog }>(`/doctors/me/blogs/${blogId}`, {
		method: 'PATCH',
		auth: true,
		body: payload
	});
	return data.blog;
}

async function submitMyBlog(blogId: string) {
	const data = await apiRequest<{ blog: DoctorBlog }>(`/doctors/me/blogs/${blogId}/submit`, {
		method: 'POST',
		auth: true
	});
	return data.blog;
}

async function getMyProfile() {
	return apiRequest<{ profile: unknown }>('/doctors/me/profile', { auth: true });
}

async function updateMyProfile(payload: unknown) {
	return apiRequest<{ profile: unknown }>('/doctors/me/profile', {
		method: 'PATCH',
		auth: true,
		body: payload
	});
}

const doctorService = {
	getMyDashboard,
	getMyPatients,
	getMyPatientDetail,
	getMyPatientTrends,
	addPatientNote,
	getMyAppointments,
	updateMyAppointment,
	getMyPrescriptions,
	createPatientPrescription,
	getMyBlogs,
	createMyBlog,
	updateMyBlog,
	submitMyBlog,
	getMyProfile,
	updateMyProfile
};

export default doctorService;
