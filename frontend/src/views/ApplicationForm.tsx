/**
 * ApplicationForm - Dynamic loan application form
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DynamicFieldRenderer } from '../components/DynamicFieldRenderer';
import api from '../services/api';
import type { ParameterDefinition } from '../types/models';

export const ApplicationForm: React.FC = () => {
    const navigate = useNavigate();
    const [parameters, setParameters] = useState<ParameterDefinition[]>([]);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [applicantName, setApplicantName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadParameters();
    }, []);

    const loadParameters = async () => {
        try {
            const params = await api.parameters.getAll();
            setParameters(params);
        } catch (err) {
            setError('Failed to load form fields. Please try again.');
            console.error(err);
        }
    };

    const handleFieldChange = (key: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!applicantName.trim()) {
            setError('Please enter applicant name');
            setLoading(false);
            return;
        }

        try {
            const application = await api.applications.create({
                applicant_name: applicantName,
                form_data: formData
            });

            setSuccess(true);

            // Navigate to results page after 1 second
            setTimeout(() => {
                navigate(`/results/${application.id}`);
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to submit application. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="container">
                <div className="success-message">
                    <h2>✓ Application Submitted!</h2>
                    <p>Matching lenders... Redirecting to results...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <h1>Loan Application</h1>
            <p className="subtitle">Fill out the form below to find matching lenders</p>

            <form onSubmit={handleSubmit} className="application-form">
                <div className="form-group">
                    <label htmlFor="applicant_name" className="form-label">
                        Applicant Name *
                    </label>
                    <input
                        type="text"
                        id="applicant_name"
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        className="form-input"
                        required
                    />
                </div>

                <div className="form-divider"></div>

                {parameters.length === 0 ? (
                    <div className="loading">Loading form fields...</div>
                ) : (
                    parameters.map((param) => (
                        <DynamicFieldRenderer
                            key={param.id}
                            parameter={param}
                            value={formData[param.key_name]}
                            onChange={(value) => handleFieldChange(param.key_name, value)}
                        />
                    ))
                )}

                {error && (
                    <div className="error-banner">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || parameters.length === 0}
                    className="submit-button"
                >
                    {loading ? 'Submitting...' : 'Submit Application'}
                </button>
            </form>
        </div>
    );
};
