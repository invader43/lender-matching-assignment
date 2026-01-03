/**
 * PolicyRuleEditor - Edit individual policy rules
 */

import React from 'react';
import type { PolicyRule, ParameterDefinition, RuleOperator, RuleType } from '../types/models';

interface Props {
    rule: PolicyRule;
    parameters: ParameterDefinition[];
    onChange: (updatedRule: PolicyRule) => void;
    onDelete: (ruleId: string) => void;
}

const OPERATORS: { value: RuleOperator; label: string }[] = [
    { value: 'gt', label: '> Greater than' },
    { value: 'gte', label: '>= Greater or equal' },
    { value: 'lt', label: '< Less than' },
    { value: 'lte', label: '<= Less or equal' },
    { value: 'eq', label: '= Equal to' },
    { value: 'neq', label: '≠ Not equal' },
    { value: 'in', label: '∈ In list' },
    { value: 'contains', label: '⊃ Contains' },
];

const RULE_TYPES: { value: RuleType; label: string }[] = [
    { value: 'eligibility', label: 'Eligibility (knockout)' },
    { value: 'scoring', label: 'Scoring (points)' },
];

export const PolicyRuleEditor: React.FC<Props> = ({
    rule,
    parameters,
    onChange,
    onDelete,
}) => {
    const selectedParam = parameters.find(p => p.key_name === rule.parameter_key);

    const handleChange = (field: keyof PolicyRule, value: any) => {
        onChange({ ...rule, [field]: value });
    };

    const renderValueInput = () => {
        if (!selectedParam) {
            return (
                <input
                    type="text"
                    className="form-input"
                    value={JSON.stringify(rule.value_comparison) || ''}
                    onChange={(e) => handleChange('value_comparison', e.target.value)}
                    placeholder="Value"
                />
            );
        }

        switch (selectedParam.data_type) {
            case 'number':
            case 'currency':
                return (
                    <input
                        type="number"
                        className="form-input"
                        value={rule.value_comparison ?? ''}
                        onChange={(e) => handleChange('value_comparison', parseFloat(e.target.value) || 0)}
                        placeholder="Numeric value"
                    />
                );
            case 'boolean':
                return (
                    <select
                        className="form-select"
                        value={String(rule.value_comparison)}
                        onChange={(e) => handleChange('value_comparison', e.target.value === 'true')}
                    >
                        <option value="true">True</option>
                        <option value="false">False</option>
                    </select>
                );
            case 'select':
                return (
                    <select
                        className="form-select"
                        value={rule.value_comparison ?? ''}
                        onChange={(e) => handleChange('value_comparison', e.target.value)}
                    >
                        <option value="">Select value...</option>
                        {selectedParam.options?.values?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                );
            default:
                return (
                    <input
                        type="text"
                        className="form-input"
                        value={rule.value_comparison ?? ''}
                        onChange={(e) => handleChange('value_comparison', e.target.value)}
                        placeholder="Text value"
                    />
                );
        }
    };

    return (
        <div className="rule-editor">
            <div className="rule-editor-row">
                {/* Parameter selector */}
                <div className="rule-field">
                    <label className="rule-field-label">Parameter</label>
                    <select
                        className="form-select"
                        value={rule.parameter_key}
                        onChange={(e) => handleChange('parameter_key', e.target.value)}
                    >
                        <option value="">Select parameter...</option>
                        {parameters.map((param) => (
                            <option key={param.key_name} value={param.key_name}>
                                {param.display_label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Operator selector */}
                <div className="rule-field">
                    <label className="rule-field-label">Operator</label>
                    <select
                        className="form-select"
                        value={rule.operator}
                        onChange={(e) => handleChange('operator', e.target.value as RuleOperator)}
                    >
                        {OPERATORS.map((op) => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                    </select>
                </div>

                {/* Value input */}
                <div className="rule-field">
                    <label className="rule-field-label">Value</label>
                    {renderValueInput()}
                </div>

                {/* Rule type */}
                <div className="rule-field">
                    <label className="rule-field-label">Type</label>
                    <select
                        className="form-select"
                        value={rule.rule_type}
                        onChange={(e) => handleChange('rule_type', e.target.value as RuleType)}
                    >
                        {RULE_TYPES.map((rt) => (
                            <option key={rt.value} value={rt.value}>{rt.label}</option>
                        ))}
                    </select>
                </div>

                {/* Delete button */}
                <button
                    type="button"
                    className="rule-delete-btn"
                    onClick={() => onDelete(rule.id)}
                    aria-label="Delete rule"
                >
                    🗑️
                </button>
            </div>

            {/* Failure reason */}
            <div className="rule-field full-width">
                <label className="rule-field-label">Failure Reason</label>
                <input
                    type="text"
                    className="form-input"
                    value={rule.failure_reason ?? ''}
                    onChange={(e) => handleChange('failure_reason', e.target.value)}
                    placeholder="Message shown when rule fails (e.g., 'Credit score below minimum 650')"
                />
            </div>
        </div>
    );
};
