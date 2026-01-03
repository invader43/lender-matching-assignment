/**
 * LenderPolicyManager - Admin view for PDF upload and rule management
 */

import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { PolicyRuleEditor } from '../components/PolicyRuleEditor';
import { RuleBuilder } from '../components/RuleBuilder';
import { ParameterManager } from '../components/ParameterManager';
import type { Lender, LenderPolicy, PolicyRule, ParameterDefinition } from '../types/models';

export const LenderPolicyManager: React.FC = () => {
    const [lenders, setLenders] = useState<Lender[]>([]);
    const [selectedLender, setSelectedLender] = useState<Lender | null>(null);
    const [policies, setPolicies] = useState<LenderPolicy[]>([]);
    const [parameters, setParameters] = useState<ParameterDefinition[]>([]);
    const [newLenderName, setNewLenderName] = useState('');
    const [newLenderDesc, setNewLenderDesc] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string>('');
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Editing state
    const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
    const [editedRules, setEditedRules] = useState<PolicyRule[]>([]);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Parameter manager visibility
    const [showParamManager, setShowParamManager] = useState(false);

    useEffect(() => {
        loadLenders();
        loadParameters();
    }, []);

    useEffect(() => {
        if (selectedLender) {
            loadPolicies(selectedLender.id);
        }
    }, [selectedLender]);

    const loadLenders = async () => {
        try {
            const data = await api.lenders.getAll();
            setLenders(data);
        } catch (err) {
            console.error('Failed to load lenders:', err);
        }
    };

    const loadParameters = async () => {
        try {
            const data = await api.parameters.getAll(false); // Get all parameters
            setParameters(data);
        } catch (err) {
            console.error('Failed to load parameters:', err);
        }
    };

    const loadPolicies = async (lenderId: string) => {
        try {
            const data = await api.lenders.getPolicies(lenderId);
            setPolicies(data);
        } catch (err) {
            console.error('Failed to load policies:', err);
        }
    };

    const handleCreateLender = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLenderName.trim()) return;

        try {
            const lender = await api.lenders.create({
                name: newLenderName,
                description: newLenderDesc
            });
            setLenders([...lenders, lender]);
            setNewLenderName('');
            setNewLenderDesc('');
            setSelectedLender(lender);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create lender');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedLender) return;

        if (!file.name.endsWith('.pdf')) {
            setError('Only PDF files are supported');
            return;
        }

        setUploading(true);
        setUploadStatus('Uploading PDF...');
        setError('');

        try {
            const result = await api.lenders.uploadPDF(selectedLender.id, file);
            setUploadStatus(`✓ ${result.message}`);

            // Refresh policies after a delay
            setTimeout(() => {
                loadPolicies(selectedLender.id);
                setUploadStatus('');
            }, 5000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to upload PDF');
            setUploadStatus('');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Editing handlers
    const startEditing = (policy: LenderPolicy) => {
        setEditingPolicyId(policy.id);
        setEditedRules([...policy.rules]);
        setSaveStatus(null);
    };

    const cancelEditing = () => {
        setEditingPolicyId(null);
        setEditedRules([]);
        setSaveStatus(null);
    };

    const handleRuleChange = (updatedRule: PolicyRule) => {
        setEditedRules(prev =>
            prev.map(r => r.id === updatedRule.id ? updatedRule : r)
        );
    };

    const handleRuleDelete = (ruleId: string) => {
        setEditedRules(prev => prev.filter(r => r.id !== ruleId));
    };

    const handleAddRule = (newRule: Omit<PolicyRule, 'id' | 'policy_id'>) => {
        // Generate a temporary ID for UI purposes
        const tempRule: PolicyRule = {
            ...newRule,
            id: `temp-${Date.now()}`,
            policy_id: editingPolicyId!,
        };
        setEditedRules(prev => [...prev, tempRule]);
    };

    const saveRules = async () => {
        if (!editingPolicyId) return;

        setSaving(true);
        setSaveStatus(null);

        try {
            // Map rules to the format expected by the API (without id and policy_id)
            const rulesToSave = editedRules.map(({ id, policy_id, ...rule }) => rule);
            await api.policies.updateRules(editingPolicyId, rulesToSave);

            setSaveStatus({ type: 'success', message: 'Rules saved successfully!' });

            // Refresh policies
            if (selectedLender) {
                await loadPolicies(selectedLender.id);
            }

            // Exit edit mode after a delay
            setTimeout(() => {
                setEditingPolicyId(null);
                setEditedRules([]);
                setSaveStatus(null);
            }, 1500);
        } catch (err: any) {
            setSaveStatus({
                type: 'error',
                message: err.response?.data?.detail || 'Failed to save rules'
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container-fluid">
            <h1>Lender Policy Manager</h1>
            <p className="subtitle">Upload lender guidelines PDFs and manage extracted rules</p>

            {/* Parameter Manager Toggle */}
            <div className="manager-toggle-section">
                <button
                    className={`button small ${showParamManager ? 'secondary' : ''}`}
                    onClick={() => setShowParamManager(!showParamManager)}
                >
                    {showParamManager ? '✕ Close Parameters' : '📊 Manage Parameters'}
                </button>
            </div>

            {/* Parameter Manager */}
            {showParamManager && (
                <ParameterManager onClose={() => setShowParamManager(false)} />
            )}

            <div className="admin-layout">
                {/* Lender List */}
                <div className="lenders-panel">
                    <h3>Lenders</h3>

                    <form onSubmit={handleCreateLender} className="create-lender-form">
                        <input
                            type="text"
                            placeholder="Lender name"
                            value={newLenderName}
                            onChange={(e) => setNewLenderName(e.target.value)}
                            className="form-input"
                        />
                        <input
                            type="text"
                            placeholder="Description (optional)"
                            value={newLenderDesc}
                            onChange={(e) => setNewLenderDesc(e.target.value)}
                            className="form-input"
                        />
                        <button type="submit" className="button small">
                            + Add Lender
                        </button>
                    </form>

                    <div className="lenders-list">
                        {lenders.map((lender) => (
                            <div
                                key={lender.id}
                                className={`lender-item ${selectedLender?.id === lender.id ? 'selected' : ''}`}
                                onClick={() => setSelectedLender(lender)}
                            >
                                <strong>{lender.name}</strong>
                                {lender.description && <p>{lender.description}</p>}
                            </div>
                        ))}
                        {lenders.length === 0 && (
                            <p className="empty-state">No lenders yet. Create one above.</p>
                        )}
                    </div>
                </div>

                {/* Policy Manager */}
                <div className="policies-panel">
                    {selectedLender ? (
                        <>
                            <h3>{selectedLender.name} - Policies</h3>

                            {/* PDF Upload */}
                            <div className="upload-section">
                                <h4>Upload Guidelines PDF</h4>
                                <p>Upload a lender's underwriting guidelines PDF. Our AI will extract the rules automatically.</p>

                                <div className="upload-area">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                        id="pdf-upload"
                                    />
                                    <label htmlFor="pdf-upload" className={`upload-label ${uploading ? 'disabled' : ''}`}>
                                        {uploading ? '⏳ Processing...' : '📄 Select PDF to Upload'}
                                    </label>
                                </div>

                                {uploadStatus && (
                                    <div className="upload-status success">{uploadStatus}</div>
                                )}
                                {error && (
                                    <div className="upload-status error">{error}</div>
                                )}
                            </div>

                            {/* Policies List */}
                            <div className="policies-list">
                                <h4>Extracted Policies ({policies.length})</h4>
                                {policies.map((policy) => (
                                    <div key={policy.id} className="policy-card">
                                        <div className="policy-header">
                                            <strong>{policy.name}</strong>
                                            <div className="policy-header-actions">
                                                <span className="rule-count">{policy.rules.length} rules</span>
                                                {editingPolicyId !== policy.id && (
                                                    <button
                                                        className="button small edit-btn"
                                                        onClick={() => startEditing(policy)}
                                                    >
                                                        ✏️ Edit Rules
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {editingPolicyId === policy.id ? (
                                            // Edit mode
                                            <div className="policy-edit-mode">
                                                <div className="rules-editor">
                                                    {editedRules.length === 0 ? (
                                                        <p className="empty-state">No rules. Add one below.</p>
                                                    ) : (
                                                        editedRules.map((rule) => (
                                                            <PolicyRuleEditor
                                                                key={rule.id}
                                                                rule={rule}
                                                                parameters={parameters}
                                                                onChange={handleRuleChange}
                                                                onDelete={handleRuleDelete}
                                                            />
                                                        ))
                                                    )}
                                                </div>

                                                <RuleBuilder
                                                    parameters={parameters}
                                                    onAdd={handleAddRule}
                                                />

                                                {saveStatus && (
                                                    <div className={`save-status ${saveStatus.type}`}>
                                                        {saveStatus.message}
                                                    </div>
                                                )}

                                                <div className="edit-actions">
                                                    <button
                                                        className="button small"
                                                        onClick={saveRules}
                                                        disabled={saving}
                                                    >
                                                        {saving ? 'Saving...' : '💾 Save Changes'}
                                                    </button>
                                                    <button
                                                        className="button small secondary"
                                                        onClick={cancelEditing}
                                                        disabled={saving}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            // View mode
                                            <div className="rules-preview">
                                                {policy.rules.slice(0, 3).map((rule) => (
                                                    <div key={rule.id} className="rule-item">
                                                        <span className="rule-param">{rule.parameter_key}</span>
                                                        <span className="rule-op">{rule.operator}</span>
                                                        <span className="rule-value">{JSON.stringify(rule.value_comparison)}</span>
                                                    </div>
                                                ))}
                                                {policy.rules.length > 3 && (
                                                    <p className="more-rules">...and {policy.rules.length - 3} more rules</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {policies.length === 0 && (
                                    <p className="empty-state">No policies yet. Upload a PDF to extract rules.</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="select-lender-prompt">
                            <h3>👈 Select a Lender</h3>
                            <p>Choose a lender from the list to manage their policies and upload guidelines.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
