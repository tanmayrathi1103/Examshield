import api from './axios';
import type {
  StudentDirectoryItem,
  FacultyDirectoryItem,
  AdminStatsResponse,
  AdminViolationItem,
  ViolationResolveResponse,
  AISettingsConfig,
  AuditLogItem
} from '../types';

export const adminApi = {
  // Directory endpoints
  getStudentsDirectory: async (): Promise<StudentDirectoryItem[]> => {
    const res = await api.get<StudentDirectoryItem[]>('/users/students');
    return res.data;
  },

  getFacultyDirectory: async (): Promise<FacultyDirectoryItem[]> => {
    const res = await api.get<FacultyDirectoryItem[]>('/users/faculty');
    return res.data;
  },

  updateUserStatus: async (userId: string, isActive: boolean): Promise<{ id: string; is_active: boolean; status: string; message: string }> => {
    const res = await api.patch(`/users/${userId}/status`, { is_active: isActive });
    return res.data;
  },

  // Admin Dashboard & Violations
  getAdminStats: async (): Promise<AdminStatsResponse> => {
    const res = await api.get<AdminStatsResponse>('/admin/stats');
    return res.data;
  },

  getAdminViolations: async (filterType?: string): Promise<AdminViolationItem[]> => {
    const params = filterType && filterType !== 'All' ? { filter_type: filterType } : {};
    const res = await api.get<AdminViolationItem[]>('/admin/violations', { params });
    return res.data;
  },

  resolveViolation: async (eventId: string): Promise<ViolationResolveResponse> => {
    const res = await api.post<ViolationResolveResponse>(`/admin/violations/${eventId}/resolve`);
    return res.data;
  },

  // AI Proctoring Settings & Audit Trail
  getAISettings: async (): Promise<AISettingsConfig> => {
    const res = await api.get<AISettingsConfig>('/admin/ai-settings');
    return res.data;
  },

  updateAISettings: async (payload: Partial<AISettingsConfig>): Promise<AISettingsConfig> => {
    const res = await api.put<AISettingsConfig>('/admin/ai-settings', payload);
    return res.data;
  },

  getAuditLogs: async (limit: number = 50): Promise<AuditLogItem[]> => {
    const res = await api.get<AuditLogItem[]>('/admin/audit-logs', { params: { limit } });
    return res.data;
  },

  createAuditLog: async (action: string, ip: string = '127.0.0.1'): Promise<AuditLogItem> => {
    const res = await api.post<AuditLogItem>('/admin/audit-logs', { action, ip });
    return res.data;
  }
};
