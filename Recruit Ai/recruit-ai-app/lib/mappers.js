const FIT_SCORE_THRESHOLD = 60;

/**
 * Map a Supabase job row to the frontend format.
 * Derives status, candidate_count, shortlisted_count from candidates.
 */
export function mapJob(job, candidates = []) {
    const analyzedCandidates = candidates.filter(c => c.status === 'analyzed');
    return {
        id: job.id,
        role: job.role_name,
        description: job.job_description,
        stakeholder_expectations: job.stakeholder_expectations,
        status: analyzedCandidates.length > 0 ? 'evaluated' : 'active',
        created_at: job.created_at,
        candidate_count: candidates.filter(c => c.status !== 'pending').length,
        shortlisted_count: analyzedCandidates.filter(c => c.fit_score >= FIT_SCORE_THRESHOLD).length,
    };
}

/**
 * Map a Supabase candidate row to the frontend format.
 * Derives shortlisted/rejected from fit_score threshold.
 */
export function mapCandidate(c) {
    let status = c.status;
    if (status === 'analyzed') {
        status = c.fit_score >= FIT_SCORE_THRESHOLD ? 'shortlisted' : 'rejected';
    }
    return {
        id: c.id,
        job_id: c.job_id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        resume_url: c.resume_url,
        github_url: c.github_url,
        github_score: c.github_score,
        skills: c.skills,
        fit_score: c.fit_score || 0,
        validation_score: c.validation_score,
        title_authenticity_score: c.title_authenticity_score,
        career_level_score: c.career_level_score,
        seniority_fit_score: c.seniority_fit_score,
        ai_summary: c.candidate_story,
        status,
        created_at: c.created_at,
    };
}

export { FIT_SCORE_THRESHOLD };
