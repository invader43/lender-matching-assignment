/**
 * Main App Component with Routing
 */

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ApplicationForm } from './views/ApplicationForm';
import { MatchingResults } from './views/MatchingResults';
import { LenderPolicyManager } from './views/LenderPolicyManager';
import './App.css';

function App() {
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => setMenuOpen(!menuOpen);
    const closeMenu = () => setMenuOpen(false);

    return (
        <BrowserRouter>
            <div className="app">
                <nav className="navbar">
                    <div className="nav-container">
                        <Link to="/" className="nav-logo" onClick={closeMenu}>
                            🏦 Lender Matching
                        </Link>

                        {/* Hamburger button for mobile */}
                        <button
                            className={`hamburger-btn ${menuOpen ? 'open' : ''}`}
                            onClick={toggleMenu}
                            aria-label="Toggle navigation menu"
                        >
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>

                        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
                            <Link to="/" className="nav-link" onClick={closeMenu}>New Application</Link>
                            <Link to="/admin" className="nav-link" onClick={closeMenu}>Admin</Link>
                        </div>
                    </div>
                </nav>

                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<ApplicationForm />} />
                        <Route path="/results/:applicationId" element={<MatchingResults />} />
                        <Route path="/admin" element={<LenderPolicyManager />} />
                    </Routes>
                </main>

                <footer className="footer">
                    <p>Dynamic Lender Matching System - Powered by AI</p>
                </footer>
            </div>
        </BrowserRouter>
    );
}

export default App;
