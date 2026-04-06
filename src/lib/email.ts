import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface SendConfirmationParams {
  to: string;
  firstName: string;
  lastName: string;
  teamName: string;
  golferNames: string[];
  editLink: string;
  entryFee: number;
  deadline: string | null;
  paymentMethod: string | null;
  paidTo: string | null;
}

export async function sendConfirmationEmail({
  to,
  firstName,
  lastName,
  teamName,
  golferNames,
  editLink,
  entryFee,
  deadline,
  paymentMethod,
  paidTo,
}: SendConfirmationParams) {
  const deadlineStr = deadline
    ? new Date(deadline).toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/New_York',
      }) + ' ET'
    : 'TBD';

  const golferList = golferNames.map((name) => `  - ${name}`).join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #166534; padding: 24px; text-align: center;">
        <h1 style="color: #facc15; margin: 0; font-size: 24px;">The Masters Game</h1>
      </div>
      <div style="padding: 24px; background-color: #f9fafb;">
        <h2 style="color: #166534; margin-top: 0;">Team Submitted!</h2>
        <p>Hey ${firstName}, your team has been entered.</p>

        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 4px;"><strong>Team:</strong> ${teamName}</p>
          <p style="margin: 0 0 4px;"><strong>Owner:</strong> ${firstName} ${lastName}</p>
          <p style="margin: 0;"><strong>Entry Fee:</strong> $${entryFee}</p>
        </div>

        <h3 style="color: #166534;">Your Golfers</h3>
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          ${golferNames.map((name) => `<p style="margin: 4px 0;">${name}</p>`).join('')}
        </div>

        <div style="background: #fef9c3; border: 1px solid #fde047; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-weight: bold; color: #854d0e;">Want to change your picks?</p>
          <p style="margin: 0 0 12px; font-size: 14px; color: #854d0e;">
            You can edit your team anytime before the deadline (${deadlineStr}).
          </p>
          <a href="${editLink}" style="display: inline-block; background-color: #166534; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Edit My Team
          </a>
        </div>

        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-weight: bold;">Payment ($${entryFee})</p>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            ${paymentMethod ? `Method: <strong>${paymentMethod}</strong> &mdash; ${paidTo}` : 'Please pay via Venmo or PayPal to the pool organizer.'}
          </p>
          ${paymentMethod === 'Venmo' ? '<p style="margin: 8px 0 0; font-size: 13px;"><a href="https://venmo.com/u/Jack-Kavanagh" style="color: #2563eb;">Pay via Venmo &rarr;</a> (send as personal)</p>' : ''}
          ${paymentMethod === 'PayPal' ? '<p style="margin: 8px 0 0; font-size: 13px; color: #dc2626;"><strong>Must send as gift or will be rejected</strong></p>' : ''}
        </div>

        <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">
          Save this email &mdash; the edit link above is the only way to modify your team.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"The Masters Game" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Team Confirmed: ${teamName} - The Masters Game`,
      html,
    });
    return { success: true };
  } catch (error: any) {
    console.error('Email send failed:', error.message);
    return { success: false, error: error.message };
  }
}
