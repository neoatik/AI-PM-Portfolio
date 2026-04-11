import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

export async function POST(request, { params }) {
    try {
        const { id: jobId } = await params;

        // Verify job exists
        const { data: job, error: jobErr } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', jobId)
            .single();

        if (jobErr || !job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        // Get all pending candidates for this job
        const { data: pendingCandidates, error: candErr } = await supabase
            .from('candidates')
            .select('id, resume_url')
            .eq('job_id', jobId)
            .eq('status', 'pending');

        if (candErr) throw candErr;

        if (!pendingCandidates || pendingCandidates.length === 0) {
            return NextResponse.json(
                { error: 'No pending candidates to evaluate. Please upload resumes first.' },
                { status: 400 }
            );
        }

        if (!N8N_WEBHOOK_URL) {
            return NextResponse.json(
                { error: 'n8n webhook URL not configured' },
                { status: 500 }
            );
        }

        // Trigger n8n webhook for each pending candidate
        // Each call returns quickly because n8n responds immediately via Respond to Webhook node
        const results = [];
        for (const candidate of pendingCandidates) {
            try {
                const response = await fetch(N8N_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        job_id: jobId,
                        candidate_id: candidate.id,
                        resume_url: candidate.resume_url,
                    }),
                    signal: AbortSignal.timeout(15000), // 15s timeout per call
                });

                results.push({
                    candidate_id: candidate.id,
                    triggered: response.ok,
                });
            } catch (webhookErr) {
                console.error(`Failed to trigger n8n for candidate ${candidate.id}:`, webhookErr);
                results.push({
                    candidate_id: candidate.id,
                    triggered: false,
                    error: webhookErr.message,
                });
            }
        }

        const triggeredCount = results.filter(r => r.triggered).length;

        return NextResponse.json({
            status: 'processing',
            message: `Evaluation started for ${triggeredCount}/${pendingCandidates.length} candidates`,
            total: pendingCandidates.length,
            triggered: triggeredCount,
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
