import { useEffect, useState } from 'react';
import authService, { type AuthSession } from '../services/authService';

export function useAuth() {
	const [session, setSession] = useState<AuthSession | null>(authService.getSession());
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const current = authService.getSession();
		if (!current) {
			setLoading(false);
			return;
		}

		authService
			.me()
			.then((user) => {
				const next = { ...current, user };
				authService.saveSession(next);
				setSession(next);
			})
			.catch(() => {
				authService.clearSession();
				setSession(null);
			})
			.finally(() => setLoading(false));
	}, []);

	const login = async (email: string, password: string) => {
		const next = await authService.login(email, password);
		setSession(next);
		return next;
	};

	const logout = async () => {
		await authService.logout();
		setSession(null);
	};

	return {
		session,
		loading,
		isAuthenticated: Boolean(session),
		login,
		logout
	};
}
