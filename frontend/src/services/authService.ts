import {
	apiRequest,
	clearStoredAccessToken,
	setStoredAccessToken
} from './apiClient';

export type AuthUser = {
	id: string;
	role: 'patient' | 'doctor' | 'admin';
	fullName: string;
	email: string;
	phone?: string;
	isActive: boolean;
};

export type AuthSession = {
	user: AuthUser;
	accessToken: string;
	refreshToken: string;
};

const SESSION_KEY = 'hm.session';

function saveSession(session: AuthSession): void {
	localStorage.setItem(SESSION_KEY, JSON.stringify(session));
	setStoredAccessToken(session.accessToken);
}

function getSession(): AuthSession | null {
	const raw = localStorage.getItem(SESSION_KEY);
	if (!raw) {
		return null;
	}

	try {
		return JSON.parse(raw) as AuthSession;
	} catch {
		localStorage.removeItem(SESSION_KEY);
		clearStoredAccessToken();
		return null;
	}
}

function clearSession(): void {
	localStorage.removeItem(SESSION_KEY);
	clearStoredAccessToken();
}

async function login(email: string, password: string): Promise<AuthSession> {
	const data = await apiRequest<AuthSession>('/auth/login', {
		method: 'POST',
		body: { email, password }
	});
	saveSession(data);
	return data;
}

async function registerPatient(payload: {
	fullName: string;
	email: string;
	phone?: string;
	password: string;
}): Promise<AuthSession> {
	const data = await apiRequest<AuthSession>('/auth/register/patient', {
		method: 'POST',
		body: payload
	});
	saveSession(data);
	return data;
}

async function registerDoctor(payload: {
	fullName: string;
	email: string;
	phone?: string;
	password: string;
	specialization: string;
	licenseNumber: string;
	qualifications?: string[];
	experienceYears?: number;
	hospital?: string;
	fee?: number;
	bio?: string;
	availability?: string;
}): Promise<AuthSession> {
	const data = await apiRequest<AuthSession>('/auth/register/doctor', {
		method: 'POST',
		body: payload
	});
	saveSession(data);
	return data;
}

async function adminLogin(email: string, password: string): Promise<AuthSession> {
	const data = await apiRequest<AuthSession>('/auth/admin-login', {
		method: 'POST',
		body: { email, password }
	});
	saveSession(data);
	return data;
}

async function me(): Promise<AuthUser> {
	const data = await apiRequest<{ user: AuthUser }>('/auth/me', { auth: true });
	return data.user;
}

async function refresh(refreshToken: string): Promise<Pick<AuthSession, 'accessToken' | 'refreshToken'>> {
	return apiRequest<Pick<AuthSession, 'accessToken' | 'refreshToken'>>('/auth/refresh', {
		method: 'POST',
		body: { refreshToken }
	});
}

async function logout(): Promise<void> {
	try {
		await apiRequest('/auth/logout', { method: 'POST' });
	} finally {
		clearSession();
	}
}

const authService = {
	login,
	registerPatient,
	registerDoctor,
	adminLogin,
	me,
	refresh,
	logout,
	saveSession,
	getSession,
	clearSession
};

export default authService;
