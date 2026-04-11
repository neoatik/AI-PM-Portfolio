import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { mapJob } from '@/lib/mappers';

export async function GET() {
    try {
        // Fetch all jobs
        const { data: jobs, error: jobsErr } = await supabase
            .from('jobs')
            .select('*')
            .order('created_at', { ascending: false });

        if (jobsErr) throw jobsErr;

        // Fetch all candidates to compute derived fields per job
        const { data: allCandidates, error: candErr } = await supabase
            .from('candidates')
            .select('id, job_id, status, fit_score');

        if (candErr) throw candErr;

        // Group candidates by job_id
        const candidatesByJob = {};
        for (const c of allCandidates || []) {
            if (!candidatesByJob[c.job_id]) candidatesByJob[c.job_id] = [];
            candidatesByJob[c.job_id].push(c);
        }

        // Map each job with its derived stats
        const mappedJobs = (jobs || []).map(job =>
            mapJob(job, candidatesByJob[job.id] || [])
        );

        return NextResponse.json({ jobs: mappedJobs });
    } catch (err) {
        console.error('[GET /api/jobs] Error:', err.message, err.code || '', err.details || '');
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { role, description, stakeholder_expectations } = body;

        if (!role || !description || !stakeholder_expectations) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        const { data: job, error } = await supabase
            .from('jobs')
            .insert({
                role_name: role,
                job_description: description,
                stakeholder_expectations,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ job: mapJob(job) }, { status: 201 });
    } catch (err) {
        console.error('[POST /api/jobs] Error:', err.message, err.code || '', err.details || '');
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
