import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = process.env.FROM_NAME || 'Recruit AI';

export async function sendEmail({ to, subject, body }) {
    try {
        const { data, error } = await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: [to],
            subject,
            text: body,
        });

        if (error) {
            console.error('Email send error:', error);
            return { success: false, error };
        }

        return { success: true, id: data.id };
    } catch (err) {
        console.error('Email exception:', err);
        return { success: false, error: err.message };
    }
}
