/**
 * DynamicFieldRenderer - Renders appropriate input based on parameter definition
 */

import React from 'react';
import type { ParameterDefinition } from '../types/models';

interface DynamicFieldRendererProps {
    parameter: ParameterDefinition;
    value: any;
    onChange: (value: any) => void;
    error?: string;
}

export const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
    parameter,
    value,
    onChange,
    error
}) => {
    const { key_name, display_label, data_type, options, description } = parameter;

    const renderInput = () => {
        switch (data_type) {
            case 'string':
                return (
                    <input
                        type="text"
                        id={key_name}
                        name={key_name}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="form-input"
                        placeholder={description}
                    />
                );

            case 'number':
            case 'currency':
                return (
                    <input
                        type="number"
                        id={key_name}
                        name={key_name}
                        value={value || ''}
                        onChange={(e) => onChange(parseFloat(e.target.value))}
                        className="form-input"
                        placeholder={description}
                        step={data_type === 'currency' ? '0.01' : 'any'}
                    />
                );

            case 'boolean':
                return (
                    <div className="checkbox-wrapper">
                        <input
                            type="checkbox"
                            id={key_name}
                            name={key_name}
                            checked={value || false}
                            onChange={(e) => onChange(e.target.checked)}
                            className="form-checkbox"
                        />
                        <label htmlFor={key_name} className="checkbox-label">
                            {description || 'Yes'}
                        </label>
                    </div>
                );

            case 'select':
                const selectOptions = options?.values || [];
                return (
                    <select
                        id={key_name}
                        name={key_name}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="form-select"
                    >
                        <option value="">-- Select --</option>
                        {selectOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                );

            default:
                return (
                    <input
                        type="text"
                        id={key_name}
                        name={key_name}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="form-input"
                    />
                );
        }
    };

    return (
        <div className="form-group">
            <label htmlFor={key_name} className="form-label">
                {display_label}
                {description && data_type !== 'boolean' && (
                    <span className="field-description">{description}</span>
                )}
            </label>
            {renderInput()}
            {error && <span className="error-message">{error}</span>}
        </div>
    );
};
