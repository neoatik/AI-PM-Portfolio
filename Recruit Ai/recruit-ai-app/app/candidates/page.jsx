'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

function getScoreClass(score) {
    if (score >= 70) return 'high';
    if (score >= 40) return 'mid';
    return 'low';
}

function getInitials(name) {
    return (name || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

export default function CandidatesPage() {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/candidates')
            .then(r => r.json())
            .then(d => { setCandidates(d.candidates || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const shortlisted = candidates.filter(c => c.status === 'shortlisted').length;
    const rejected = candidates.filter(c => c.status === 'rejected').length;
    const avgScore = candidates.length
        ? Math.round(candidates.reduce((s, c) => s + c.fit_score, 0) / candidates.length)
        : 0;

    return (
        <div className="app-shell">
            <Sidebar />
            <main className="main-content">
                <div className="page-wrapper">
                    {/* Header */}
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">All Candidates</h1>
                            <p className="page-subtitle">Across all jobs, sorted by AI Fit Score</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="stats-strip">
                        <div className="stat-card">
                            <div className="stat-label">Total Candidates</div>
                            <div className="stat-value purple">{candidates.length}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Shortlisted</div>
                            <div className="stat-value green">{shortlisted}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Rejected</div>
                            <div className="stat-value red">{rejected}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Avg. Fit Score</div>
                            <div className="stat-value">{avgScore}</div>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
                            <div className="spinner" style={{ margin: '0 auto 12px', width: 32, height: 32, borderWidth: 3, borderTopColor: 'var(--accent-primary)' }} />
                            Loading candidates...
                        </div>
                    ) : candidates.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">👥</div>
                            <div className="empty-state-title">No candidates yet</div>
                            <div className="empty-state-sub">
                                Create a job, upload resumes, and run an AI evaluation to see candidates here.
                            </div>
                            <Link href="/" className="btn btn-primary">Go to Dashboard</Link>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Candidate</th>
                                        <th>Job Role</th>
                                        <th>Status</th>
                                        <th>Fit Score</th>
                                        <th>Email</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {candidates.map((c, idx) => (
                                        <tr key={c.id}>
                                            <td style={{ color: 'var(--text-muted)', fontWeight: 600, width: '40px' }}>
                                                {idx + 1}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div
                                                        className="candidate-avatar"
                                                        style={{
                                                            width: 36, height: 36, fontSize: 13,
                                                            background: c.status === 'shortlisted'
                                                                ? 'linear-gradient(135deg, #10b981, #6366f1)'
                                                                : 'var(--surface)'
                                                        }}
                                                    >
                                                        {getInitials(c.name)}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                            {c.name}
                                                        </div>
                                                        {c.ai_summary && (
                                                            <div style={{
                                                                fontSize: '12px', color: 'var(--text-muted)',
                                                                maxWidth: '280px', whiteSpace: 'nowrap',
                                                                overflow: 'hidden', textOverflow: 'ellipsis'
                                                            }}>
                                                                {c.ai_summary}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <Link
                                                    href={`/jobs/${c.job_id}`}
                                                    style={{
                                                        fontSize: '13px', color: 'var(--accent-primary)',
                                                        fontWeight: 500, textDecoration: 'underline',
                                                        textDecorationColor: 'rgba(99,102,241,0.3)'
                                                    }}
                                                >
                                                    {c.job_role}
                                                </Link>
                                            </td>
                                            <td>
                                                <span className={`badge badge-${c.status}`}>
                                                    {c.status === 'shortlisted' ? '✓ Shortlisted' : '✕ Rejected'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span className={`score-value ${getScoreClass(c.fit_score)}`} style={{ fontSize: '18px' }}>
                                                        {Math.round(c.fit_score)}
                                                    </span>
                                                    <div className="score-bar" style={{ width: '60px' }}>
                                                        <div
                                                            className={`score-bar-fill ${getScoreClass(c.fit_score)}`}
                                                            style={{ width: `${c.fit_score}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                    {c.email_sent ? '✓ Sent' : '—'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
