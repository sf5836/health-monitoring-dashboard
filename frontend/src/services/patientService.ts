import { apiRequest } from './apiClient';

export type ConnectedDoctor = {
	_id: string;
	userId: {
		_id: string;
		fullName: string;
		email: string;
		phone?: string;
	};
	specialization?: string;
	hospital?: string;
	fee?: number;
	approvalStatus: string;
};

export type PatientAppointment = {
	_id: string;
	doctorId: {
		_id: string;
		fullName?: string;
		email?: string;
		phone?: string;
	};
	type: 'in_person' | 'teleconsult';
	date: string;
	time: string;
	status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
	notes?: string;
	createdAt: string;
};

export type CreateAppointmentPayload = {
	doctorId: string;
	type: 'in_person' | 'teleconsult';
	date: string;
	time: string;
	notes?: string;
};

export type DashboardVital = {
	_id: string;
	datetime: string;
	bloodPressure?: { systolic?: number; diastolic?: number };
	heartRate?: number;
	spo2?: number;
	glucose?: { value?: number; mode?: string };
	riskLevel?: 'normal' | 'medium' | 'high';
};

export type DashboardAppointment = {
	_id: string;
	doctorId: { _id: string; fullName?: string; email?: string };
	date: string;
	time: string;
	type: 'in_person' | 'teleconsult';
	status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
};

export type PatientDashboard = {
	latestVitals: DashboardVital[];
	metrics: {
		highRiskCount: number;
		upcomingAppointments: number;
		prescriptionCount: number;
	};
	upcomingAppointments: DashboardAppointment[];
};

async function getMyDoctors(): Promise<ConnectedDoctor[]> {
	const data = await apiRequest<{ doctors: ConnectedDoctor[] }>('/patients/me/doctors', {
		auth: true
	});
	return data.doctors;
}

async function connectDoctor(doctorId: string): Promise<void> {
	await apiRequest(`/patients/me/doctors/${doctorId}/connect`, {
		method: 'POST',
		auth: true
	});
}

async function disconnectDoctor(doctorId: string): Promise<void> {
	await apiRequest(`/patients/me/doctors/${doctorId}/disconnect`, {
		method: 'DELETE',
		auth: true
	});
}

async function getMyDashboard(): Promise<PatientDashboard> {
	return apiRequest<PatientDashboard>('/patients/me/dashboard', {
		auth: true
	});
}

async function getMyAppointments(): Promise<PatientAppointment[]> {
	const data = await apiRequest<{ appointments: PatientAppointment[] }>('/appointments/me', {
		auth: true
	});
	return data.appointments;
}

async function createMyAppointment(payload: CreateAppointmentPayload): Promise<PatientAppointment> {
	const data = await apiRequest<{ appointment: PatientAppointment }>('/appointments/me', {
		method: 'POST',
		body: payload,
		auth: true
	});
	return data.appointment;
}

async function updateMyAppointment(
	appointmentId: string,
	payload: Partial<Pick<CreateAppointmentPayload, 'date' | 'time' | 'type' | 'notes'>>
): Promise<PatientAppointment> {
	const data = await apiRequest<{ appointment: PatientAppointment }>(
		`/appointments/me/${appointmentId}`,
		{
			method: 'PATCH',
			body: payload,
			auth: true
		}
	);
	return data.appointment;
}

async function cancelMyAppointment(appointmentId: string): Promise<PatientAppointment> {
	const data = await apiRequest<{ appointment: PatientAppointment }>(
		`/appointments/me/${appointmentId}`,
		{
			method: 'DELETE',
			auth: true
		}
	);
	return data.appointment;
}

const patientService = {
	getMyDashboard,
	getMyDoctors,
	connectDoctor,
	disconnectDoctor,
	getMyAppointments,
	createMyAppointment,
	updateMyAppointment,
	cancelMyAppointment
};

export default patientService;
