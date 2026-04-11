import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Score a candidate resume against a job description
 */
export async function scoreCandidate(resumeText, jobRole, jobDescription, stakeholderExpectations) {
    const prompt = `You are an expert AI recruiter. Score the following resume against the job requirements.

JOB ROLE: ${jobRole}

JOB DESCRIPTION:
${jobDescription}

STAKEHOLDER EXPECTATIONS:
${stakeholderExpectations}

RESUME TEXT:
${resumeText.substring(0, 3000)}

Analyze and provide:
1. A FIT SCORE from 0-100 (integer only)
2. Candidate's full name (extract from resume, or "Unknown Candidate" if not found)
3. Candidate's email (extract from resume, or "unknown@email.com" if not found)
4. A brief 2-3 sentence AI summary of why they fit or don't fit

Respond in STRICT JSON format only:
{
  "fit_score": <number 0-100>,
  "name": "<candidate full name>",
  "email": "<candidate email>",
  "summary": "<2-3 sentence evaluation summary>"
}`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
}

/**
 * Generate a personalized shortlist email
 */
export async function generateShortlistEmail(candidateName, jobRole, summary, calendarLink) {
    const prompt = `Write a warm, professional shortlist email to a job candidate.

Candidate Name: ${candidateName}
Job Role: ${jobRole}
AI Assessment Summary: ${summary}
Google Calendar Booking Link: ${calendarLink || 'https://calendar.google.com/calendar/u/0/r/eventedit'}

Write a concise, encouraging email (3-4 short paragraphs) that:
- Congratulates them on moving forward
- References their specific strengths briefly  
- Invites them to book a time via the calendar link
- Has a professional close

Return JSON with keys: "subject" and "body" (plain text, no HTML).`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
    });

    return JSON.parse(response.choices[0].message.content);
}

/**
 * Generate a personalized rejection email
 */
export async function generateRejectionEmail(candidateName, jobRole, summary) {
    const prompt = `Write a kind, professional rejection email to a job candidate.

Candidate Name: ${candidateName}
Job Role: ${jobRole}
AI Assessment: ${summary}

Write a compassionate rejection email (2-3 short paragraphs) that:
- Thanks them for their time and application
- Is encouraging and respectful
- Does NOT specify reasons in detail
- Wishes them well in their search

Return JSON with keys: "subject" and "body" (plain text, no HTML).`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
    });

    return JSON.parse(response.choices[0].message.content);
}

export { openai };
