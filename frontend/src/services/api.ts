/**
 * API Service - Centralized API client for backend communication
 */

import axios from 'axios';
import type {
    ParameterDefinition,
    CreateParameterRequest,
    Lender,
    CreateLenderRequest,
    LenderPolicy,
    PolicyRule,
    LoanApplication,
    CreateApplicationRequest,
    MatchResult,
    IngestionTaskResponse
} from '../types/models';

// Get API URL from environment or default to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Parameter Registry API
export const parametersApi = {
    /**
     * Get all parameter definitions
     */
    getAll: async (activeOnly: boolean = true): Promise<ParameterDefinition[]> => {
        const response = await apiClient.get('/parameters', {
            params: { active_only: activeOnly }
        });
        return response.data;
    },

    /**
     * Get a specific parameter by key name
     */
    getByKey: async (keyName: string): Promise<ParameterDefinition> => {
        const response = await apiClient.get(`/parameters/${keyName}`);
        return response.data;
    },

    /**
     * Create a new parameter
     */
    create: async (data: CreateParameterRequest): Promise<ParameterDefinition> => {
        const response = await apiClient.post('/parameters', data);
        return response.data;
    },

    /**
     * Update an existing parameter
     */
    update: async (keyName: string, data: Partial<Omit<ParameterDefinition, 'id' | 'key_name'>>): Promise<ParameterDefinition> => {
        const response = await apiClient.put(`/parameters/${keyName}`, data);
        return response.data;
    },

    /**
     * Delete or deactivate a parameter
     */
    delete: async (keyName: string, hardDelete: boolean = false): Promise<void> => {
        await apiClient.delete(`/parameters/${keyName}`, {
            params: { hard_delete: hardDelete }
        });
    },
};

// Lenders API
export const lendersApi = {
    /**
     * Get all lenders
     */
    getAll: async (): Promise<Lender[]> => {
        const response = await apiClient.get('/lenders');
        return response.data;
    },

    /**
     * Get a specific lender
     */
    getById: async (id: string): Promise<Lender> => {
        const response = await apiClient.get(`/lenders/${id}`);
        return response.data;
    },

    /**
     * Create a new lender
     */
    create: async (data: CreateLenderRequest): Promise<Lender> => {
        const response = await apiClient.post('/lenders', data);
        return response.data;
    },

    /**
     * Upload PDF for a lender
     */
    uploadPDF: async (lenderId: string, file: File): Promise<IngestionTaskResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post(
            `/lenders/${lenderId}/ingest-guidelines`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    /**
     * Get all policies for a lender
     */
    getPolicies: async (lenderId: string): Promise<LenderPolicy[]> => {
        const response = await apiClient.get(`/lenders/${lenderId}/policies`);
        return response.data;
    },
};

// Policies API
export const policiesApi = {
    /**
     * Get all policies, optionally filtered by lender
     */
    getAll: async (lenderId?: string): Promise<LenderPolicy[]> => {
        const response = await apiClient.get('/policies', {
            params: lenderId ? { lender_id: lenderId } : undefined
        });
        return response.data;
    },

    /**
     * Get a specific policy
     */
    getById: async (id: string): Promise<LenderPolicy> => {
        const response = await apiClient.get(`/policies/${id}`);
        return response.data;
    },

    /**
     * Update policy metadata (name, min_fit_score)
     */
    update: async (policyId: string, data: { name?: string; min_fit_score?: number }): Promise<LenderPolicy> => {
        const response = await apiClient.patch(`/policies/${policyId}`, null, {
            params: data
        });
        return response.data;
    },

    /**
     * Update all rules for a policy (replace)
     */
    updateRules: async (policyId: string, rules: Omit<PolicyRule, 'id' | 'policy_id'>[]): Promise<PolicyRule[]> => {
        const response = await apiClient.put(`/policies/${policyId}/rules`, rules);
        return response.data;
    },

    /**
     * Add a single rule to a policy
     */
    addRule: async (policyId: string, rule: Omit<PolicyRule, 'id' | 'policy_id'>): Promise<PolicyRule> => {
        const response = await apiClient.post(`/policies/${policyId}/rules`, rule);
        return response.data;
    },

    /**
     * Delete a single rule from a policy
     */
    deleteRule: async (policyId: string, ruleId: string): Promise<void> => {
        await apiClient.delete(`/policies/${policyId}/rules/${ruleId}`);
    },

    /**
     * Delete a policy
     */
    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/policies/${id}`);
    },
};

// Applications API
export const applicationsApi = {
    /**
     * Get all applications
     */
    getAll: async (): Promise<LoanApplication[]> => {
        const response = await apiClient.get('/applications');
        return response.data;
    },

    /**
     * Get a specific application
     */
    getById: async (id: string): Promise<LoanApplication> => {
        const response = await apiClient.get(`/applications/${id}`);
        return response.data;
    },

    /**
     * Submit a new loan application
     */
    create: async (data: CreateApplicationRequest): Promise<LoanApplication> => {
        const response = await apiClient.post('/applications', data);
        return response.data;
    },

    /**
     * Get match results for an application
     */
    getMatches: async (applicationId: string): Promise<MatchResult[]> => {
        const response = await apiClient.get(`/applications/${applicationId}/matches`);
        return response.data;
    },
};

// Export a combined API object
export const api = {
    parameters: parametersApi,
    lenders: lendersApi,
    policies: policiesApi,
    applications: applicationsApi,
};

export default api;
