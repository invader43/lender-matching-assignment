/**
 * MatchingResults - Detailed results for a specific application
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MatchCard } from '../components/MatchCard';
import { ReasoningList } from '../components/ReasoningList';
import api from '../services/api';
import type { LoanApplication, MatchResult } from '../types/models';

export const MatchingResults: React.FC = () => {
    const { applicationId } = useParams<{ applicationId: string }>();
    const navigate = useNavigate();

    const [application, setApplication] = useState<LoanApplication | null>(null);
    const [matches, setMatches] = useState<MatchResult[]>([]);
    const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (applicationId) {
            loadResults();
        }
    }, [applicationId]);

    const loadResults = async () => {
        if (!applicationId) return;

        try {
            setLoading(true);

            // Load application details
            const app = await api.applications.getById(applicationId);
            setApplication(app);

            // If still processing, poll for results
            if (app.status === 'processing') {
                setTimeout(loadResults, 2000); // Poll every 2 seconds
                return;
            }

            // Load match results
            const matchResults = await api.applications.getMatches(applicationId);
            setMatches(matchResults);

            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load results');
            setLoading(false);
            console.error(err);
        }
    };

    if (loading || application?.status === 'processing') {
        return (
            <div className="container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <h2>Matching Lenders...</h2>
                    <p>This may take a few seconds</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container">
                <div className="error-state">
                    <h2>Error Loading Results</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate('/')} className="button">
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    if (!application) {
        return (
            <div className="container">
                <div className="error-state">
                    <h2>Application Not Found</h2>
                    <button onClick={() => navigate('/')} className="button">
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    const eligibleMatches = matches.filter(m => m.eligible);
    const ineligibleMatches = matches.filter(m => !m.eligible);

    return (
        <div className="container">
            <div className="results-header">
                <h1>Matching Results</h1>
                <div className="applicant-info">
                    <h2>{application.applicant_name}</h2>
                    <p className="submitted-date">
                        Submitted: {new Date(application.created_at).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <div className="results-summary">
                <div className="summary-card">
                    <div className="summary-number">{eligibleMatches.length}</div>
                    <div className="summary-label">Approved Lenders</div>
                </div>
                <div className="summary-card">
                    <div className="summary-number">{matches.length}</div>
                    <div className="summary-label">Total Evaluated</div>
                </div>
            </div>

            <div className="results-layout">
                <div className="matches-column">
                    {eligibleMatches.length > 0 && (
                        <div className="matches-section">
                            <h3 className="section-title approved">✓ Approved Lenders</h3>
                            <div className="matches-grid">
                                {eligibleMatches.map((match) => (
                                    <MatchCard
                                        key={match.id}
                                        match={match}
                                        onClick={() => setSelectedMatch(match)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {ineligibleMatches.length > 0 && (
                        <div className="matches-section">
                            <h3 className="section-title declined">✗ Declined Lenders</h3>
                            <div className="matches-grid">
                                {ineligibleMatches.map((match) => (
                                    <MatchCard
                                        key={match.id}
                                        match={match}
                                        onClick={() => setSelectedMatch(match)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {matches.length === 0 && (
                        <div className="no-matches">
                            <p>No lenders evaluated yet. Please check back later.</p>
                        </div>
                    )}
                </div>

                {selectedMatch && (
                    <div className="details-panel">
                        <div className="panel-header">
                            <h3>{selectedMatch.lender_name}</h3>
                            <button
                                onClick={() => setSelectedMatch(null)}
                                className="close-button"
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="panel-content">
                            <h4>{selectedMatch.program_name}</h4>
                            <div className={`status-large ${selectedMatch.eligible ? 'approved' : 'declined'}`}>
                                {selectedMatch.eligible ? 'Approved' : 'Declined'}
                            </div>
                            <div className="fit-score-large">
                                Fit Score: {selectedMatch.fit_score}%
                            </div>
                            <ReasoningList evaluations={selectedMatch.evaluations} />
                        </div>
                    </div>
                )}
            </div>

            <div className="actions">
                <button onClick={() => navigate('/')} className="button secondary">
                    Submit Another Application
                </button>
            </div>
        </div>
    );
};
