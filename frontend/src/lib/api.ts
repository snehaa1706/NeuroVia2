// ============================================
// NeuroVia API Client
// ============================================

const API_BASE = '/api';

class ApiClient {
    private token: string | null = null;

    setToken(token: string) {
        this.token = token;
        localStorage.setItem('neurovia_token', token);
    }

    getToken(): string | null {
        if (!this.token) {
            this.token = localStorage.getItem('neurovia_token');
        }
        return this.token;
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('neurovia_token');
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const token = this.getToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...((options.headers as Record<string, string>) || {}),
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || `API Error: ${response.status}`);
        }

        return response.json();
    }

    // Auth
    async register(data: { email: string; password: string; full_name: string; role?: string }) {
        return this.request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) });
    }

    async login(email: string, password: string) {
        return this.request<any>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    }

    async getProfile() {
        return this.request<any>('/auth/me');
    }

    // Screening
    async startScreening(level: string = 'scd') {
        return this.request<any>('/screening/start', { method: 'POST', body: JSON.stringify({ level }) });
    }

    async submitTest(screeningId: string, testType: string, responses: Record<string, any>) {
        return this.request<any>(`/screening/${screeningId}/submit`, {
            method: 'POST',
            body: JSON.stringify({ test_type: testType, responses }),
        });
    }

    async getScreeningHistory() {
        return this.request<any>('/screening/history/list');
    }

    async completeScreening(screeningId: string) {
        return this.request<any>(`/screening/${screeningId}/complete`, { method: 'POST' });
    }

    // AI
    async analyzeScreening(screeningId: string) {
        return this.request<any>('/ai/analyze-screening', {
            method: 'POST',
            body: JSON.stringify({ screening_id: screeningId }),
        });
    }

    async generateActivity(activityType?: string, difficulty?: string) {
        return this.request<any>('/ai/generate-activity', {
            method: 'POST',
            body: JSON.stringify({ activity_type: activityType, difficulty }),
        });
    }

    async getHealthGuidance(logId: string) {
        return this.request<any>('/ai/health-guidance', {
            method: 'POST',
            body: JSON.stringify({ health_log_id: logId }),
        });
    }

    async getConsultationSummary(screeningId: string) {
        return this.request<any>('/ai/consultation-summary', {
            method: 'POST',
            body: JSON.stringify({ screening_id: screeningId }),
        });
    }

    async getCognitiveSummary() {
        return this.request<any>('/cognitive/summary');
    }

    async getCognitiveHistory() {
        return this.request<any>('/cognitive/history/list');
    }

    async startCognitiveTest(testType: string, difficulty: string) {
        return this.request<any>('/cognitive/start', {
            method: 'POST',
            body: JSON.stringify({ test_type: testType, difficulty }),
        });
    }

    async submitCognitiveTest(sessionId: string, responses: any, timeTakenSeconds: number) {
        return this.request<any>(`/cognitive/${sessionId}/submit`, {
            method: 'POST',
            body: JSON.stringify({ responses, time_taken_seconds: timeTakenSeconds }),
        });
    }

    // Health Logs
    async submitCheckin(data: any) {
        return this.request<any>('/health/checkin', { method: 'POST', body: JSON.stringify(data) });
    }

    async logIncident(data: any) {
        return this.request<any>('/health/incident', { method: 'POST', body: JSON.stringify(data) });
    }

    async getHealthLogs() {
        return this.request<any>(`/health/logs`);
    }



    // Medications
    async getMedications() {
        return this.request<any>(`/medications/`);
    }

    async addMedication(data: any) {
        return this.request<any>('/medications/', { method: 'POST', body: JSON.stringify(data) });
    }

    async logMedication(medicationId: string, status: string, notes?: string) {
        return this.request<any>(`/medications/${medicationId}/log`, {
            method: 'POST',
            body: JSON.stringify({ status, notes }),
        });
    }

    async getMedicationAdherence() {
        return this.request<any>(`/medications/adherence`);
    }

    // Activities
    async getActivities() {
        return this.request<any>(`/activities/`);
    }

    async submitActivityResult(activityId: string, responses: Record<string, any>) {
        return this.request<any>(`/activities/${activityId}/submit`, {
            method: 'POST',
            body: JSON.stringify({ responses }),
        });
    }

    async getActivityProgress() {
        return this.request<any>(`/activities/progress`);
    }

    // Alerts
    async getAlerts(unreadOnly: boolean = false) {
        return this.request<any>(`/alerts/?unread_only=${unreadOnly}`);
    }

    async markAlertRead(alertId: string) {
        return this.request<any>(`/alerts/${alertId}/read`, { method: 'PUT' });
    }
}

export const api = new ApiClient();
