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

export type VitalRiskLevel = 'normal' | 'medium' | 'high';

export type PatientVitalRecord = {
	_id: string;
	datetime: string;
	bloodPressure?: { systolic?: number; diastolic?: number };
	heartRate?: number;
	spo2?: number;
	temperatureC?: number;
	glucose?: { value?: number; mode?: 'fasting' | 'post_meal' | 'random' };
	weightKg?: number;
	notes?: string;
	riskLevel?: VitalRiskLevel;
	riskReasons?: string[];
	createdAt?: string;
	updatedAt?: string;
};

export type PatientVitalPayload = {
	datetime?: string;
	bloodPressure?: { systolic?: number; diastolic?: number };
	heartRate?: number;
	spo2?: number;
	temperatureC?: number;
	glucose?: { value?: number; mode?: 'fasting' | 'post_meal' | 'random' };
	weightKg?: number;
	notes?: string;
};

export type PatientTrends = {
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
	vitals: PatientVitalRecord[];
};

export type PatientPrescription = {
	_id: string;
	doctorId: {
		_id: string;
		fullName?: string;
		email?: string;
		phone?: string;
	};
	diagnosis?: string;
	medications: Array<{ name: string; dosage?: string; frequency?: string; duration?: string }>;
	instructions?: string;
	followUpDate?: string;
	issuedAt: string;
	pdfUrl?: string;
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

async function getMyVitals(limit = 100): Promise<PatientVitalRecord[]> {
	const data = await apiRequest<{ vitals: PatientVitalRecord[] }>(`/vitals/me?limit=${limit}`, {
		auth: true
	});
	return data.vitals;
}

async function createMyVital(payload: PatientVitalPayload): Promise<PatientVitalRecord> {
	const data = await apiRequest<{ vital: PatientVitalRecord }>('/vitals/me', {
		method: 'POST',
		body: payload,
		auth: true
	});
	return data.vital;
}

async function updateMyVital(vitalId: string, payload: PatientVitalPayload): Promise<PatientVitalRecord> {
	const data = await apiRequest<{ vital: PatientVitalRecord }>(`/vitals/me/${vitalId}`, {
		method: 'PATCH',
		body: payload,
		auth: true
	});
	return data.vital;
}

async function deleteMyVital(vitalId: string): Promise<void> {
	await apiRequest(`/vitals/me/${vitalId}`, {
		method: 'DELETE',
		auth: true
	});
}

async function getMyTrends(days = 30): Promise<PatientTrends> {
	return apiRequest<PatientTrends>(`/vitals/me/trends?days=${days}`, {
		auth: true
	});
}

async function getMyPrescriptions(): Promise<PatientPrescription[]> {
	const data = await apiRequest<{ prescriptions: PatientPrescription[] }>('/prescriptions/me', {
		auth: true
	});
	return data.prescriptions;
}

async function getPrescriptionPdf(prescriptionId: string): Promise<{ prescriptionId: string; pdfUrl: string }> {
	return apiRequest<{ prescriptionId: string; pdfUrl: string }>(`/prescriptions/me/${prescriptionId}/pdf`, {
		auth: true
	});
}

const patientService = {
	getMyDashboard,
	getMyDoctors,
	connectDoctor,
	disconnectDoctor,
	getMyAppointments,
	createMyAppointment,
	updateMyAppointment,
	cancelMyAppointment,
	getMyVitals,
	createMyVital,
	updateMyVital,
	deleteMyVital,
	getMyTrends,
	getMyPrescriptions,
	getPrescriptionPdf
};

export default patientService;
