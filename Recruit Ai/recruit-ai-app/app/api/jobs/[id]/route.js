import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { mapJob, mapCandidate } from '@/lib/mappers';

export async function GET(request, { params }) {
    try {
        const { id } = await params;

        const { data: job, error: jobErr } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', id)
            .single();

        if (jobErr || !job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        const { data: candidates, error: candErr } = await supabase
            .from('candidates')
            .select('*')
            .eq('job_id', id)
            .order('fit_score', { ascending: false });

        if (candErr) throw candErr;

        const allCandidates = candidates || [];
        const mappedCandidates = allCandidates
            .filter(c => c.status !== 'pending')
            .map(mapCandidate);
        const pendingCount = allCandidates.filter(c => c.status === 'pending').length;

        return NextResponse.json({
            job: mapJob(job, allCandidates),
            candidates: mappedCandidates,
            pending_count: pendingCount,
            total_count: allCandidates.length,
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        const { data: job } = await supabase
            .from('jobs')
            .select('id')
            .eq('id', id)
            .single();

        if (!job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        // Get resume files to clean up storage
        const { data: candidates } = await supabase
            .from('candidates')
            .select('resume_url')
            .eq('job_id', id);

        // Delete candidate rows
        await supabase.from('candidates').delete().eq('job_id', id);

        // Delete job
        await supabase.from('jobs').delete().eq('id', id);

        // Clean up resume files from Supabase Storage
        if (candidates && candidates.length > 0) {
            const filePaths = candidates
                .filter(c => c.resume_url)
                .map(c => {
                    // Extract storage path from Supabase public URL
                    // URL format: https://xxx.supabase.co/storage/v1/object/public/resumes/{jobId}/{file}
                    const url = c.resume_url;
                    const match = url.match(/\/storage\/v1\/object\/public\/resumes\/(.+)$/);
                    return match ? decodeURIComponent(match[1]) : null;
                })
                .filter(Boolean);

            if (filePaths.length > 0) {
                await supabase.storage.from('resumes').remove(filePaths);
            }
        }

        return NextResponse.json({ message: 'Job deleted successfully' });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
