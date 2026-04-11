'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

const STAGES = ['Parsing', 'Matching', 'Scoring'];
const STAGE_ICONS = ['📄', '🔗', '🏆'];

function getScoreClass(score) {
    if (score >= 70) return 'high';
    if (score >= 40) return 'mid';
    return 'low';
}

function getInitials(name) {
    return (name || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}


export default function JobDetailPage() {
    const { id } = useParams();
    const [job, setJob] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [evaluating, setEvaluating] = useState(false);
    const [evalStage, setEvalStage] = useState(-1);
    const [evalProgress, setEvalProgress] = useState(0);
    const [evalDone, setEvalDone] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [rejectedOpen, setRejectedOpen] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState('');
    const [error, setError] = useState('');
    const [totalToEvaluate, setTotalToEvaluate] = useState(0);
    const [processedCount, setProcessedCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const fileInputRef = useRef(null);
    const pollingRef = useRef(null);

    const fetchJobData = useCallback(async () => {
        try {
            const res = await fetch(`/api/jobs/${id}`);
            const d = await res.json();
            setJob(d.job);
            setCandidates(d.candidates || []);
            setPendingCount(d.pending_count || 0);
            return d;
        } catch {
            return null;
        }
    }, [id]);

    useEffect(() => {
        fetchJobData().then(d => {
            setLoading(false);
            if (d?.job?.status === 'evaluated') setEvalDone(true);
        });
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [fetchJobData]);

    function handleFileDrop(e) {
        e.preventDefault();
        setDragOver(false);
        const dropped = Array.from(e.dataTransfer.files).filter(f =>
            f.name.endsWith('.pdf') || f.name.endsWith('.docx')
        );
        if (dropped.length > 0) uploadFiles(dropped);
    }

    function handleFileSelect(e) {
        const selected = Array.from(e.target.files).filter(f =>
            f.name.endsWith('.pdf') || f.name.endsWith('.docx')
        );
        if (selected.length > 0) uploadFiles(selected);
        // Reset input so the same file can be re-selected
        e.target.value = '';
    }

    async function uploadFiles(filesToUpload) {
        setUploading(true);
        setError('');
        try {
            const formData = new FormData();
            filesToUpload.forEach(f => formData.append('resumes', f));
            const res = await fetch(`/api/jobs/${id}/upload`, { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setUploadSuccess(`${filesToUpload.length} resume${filesToUpload.length > 1 ? 's' : ''} uploaded to cloud storage!`);
            await fetchJobData(); // refresh pending count
            setTimeout(() => setUploadSuccess(''), 4000);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    }

    async function handleStartEvaluation() {
        setEvaluating(true);
        setEvalStage(0);
        setEvalProgress(2);
        setError('');
        setProcessedCount(0);

        try {
            // Trigger the n8n evaluation pipeline
            const res = await fetch(`/api/jobs/${id}/evaluate`, { method: 'POST' });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            const total = data.total || 1;
            setTotalToEvaluate(total);

            // Start polling for results every 4 seconds
            pollingRef.current = setInterval(async () => {
                const d = await fetchJobData();
                if (!d) return;

                const analyzed = (d.candidates || []).length;
                const pending = d.pending_count || 0;
                const done = pending === 0 && analyzed > 0;

                setProcessedCount(analyzed);

                // Update progress based on how many candidates are processed
                const pct = Math.min(Math.round((analyzed / total) * 95), 95);
                setEvalProgress(prev => Math.max(prev, pct));

                // Update stage based on progress
                if (pct < 33) setEvalStage(0);
                else if (pct < 66) setEvalStage(1);
                else setEvalStage(2);

                if (done) {
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                    setEvalProgress(100);
                    setEvalStage(3);
                    setEvalDone(true);
                }
            }, 4000);
        } catch (err) {
            setError(err.message);
            setEvaluating(false);
            setEvalStage(-1);
            setEvalProgress(0);
        }
    }

    if (loading) return (
        <div className="app-shell">
            <Sidebar />
            <main className="main-content">
                <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div className="spinner" style={{ margin: '0 auto 12px', width: 32, height: 32, borderWidth: 3 }} />
                        <div>Loading job...</div>
                    </div>
                </div>
            </main>
        </div>
    );

    const shortlisted = candidates.filter(c => c.status === 'shortlisted');
    const rejected = candidates.filter(c => c.status === 'rejected');

    return (
        <div className="app-shell">
            <Sidebar />
            <main className="main-content">
                <div className="page-wrapper">
                    <Link href="/" className="back-link">← Back to Dashboard</Link>

                    {/* Job Header */}
                    <div className="page-header">
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                                <h1 className="page-title">{job?.role}</h1>
                                <span className={`badge badge-${job?.status}`}>
                                    {job?.status === 'evaluated' ? '✓ Evaluated' : '● Active'}
                                </span>
                            </div>
                            <p className="page-subtitle" style={{ maxWidth: '600px' }}>
                                {job?.description?.substring(0, 120)}...
                            </p>
                        </div>
                    </div>

                    {/* Evaluation in progress */}
                    {evaluating && !evalDone && (
                        <div className="progress-section" style={{ marginBottom: '32px' }}>
                            <div className="progress-icon">🤖</div>
                            <div>
                                <div className="progress-title">AI Evaluation In Progress</div>
                                <div className="progress-subtitle">
                                    {processedCount > 0
                                        ? `Processed ${processedCount}/${totalToEvaluate} candidates...`
                                        : 'Sending resumes to AI pipeline...'}
                                </div>
                            </div>

                            {/* Stage indicators */}
                            <div className="progress-stages">
                                {STAGES.map((stage, idx) => (
                                    <>
                                        <div key={stage} className={`progress-stage ${evalStage === idx ? 'active' : ''} ${evalStage > idx ? 'done' : ''}`}>
                                            <div className="progress-stage-dot">
                                                {evalStage > idx ? '✓' : STAGE_ICONS[idx]}
                                            </div>
                                            <div className="progress-stage-label">{stage}</div>
                                        </div>
                                        {idx < STAGES.length - 1 && (
                                            <div key={`conn-${idx}`} className={`progress-connector ${evalStage > idx ? 'done' : ''}`} />
                                        )}
                                    </>
                                ))}
                            </div>

                            <div className="progress-bar-container">
                                <div className="progress-bar-track">
                                    <div className="progress-bar-fill" style={{ width: `${evalProgress}%` }} />
                                </div>
                                <div className="progress-status-text">
                                    {evalProgress < 100
                                        ? `${STAGES[Math.min(evalStage, 2)] || 'Starting'}... ${evalProgress}%`
                                        : '✓ Evaluation complete!'}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && <div className="alert alert-error" style={{ marginBottom: '24px' }}>⚠️ {error}</div>}

                    {/* Upload Section — shown when not evaluated */}
                    {!evalDone && !evaluating && (
                        <div className="card" style={{ padding: '28px', marginBottom: '32px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                    📤 Upload Resumes
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    Drag & drop PDF or DOCX files — stored in Supabase cloud storage
                                </div>
                            </div>

                            {uploadSuccess && <div className="alert alert-success" style={{ marginBottom: '16px' }}>✓ {uploadSuccess}</div>}

                            {/* Drop Zone — auto-uploads on select/drop */}
                            <div
                                id="resume-dropzone"
                                className={`dropzone ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleFileDrop}
                                onClick={() => !uploading && fileInputRef.current?.click()}
                                style={{ pointerEvents: uploading ? 'none' : 'auto', opacity: uploading ? 0.7 : 1 }}
                            >
                                {uploading ? (
                                    <>
                                        <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 8px' }} />
                                        <div className="dropzone-title">Uploading...</div>
                                        <div className="dropzone-sub">Saving resumes to cloud storage</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="dropzone-icon">📁</div>
                                        <div className="dropzone-title">Drop resumes here</div>
                                        <div className="dropzone-sub">or <span>click to browse</span> — PDF & DOCX supported (auto-uploads)</div>
                                    </>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    id="resume-file-input"
                                    multiple
                                    accept=".pdf,.docx"
                                    style={{ display: 'none' }}
                                    onChange={handleFileSelect}
                                />
                            </div>

                            {/* Start Evaluation CTA */}
                            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    {pendingCount > 0
                                        ? `✓ ${pendingCount} resume${pendingCount > 1 ? 's' : ''} ready. Click to run AI screening!`
                                        : 'Upload resumes above, then start AI evaluation.'}
                                </div>
                                <button
                                    id="start-evaluation-btn"
                                    className="btn btn-primary btn-lg"
                                    onClick={handleStartEvaluation}
                                    disabled={evaluating || pendingCount === 0}
                                    title={pendingCount === 0 ? 'Upload resumes first' : ''}
                                >
                                    ⚡ Start AI Evaluation{pendingCount > 0 ? ` (${pendingCount})` : ''}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* RESULTS */}
                    {evalDone && candidates.length > 0 && (
                        <div className="results-section">
                            {/* Stats */}
                            <div className="stats-strip" style={{ marginBottom: '24px' }}>
                                <div className="stat-card">
                                    <div className="stat-label">Total Screened</div>
                                    <div className="stat-value purple">{candidates.length}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Shortlisted</div>
                                    <div className="stat-value green">{shortlisted.length}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Rejected</div>
                                    <div className="stat-value red">{rejected.length}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Avg. Fit Score</div>
                                    <div className="stat-value">
                                        {candidates.length
                                            ? Math.round(candidates.reduce((s, c) => s + c.fit_score, 0) / candidates.length)
                                            : 0}
                                    </div>
                                </div>
                            </div>

                            <div className="alert alert-success" style={{ marginBottom: '16px' }}>
                                🤖 AI evaluation complete! All {candidates.length} candidates have been screened and scored.
                            </div>

                            {/* Shortlisted */}
                            <div>
                                <div className="results-section-header">
                                    <span style={{ fontSize: '20px' }}>✅</span>
                                    <h2 className="results-section-title">Shortlisted Candidates</h2>
                                    <span className="results-count">{shortlisted.length}</span>
                                </div>
                                <div className="candidates-list">
                                    {shortlisted.map((c, idx) => (
                                        <div key={c.id} className="candidate-card" style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%' }}>
                                                <div className={`candidate-rank ${idx < 3 ? 'top' : ''}`}>
                                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                                                </div>
                                                <div className="candidate-avatar">{getInitials(c.name)}</div>
                                                <div className="candidate-info" style={{ flex: 1 }}>
                                                    <div className="candidate-name">{c.name}</div>
                                                    <div className="candidate-meta">{c.email}</div>
                                                </div>
                                                <span className="badge badge-shortlisted">Shortlisted</span>
                                                <div className="candidate-score">
                                                    <div className={`score-value ${getScoreClass(c.fit_score)}`}>{Math.round(c.fit_score)}</div>
                                                    <div className="score-label">Fit Score</div>
                                                    <div className="score-bar">
                                                        <div
                                                            className={`score-bar-fill ${getScoreClass(c.fit_score)}`}
                                                            style={{ width: `${c.fit_score}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {c.ai_summary && (
                                                <div style={{
                                                    width: '100%',
                                                    marginTop: '14px',
                                                    paddingTop: '14px',
                                                    borderTop: '1px solid var(--border-subtle)',
                                                    paddingLeft: '8px',
                                                }}>
                                                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent-green)', textTransform: 'uppercase', marginBottom: '6px' }}>🤖 AI Candidate Story</div>
                                                    <div className="candidate-summary" style={{ fontSize: '13.5px', lineHeight: '1.65', color: 'var(--text-secondary)', whiteSpace: 'normal', overflow: 'visible', maxWidth: 'none' }}>{c.ai_summary}</div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Glow divider */}
                            <div className="glow-line" />

                            {/* Rejected — Collapsible */}
                            {rejected.length > 0 && (
                                <div>
                                    <div
                                        id="rejected-toggle"
                                        className="collapsible-header"
                                        onClick={() => setRejectedOpen(o => !o)}
                                    >
                                        <div className="results-section-header" style={{ margin: 0 }}>
                                            <span style={{ fontSize: '18px' }}>❌</span>
                                            <span className="results-section-title">Rejected Candidates</span>
                                            <span className="results-count">{rejected.length}</span>
                                        </div>
                                        <span className={`collapsible-toggle ${rejectedOpen ? 'open' : ''}`}>⌄</span>
                                    </div>
                                    {rejectedOpen && (
                                        <div className="collapsible-content">
                                            {rejected.map((c, idx) => (
                                                <div key={c.id} className="candidate-card" style={{ opacity: 0.8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%' }}>
                                                        <div className="candidate-rank">#{shortlisted.length + idx + 1}</div>
                                                        <div className="candidate-avatar" style={{ background: 'var(--surface)' }}>
                                                            {getInitials(c.name)}
                                                        </div>
                                                        <div className="candidate-info" style={{ flex: 1 }}>
                                                            <div className="candidate-name">{c.name}</div>
                                                            <div className="candidate-meta">{c.email}</div>
                                                        </div>
                                                        <span className="badge badge-rejected">Rejected</span>
                                                        <div className="candidate-score">
                                                            <div className={`score-value ${getScoreClass(c.fit_score)}`}>{Math.round(c.fit_score)}</div>
                                                            <div className="score-label">Fit Score</div>
                                                            <div className="score-bar">
                                                                <div className={`score-bar-fill ${getScoreClass(c.fit_score)}`} style={{ width: `${c.fit_score}%` }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {c.ai_summary && (
                                                        <div style={{
                                                            width: '100%',
                                                            marginTop: '14px',
                                                            paddingTop: '14px',
                                                            borderTop: '1px solid var(--border-subtle)',
                                                            paddingLeft: '8px',
                                                        }}>
                                                            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>🤖 AI Candidate Story</div>
                                                            <div className="candidate-summary" style={{ fontSize: '13.5px', lineHeight: '1.65', color: 'var(--text-secondary)', whiteSpace: 'normal', overflow: 'visible', maxWidth: 'none' }}>{c.ai_summary}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {evalDone && candidates.length === 0 && (
                        <div className="alert alert-info">ℹ️ No candidates found. Please upload resumes and run evaluation.</div>
                    )}
                </div>
            </main>
        </div>
    );
}
