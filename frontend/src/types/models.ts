/**
 * TypeScript type definitions for the Dynamic Lender Matching System
 */

// Parameter Registry Types
export type DataType = 'string' | 'number' | 'boolean' | 'select' | 'currency';

export interface ParameterDefinition {
    id: string;
    key_name: string;
    display_label: string;
    data_type: DataType;
    options?: { values: string[] };
    description?: string;
    is_active: boolean;
}

// Lender & Policy Types
export type RuleOperator = 'gt' | 'lt' | 'eq' | 'neq' | 'gte' | 'lte' | 'in' | 'contains';
export type RuleType = 'eligibility' | 'scoring';

export interface PolicyRule {
    id: string;
    policy_id: string;
    parameter_key: string;
    operator: RuleOperator;
    value_comparison: any;
    rule_type: RuleType;
    weight: number;
    failure_reason?: string;
}

export interface LenderPolicy {
    id: string;
    lender_id: string;
    name: string;
    min_fit_score: number;
    created_at: string;
    last_updated: string;
    rules: PolicyRule[];
}

export interface Lender {
    id: string;
    name: string;
    description?: string;
    created_at: string;
}

// Loan Application Types
export type ApplicationStatus = 'processing' | 'completed' | 'failed';

export interface LoanApplication {
    id: string;
    applicant_name: string;
    form_data: Record<string, string | number | boolean>;
    status: ApplicationStatus;
    created_at: string;
}

// Match Result Types
export interface RuleEvaluationResult {
    rule_id: string;
    parameter_key: string;
    parameter_label: string;
    operator: RuleOperator;
    passed: boolean;
    actual_value: any;
    threshold_value: any;
    failure_reason?: string;
}

export interface MatchResult {
    id: string;
    application_id: string;
    policy_id: string;
    lender_name: string;
    program_name: string;
    eligible: boolean;
    fit_score: number;
    evaluations: RuleEvaluationResult[];
    created_at: string;
}

// API Request/Response Types
export interface CreateParameterRequest {
    key_name: string;
    display_label: string;
    data_type: DataType;
    options?: { values: string[] };
    description?: string;
    is_active?: boolean;
}

export interface CreateLenderRequest {
    name: string;
    description?: string;
}

export interface CreateApplicationRequest {
    applicant_name: string;
    form_data: Record<string, any>;
}

export interface IngestionTaskResponse {
    task_id: string;
    status: string;
    message: string;
}
