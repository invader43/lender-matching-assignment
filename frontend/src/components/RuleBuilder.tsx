/**
 * RuleBuilder - Add new policy rules
 */

import React, { useState } from 'react';
import type { PolicyRule, ParameterDefinition, RuleOperator, RuleType } from '../types/models';

interface Props {
    parameters: ParameterDefinition[];
    onAdd: (rule: Omit<PolicyRule, 'id' | 'policy_id'>) => void;
}

const DEFAULT_RULE: Omit<PolicyRule, 'id' | 'policy_id'> = {
    parameter_key: '',
    operator: 'gte' as RuleOperator,
    value_comparison: '',
    rule_type: 'eligibility' as RuleType,
    weight: 0,
    failure_reason: '',
};

const OPERATORS: { value: RuleOperator; label: string }[] = [
    { value: 'gt', label: '>' },
    { value: 'gte', label: '>=' },
    { value: 'lt', label: '<' },
    { value: 'lte', label: '<=' },
    { value: 'eq', label: '=' },
    { value: 'neq', label: '≠' },
    { value: 'in', label: 'in' },
    { value: 'contains', label: 'contains' },
];

export const RuleBuilder: React.FC<Props> = ({ parameters, onAdd }) => {
    const [newRule, setNewRule] = useState(DEFAULT_RULE);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleChange = (field: string, value: any) => {
        setNewRule(prev => ({ ...prev, [field]: value }));
    };

    const handleAdd = () => {
        if (!newRule.parameter_key) {
            return; // Don't add invalid rules
        }
        onAdd(newRule);
        setNewRule(DEFAULT_RULE);
        setIsExpanded(false);
    };

    const selectedParam = parameters.find(p => p.key_name === newRule.parameter_key);

    const renderValueInput = () => {
        if (!selectedParam) {
            return <input type="text" className="form-input" placeholder="Select parameter first" disabled />;
        }

        switch (selectedParam.data_type) {
            case 'number':
            case 'currency':
                return (
                    <input
                        type="number"
                        className="form-input"
                        value={newRule.value_comparison ?? ''}
                        onChange={(e) => handleChange('value_comparison', parseFloat(e.target.value) || 0)}
                        placeholder="Value"
                    />
                );
            case 'boolean':
                return (
                    <select
                        className="form-select"
                        value={String(newRule.value_comparison)}
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
                        value={newRule.value_comparison ?? ''}
                        onChange={(e) => handleChange('value_comparison', e.target.value)}
                    >
                        <option value="">Select...</option>
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
                        value={newRule.value_comparison ?? ''}
                        onChange={(e) => handleChange('value_comparison', e.target.value)}
                        placeholder="Value"
                    />
                );
        }
    };

    if (!isExpanded) {
        return (
            <button
                type="button"
                className="add-rule-btn"
                onClick={() => setIsExpanded(true)}
            >
                + Add New Rule
            </button>
        );
    }

    return (
        <div className="rule-builder">
            <div className="rule-builder-header">
                <h5>Add New Rule</h5>
                <button
                    type="button"
                    className="close-button"
                    onClick={() => setIsExpanded(false)}
                >
                    ✕
                </button>
            </div>

            <div className="rule-builder-fields">
                <div className="rule-field">
                    <label className="rule-field-label">Parameter</label>
                    <select
                        className="form-select"
                        value={newRule.parameter_key}
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

                <div className="rule-field">
                    <label className="rule-field-label">Operator</label>
                    <select
                        className="form-select"
                        value={newRule.operator}
                        onChange={(e) => handleChange('operator', e.target.value)}
                    >
                        {OPERATORS.map((op) => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                    </select>
                </div>

                <div className="rule-field">
                    <label className="rule-field-label">Value</label>
                    {renderValueInput()}
                </div>

                <div className="rule-field">
                    <label className="rule-field-label">Type</label>
                    <select
                        className="form-select"
                        value={newRule.rule_type}
                        onChange={(e) => handleChange('rule_type', e.target.value)}
                    >
                        <option value="eligibility">Eligibility</option>
                        <option value="scoring">Scoring</option>
                    </select>
                </div>
            </div>

            <div className="rule-field full-width">
                <label className="rule-field-label">Failure Reason</label>
                <input
                    type="text"
                    className="form-input"
                    value={newRule.failure_reason ?? ''}
                    onChange={(e) => handleChange('failure_reason', e.target.value)}
                    placeholder="Message when rule fails"
                />
            </div>

            <div className="rule-builder-actions">
                <button
                    type="button"
                    className="button small"
                    onClick={handleAdd}
                    disabled={!newRule.parameter_key}
                >
                    Add Rule
                </button>
                <button
                    type="button"
                    className="button small secondary"
                    onClick={() => setIsExpanded(false)}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};
