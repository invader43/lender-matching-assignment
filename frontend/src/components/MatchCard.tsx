/**
 * MatchCard - Displays high-level match result for a lender
 */

import React from 'react';
import type { MatchResult } from '../types/models';

interface MatchCardProps {
    match: MatchResult;
    onClick: () => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onClick }) => {
    const { lender_name, program_name, eligible, fit_score } = match;

    return (
        <div
            className={`match-card ${eligible ? 'eligible' : 'ineligible'}`}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}
        >
            <div className="match-card-header">
                <h3 className="lender-name">{lender_name}</h3>
                <span className={`status-badge ${eligible ? 'approved' : 'declined'}`}>
                    {eligible ? 'Approved' : 'Declined'}
                </span>
            </div>

            <p className="program-name">{program_name}</p>

            <div className="fit-score-container">
                <div className="fit-score-label">Fit Score</div>
                <div className="fit-score-circle">
                    <svg viewBox="0 0 100 100" className="progress-ring">
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke={eligible ? '#10b981' : '#ef4444'}
                            strokeWidth="8"
                            strokeDasharray={`${fit_score * 2.827} 282.7`}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                        />
                    </svg>
                    <div className="score-text">{fit_score}%</div>
                </div>
            </div>

            <div className="view-details">
                Click to view details →
            </div>
        </div>
    );
};
