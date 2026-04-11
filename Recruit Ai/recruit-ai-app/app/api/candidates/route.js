import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { mapCandidate } from '@/lib/mappers';

export async function GET() {
    try {
        const { data: candidates, error } = await supabase
            .from('candidates')
            .select('*, jobs(role_name)')
            .neq('status', 'pending')
            .order('fit_score', { ascending: false });

        if (error) throw error;

        const mappedCandidates = (candidates || []).map(c => ({
            ...mapCandidate(c),
            job_role: c.jobs?.role_name || 'Unknown',
        }));

        return NextResponse.json({ candidates: mappedCandidates });
    } catch (err) {
        console.error('[GET /api/candidates] Error:', err.message, err.code || '', err.details || '');
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
