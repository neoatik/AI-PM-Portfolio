import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request, { params }) {
    try {
        const { id: jobId } = await params;

        // Verify job exists
        const { data: job, error: jobErr } = await supabase
            .from('jobs')
            .select('id')
            .eq('id', jobId)
            .single();

        if (jobErr || !job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        const formData = await request.formData();
        const files = formData.getAll('resumes');

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
        }

        const uploadedCandidates = [];

        for (const file of files) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const candidateId = uuidv4();
            const fileExt = file.name.split('.').pop();
            const storagePath = `${jobId}/${candidateId}.${fileExt}`;

            // Upload to Supabase Storage
            const { error: uploadErr } = await supabase.storage
                .from('resumes')
                .upload(storagePath, buffer, {
                    contentType: file.type || 'application/pdf',
                    upsert: false,
                });

            if (uploadErr) {
                console.error(`Failed to upload ${file.name}:`, uploadErr);
                continue;
            }

            // Get the public URL
            const { data: urlData } = supabase.storage
                .from('resumes')
                .getPublicUrl(storagePath);

            const publicUrl = urlData.publicUrl;

            // Create candidate row with pending status
            const { data: candidate, error: insertErr } = await supabase
                .from('candidates')
                .insert({
                    id: candidateId,
                    job_id: jobId,
                    name: file.name.replace(/\.(pdf|docx)$/i, ''),
                    resume_url: publicUrl,
                    status: 'pending',
                })
                .select()
                .single();

            if (insertErr) {
                console.error(`Failed to insert candidate for ${file.name}:`, insertErr);
                continue;
            }

            uploadedCandidates.push(candidate);
        }

        return NextResponse.json({
            message: `${uploadedCandidates.length} resume(s) uploaded successfully`,
            count: uploadedCandidates.length,
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
