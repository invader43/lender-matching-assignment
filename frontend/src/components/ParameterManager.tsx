/**
 * ParameterManager - Admin component for managing global parameters
 */

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { ParameterDefinition, DataType } from '../types/models';

interface Props {
    onClose?: () => void;
}

const DATA_TYPES: { value: DataType; label: string }[] = [
    { value: 'string', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Yes/No' },
    { value: 'select', label: 'Dropdown' },
    { value: 'currency', label: 'Currency' },
];

export const ParameterManager: React.FC<Props> = ({ onClose }) => {
    const [parameters, setParameters] = useState<ParameterDefinition[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<ParameterDefinition>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newParam, setNewParam] = useState({
        key_name: '',
        display_label: '',
        data_type: 'string' as DataType,
        description: '',
        options: { values: [] as string[] },
    });
    const [newOptionValue, setNewOptionValue] = useState('');

    useEffect(() => {
        loadParameters();
    }, [showInactive]);

    const loadParameters = async () => {
        try {
            setLoading(true);
            const data = await api.parameters.getAll(!showInactive);
            setParameters(data);
        } catch (err) {
            setError('Failed to load parameters');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const startEditing = (param: ParameterDefinition) => {
        setEditingId(param.id);
        setEditForm({
            display_label: param.display_label,
            description: param.description || '',
            data_type: param.data_type,
            options: param.options || { values: [] },
            is_active: param.is_active,
        });
        setError('');
        setSuccess('');
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleEditChange = (field: string, value: any) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const saveEdit = async (keyName: string) => {
        setSaving(true);
        setError('');
        try {
            await api.parameters.update(keyName, editForm);
            setSuccess('Parameter updated successfully!');
            await loadParameters();
            setEditingId(null);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update parameter');
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (param: ParameterDefinition) => {
        try {
            await api.parameters.update(param.key_name, { is_active: !param.is_active });
            await loadParameters();
            setSuccess(`Parameter ${param.is_active ? 'deactivated' : 'activated'}`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update parameter');
        }
    };

    const handleCreateParam = async () => {
        if (!newParam.key_name || !newParam.display_label) {
            setError('Key name and display label are required');
            return;
        }

        setSaving(true);
        setError('');
        try {
            await api.parameters.create({
                key_name: newParam.key_name,
                display_label: newParam.display_label,
                data_type: newParam.data_type,
                description: newParam.description || undefined,
                options: newParam.data_type === 'select' ? newParam.options : undefined,
            });
            setSuccess('Parameter created successfully!');
            setIsCreating(false);
            setNewParam({
                key_name: '',
                display_label: '',
                data_type: 'string',
                description: '',
                options: { values: [] },
            });
            await loadParameters();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create parameter');
        } finally {
            setSaving(false);
        }
    };

    const addOptionToNew = () => {
        if (newOptionValue.trim()) {
            setNewParam(prev => ({
                ...prev,
                options: { values: [...(prev.options?.values || []), newOptionValue.trim()] }
            }));
            setNewOptionValue('');
        }
    };

    const removeOptionFromNew = (index: number) => {
        setNewParam(prev => ({
            ...prev,
            options: { values: prev.options?.values?.filter((_, i) => i !== index) || [] }
        }));
    };

    const getTypeIcon = (type: DataType) => {
        switch (type) {
            case 'number': return '🔢';
            case 'currency': return '💰';
            case 'boolean': return '✓✗';
            case 'select': return '📋';
            default: return '📝';
        }
    };

    if (loading) {
        return <div className="param-manager-loading">Loading parameters...</div>;
    }

    return (
        <div className="param-manager">
            <div className="param-manager-header">
                <h3>📊 Parameter Registry</h3>
                <div className="param-manager-actions">
                    <label className="checkbox-inline">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={(e) => setShowInactive(e.target.checked)}
                        />
                        Show inactive
                    </label>
                    <button
                        className="button small"
                        onClick={() => setIsCreating(true)}
                        disabled={isCreating}
                    >
                        + Add Parameter
                    </button>
                    {onClose && (
                        <button className="button small secondary" onClick={onClose}>
                            Close
                        </button>
                    )}
                </div>
            </div>

            {error && <div className="param-status error">{error}</div>}
            {success && <div className="param-status success">{success}</div>}

            {/* Create new parameter form */}
            {isCreating && (
                <div className="param-create-form">
                    <h4>Create New Parameter</h4>
                    <div className="param-create-fields">
                        <div className="param-field">
                            <label>Key Name *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={newParam.key_name}
                                onChange={(e) => setNewParam(prev => ({ ...prev, key_name: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                                placeholder="e.g., annual_revenue"
                            />
                        </div>
                        <div className="param-field">
                            <label>Display Label *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={newParam.display_label}
                                onChange={(e) => setNewParam(prev => ({ ...prev, display_label: e.target.value }))}
                                placeholder="e.g., Annual Revenue"
                            />
                        </div>
                        <div className="param-field">
                            <label>Data Type</label>
                            <select
                                className="form-select"
                                value={newParam.data_type}
                                onChange={(e) => setNewParam(prev => ({ ...prev, data_type: e.target.value as DataType }))}
                            >
                                {DATA_TYPES.map(dt => (
                                    <option key={dt.value} value={dt.value}>{dt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="param-field full-width">
                            <label>Description</label>
                            <input
                                type="text"
                                className="form-input"
                                value={newParam.description}
                                onChange={(e) => setNewParam(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Help text for this field"
                            />
                        </div>
                        {newParam.data_type === 'select' && (
                            <div className="param-field full-width">
                                <label>Options</label>
                                <div className="options-editor">
                                    <div className="options-list">
                                        {newParam.options?.values?.map((opt, idx) => (
                                            <span key={idx} className="option-tag">
                                                {opt}
                                                <button type="button" onClick={() => removeOptionFromNew(idx)}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="options-add">
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={newOptionValue}
                                            onChange={(e) => setNewOptionValue(e.target.value)}
                                            placeholder="Add option..."
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOptionToNew())}
                                        />
                                        <button type="button" className="button small" onClick={addOptionToNew}>
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="param-create-actions">
                        <button
                            className="button small"
                            onClick={handleCreateParam}
                            disabled={saving}
                        >
                            {saving ? 'Creating...' : 'Create Parameter'}
                        </button>
                        <button
                            className="button small secondary"
                            onClick={() => setIsCreating(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Parameters list */}
            <div className="param-list">
                {parameters.length === 0 ? (
                    <p className="empty-state">No parameters found.</p>
                ) : (
                    parameters.map((param) => (
                        <div
                            key={param.id}
                            className={`param-item ${!param.is_active ? 'inactive' : ''} ${editingId === param.id ? 'editing' : ''}`}
                        >
                            {editingId === param.id ? (
                                // Edit mode
                                <div className="param-edit-form">
                                    <div className="param-edit-fields">
                                        <div className="param-field">
                                            <label>Display Label</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={editForm.display_label || ''}
                                                onChange={(e) => handleEditChange('display_label', e.target.value)}
                                            />
                                        </div>
                                        <div className="param-field">
                                            <label>Data Type</label>
                                            <select
                                                className="form-select"
                                                value={editForm.data_type || param.data_type}
                                                onChange={(e) => handleEditChange('data_type', e.target.value)}
                                            >
                                                {DATA_TYPES.map(dt => (
                                                    <option key={dt.value} value={dt.value}>{dt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="param-field full-width">
                                            <label>Description</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={editForm.description || ''}
                                                onChange={(e) => handleEditChange('description', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="param-edit-actions">
                                        <button
                                            className="button small"
                                            onClick={() => saveEdit(param.key_name)}
                                            disabled={saving}
                                        >
                                            {saving ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            className="button small secondary"
                                            onClick={cancelEditing}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // View mode
                                <>
                                    <div className="param-info">
                                        <div className="param-header">
                                            <span className="param-type-icon">{getTypeIcon(param.data_type)}</span>
                                            <span className="param-key">{param.key_name}</span>
                                            {!param.is_active && <span className="param-badge inactive">Inactive</span>}
                                        </div>
                                        <div className="param-label">{param.display_label}</div>
                                        {param.description && (
                                            <div className="param-desc">{param.description}</div>
                                        )}
                                        {param.data_type === 'select' && param.options?.values && (
                                            <div className="param-options">
                                                Options: {param.options.values.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                    <div className="param-actions">
                                        <button
                                            className="param-action-btn"
                                            onClick={() => startEditing(param)}
                                            title="Edit"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="param-action-btn"
                                            onClick={() => toggleActive(param)}
                                            title={param.is_active ? 'Deactivate' : 'Activate'}
                                        >
                                            {param.is_active ? '🚫' : '✅'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
