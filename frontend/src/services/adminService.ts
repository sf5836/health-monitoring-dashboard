import { apiRequest } from './apiClient';

export type AdminDashboardStats = {
	doctors: { total: number; pending: number; approved: number; suspended: number };
	patients: { total: number };
	blogs: { total: number; pending: number; published: number };
	clinical: { highRiskVitals: number; activeAppointments: number; totalPrescriptions: number };
};

export type AdminDoctorRecord = {
	_id: string;
	userId?: {
		_id: string;
		fullName?: string;
		email?: string;
		phone?: string;
		isActive?: boolean;
		createdAt?: string;
	};
	specialization?: string;
	hospital?: string;
	bio?: string;
	approvalStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
	approvalNote?: string;
	createdAt?: string;
};

export type AdminBlogRecord = {
	_id: string;
	authorId?: { _id: string; fullName?: string; email?: string; role?: string };
	title: string;
	excerpt?: string;
	content: string;
	category?: string;
	tags?: string[];
	status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'unpublished';
	publishedAt?: string;
	submittedAt?: string;
	createdAt?: string;
};

export type AdminAnalyticsOverview = {
	totalUsers: number;
	activeDoctors: number;
	totalPatients: number;
	totalBlogs: number;
	pendingBlogs: number;
	highRiskVitals: number;
};

export type AdminAnalyticsGrowthBucket = {
	_id: { year: number; month: number };
	count: number;
};

export type AdminAnalyticsGrowth = {
	periodMonths: number;
	users: AdminAnalyticsGrowthBucket[];
	doctors: AdminAnalyticsGrowthBucket[];
	patients: AdminAnalyticsGrowthBucket[];
	blogs: AdminAnalyticsGrowthBucket[];
};

export type AdminAnalyticsBlogs = {
	statusBreakdown: Array<{ _id: string; count: number }>;
	categoryBreakdown: Array<{ _id: string; count: number }>;
	topBlogs: AdminBlogRecord[];
};

export type AdminCreateOrUpdateBlogPayload = {
	title?: string;
	excerpt?: string;
	content?: string;
	coverImageUrl?: string;
	category?: string;
	tags?: string[];
	status?: 'draft' | 'pending_review' | 'published' | 'rejected' | 'unpublished';
	rejectionReason?: string;
};

async function getDashboard(): Promise<AdminDashboardStats> {
	return apiRequest<AdminDashboardStats>('/admin/dashboard', { auth: true });
}

async function getDoctors(): Promise<AdminDoctorRecord[]> {
	const data = await apiRequest<{ doctors: AdminDoctorRecord[] }>('/admin/doctors', {
		auth: true
	});
	return data.doctors;
}

async function getPendingDoctors(): Promise<AdminDoctorRecord[]> {
	const data = await apiRequest<{ doctors: AdminDoctorRecord[] }>('/admin/doctors/pending', {
		auth: true
	});
	return data.doctors;
}

async function approveDoctor(doctorId: string, note?: string) {
	return apiRequest<{ doctor: AdminDoctorRecord }>(`/admin/doctors/${doctorId}/approve`, {
		method: 'POST',
		auth: true,
		body: { note }
	});
}

async function rejectDoctor(doctorId: string, note?: string) {
	return apiRequest<{ doctor: AdminDoctorRecord }>(`/admin/doctors/${doctorId}/reject`, {
		method: 'POST',
		auth: true,
		body: { note }
	});
}

async function suspendDoctor(doctorId: string, note?: string) {
	return apiRequest<{ doctor: AdminDoctorRecord }>(`/admin/doctors/${doctorId}/suspend`, {
		method: 'POST',
		auth: true,
		body: { note }
	});
}

async function getBlogs(): Promise<AdminBlogRecord[]> {
	const data = await apiRequest<{ blogs: AdminBlogRecord[] }>('/admin/blogs', { auth: true });
	return data.blogs;
}

async function getPendingBlogs(): Promise<AdminBlogRecord[]> {
	const data = await apiRequest<{ blogs: AdminBlogRecord[] }>('/admin/blogs/pending', {
		auth: true
	});
	return data.blogs;
}

async function publishBlog(blogId: string): Promise<AdminBlogRecord> {
	const data = await apiRequest<{ blog: AdminBlogRecord }>(`/admin/blogs/${blogId}/publish`, {
		method: 'POST',
		auth: true
	});
	return data.blog;
}

async function rejectBlog(blogId: string, reason?: string): Promise<AdminBlogRecord> {
	const data = await apiRequest<{ blog: AdminBlogRecord }>(`/admin/blogs/${blogId}/reject`, {
		method: 'POST',
		auth: true,
		body: { reason }
	});
	return data.blog;
}

async function createBlog(payload: AdminCreateOrUpdateBlogPayload): Promise<AdminBlogRecord> {
	const data = await apiRequest<{ blog: AdminBlogRecord }>('/admin/blogs', {
		method: 'POST',
		auth: true,
		body: payload
	});
	return data.blog;
}

async function updateBlog(blogId: string, payload: AdminCreateOrUpdateBlogPayload): Promise<AdminBlogRecord> {
	const data = await apiRequest<{ blog: AdminBlogRecord }>(`/admin/blogs/${blogId}`, {
		method: 'PATCH',
		auth: true,
		body: payload
	});
	return data.blog;
}

async function getAnalyticsOverview(): Promise<AdminAnalyticsOverview> {
	return apiRequest<AdminAnalyticsOverview>('/admin/analytics/overview', {
		auth: true
	});
}

async function getAnalyticsGrowth(): Promise<AdminAnalyticsGrowth> {
	return apiRequest<AdminAnalyticsGrowth>('/admin/analytics/growth', {
		auth: true
	});
}

async function getAnalyticsBlogs(): Promise<AdminAnalyticsBlogs> {
	return apiRequest<AdminAnalyticsBlogs>('/admin/analytics/blogs', {
		auth: true
	});
}

const adminService = {
	getDashboard,
	getDoctors,
	getPendingDoctors,
	approveDoctor,
	rejectDoctor,
	suspendDoctor,
	getBlogs,
	getPendingBlogs,
	publishBlog,
	rejectBlog,
	createBlog,
	updateBlog,
	getAnalyticsOverview,
	getAnalyticsGrowth,
	getAnalyticsBlogs
};

export default adminService;
