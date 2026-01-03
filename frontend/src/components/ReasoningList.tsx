/**
 * ReasoningList - Shows detailed rule-by-rule evaluation breakdown
 */

import React from 'react';
import type { RuleEvaluationResult } from '../types/models';

interface ReasoningListProps {
    evaluations: RuleEvaluationResult[];
}

export const ReasoningList: React.FC<ReasoningListProps> = ({ evaluations }) => {
    const passedRules = evaluations.filter(e => e.passed);
    const failedRules = evaluations.filter(e => !e.passed);

    const formatValue = (value: any): string => {
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (typeof value === 'number') return value.toLocaleString();
        if (Array.isArray(value)) return value.join(', ');
        return String(value);
    };

    const getOperatorSymbol = (operator: string): string => {
        const symbols: Record<string, string> = {
            'gt': '>',
            'lt': '<',
            'gte': '≥',
            'lte': '≤',
            'eq': '=',
            'neq': '≠',
            'in': 'in',
            'contains': 'contains'
        };
        return symbols[operator] || operator;
    };

    return (
        <div className="reasoning-list">
            {passedRules.length > 0 && (
                <div className="criteria-section passed">
                    <h4 className="section-title">
                        <span className="icon">✓</span>
                        Criteria Met ({passedRules.length})
                    </h4>
                    <ul className="criteria-list">
                        {passedRules.map((evaluation) => (
                            <li key={evaluation.rule_id} className="criteria-item">
                                <span className="check-icon">✓</span>
                                <div className="criteria-details">
                                    <strong>{evaluation.parameter_label}:</strong>{' '}
                                    {formatValue(evaluation.actual_value)}{' '}
                                    {getOperatorSymbol(evaluation.operator)}{' '}
                                    {formatValue(evaluation.threshold_value)}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {failedRules.length > 0 && (
                <div className="criteria-section failed">
                    <h4 className="section-title">
                        <span className="icon">✗</span>
                        Criteria Failed ({failedRules.length})
                    </h4>
                    <ul className="criteria-list">
                        {failedRules.map((evaluation) => (
                            <li key={evaluation.rule_id} className="criteria-item">
                                <span className="x-icon">✗</span>
                                <div className="criteria-details">
                                    <strong>{evaluation.parameter_label}:</strong>{' '}
                                    {evaluation.failure_reason || (
                                        <>
                                            {formatValue(evaluation.actual_value)}{' '}
                                            {getOperatorSymbol(evaluation.operator)}{' '}
                                            {formatValue(evaluation.threshold_value)}
                                        </>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {evaluations.length === 0 && (
                <div className="no-evaluations">
                    No evaluation criteria available
                </div>
            )}
        </div>
    );
};
