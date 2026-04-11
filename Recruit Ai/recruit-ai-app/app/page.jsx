'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function CreateJobModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ role: '', description: '', stakeholder_expectations: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.role.trim() || !form.description.trim() || !form.stakeholder_expectations.trim()) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create job');
      onCreated(data.job);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Create New Job</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">⚠️ {error}</div>}
            <div className="form-group">
              <label className="form-label">Job Role <span>*</span></label>
              <input
                id="job-role"
                className="form-input"
                placeholder="e.g. Senior Frontend Engineer"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Job Description <span>*</span></label>
              <textarea
                id="job-description"
                className="form-textarea"
                placeholder="Describe the role, responsibilities, and required qualifications..."
                rows={5}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Stakeholder Expectations <span>*</span></label>
              <textarea
                id="job-expectations"
                className="form-textarea"
                placeholder="What does the hiring manager expect? (skills, culture, experience level...)"
                rows={3}
                value={form.stakeholder_expectations}
                onChange={(e) => setForm({ ...form, stakeholder_expectations: e.target.value })}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="create-job-submit" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" />Creating...</> : '✦ Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/jobs')
      .then((r) => r.json())
      .then((d) => { setJobs(d.jobs || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handleJobCreated(newJob) {
    setJobs((prev) => [{ ...newJob, candidate_count: 0, shortlisted_count: 0 }, ...prev]);
    setShowModal(false);
  }

  async function handleDeleteJob(e, jobId, jobRole) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Delete "${jobRole}"? This will permanently remove the job and all its candidates.`)) return;
    setDeletingId(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (err) {
      alert('Failed to delete job. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  const totalJobs = jobs.length;
  const evaluatedJobs = jobs.filter((j) => j.status === 'evaluated').length;
  const totalShortlisted = jobs.reduce((s, j) => s + (j.shortlisted_count || 0), 0);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-wrapper">
          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-subtitle">Manage your job listings and AI evaluations</p>
            </div>
            <button id="open-create-job" className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
              + Create New Job
            </button>
          </div>

          {/* Stats Strip */}
          <div className="stats-strip">
            <div className="stat-card">
              <div className="stat-label">Total Jobs</div>
              <div className="stat-value purple">{totalJobs}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Evaluated</div>
              <div className="stat-value green">{evaluatedJobs}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Shortlisted</div>
              <div className="stat-value green">{totalShortlisted}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pending Review</div>
              <div className="stat-value">{totalJobs - evaluatedJobs}</div>
            </div>
          </div>

          {/* Jobs Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⟳</div>
              Loading jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">No jobs yet</div>
              <div className="empty-state-sub">Create your first job listing to start screening candidates with AI.</div>
              <button id="empty-create-job" className="btn btn-primary" onClick={() => setShowModal(true)}>
                + Create New Job
              </button>
            </div>
          ) : (
            <div className="jobs-grid">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="card card-clickable job-card"
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  style={{ position: 'relative' }}
                >
                  <div className="job-card-header">
                    <div className="job-card-icon">💼</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge badge-${job.status}`}>
                        {job.status === 'evaluated' ? '✓ Evaluated' : '● Active'}
                      </span>
                      <button
                        id={`delete-job-${job.id}`}
                        className="btn btn-danger btn-sm btn-icon"
                        title="Delete job"
                        disabled={deletingId === job.id}
                        onClick={(e) => handleDeleteJob(e, job.id, job.role)}
                        style={{ width: '30px', height: '30px', fontSize: '14px', flexShrink: 0 }}
                      >
                        {deletingId === job.id ? <div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} /> : '🗑'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="job-card-title">{job.role}</div>
                    <div className="job-card-date">Created {formatDate(job.created_at)}</div>
                  </div>
                  <div className="job-card-meta">
                    <div className="job-meta-item">
                      <div className="job-meta-dot" />
                      {job.candidate_count || 0} Candidates
                    </div>
                    {job.shortlisted_count > 0 && (
                      <div className="job-meta-item">
                        <div className="job-meta-dot" style={{ background: 'var(--accent-green)' }} />
                        {job.shortlisted_count} Shortlisted
                      </div>
                    )}
                  </div>
                  <div className="job-card-footer">
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {job.description?.substring(0, 60)}...
                    </span>
                    <span style={{ fontSize: '18px', color: 'var(--accent-primary)' }}>→</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <CreateJobModal
          onClose={() => setShowModal(false)}
          onCreated={handleJobCreated}
        />
      )}
    </div>
  );
}
