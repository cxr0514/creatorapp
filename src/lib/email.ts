import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  // Create a transporter (in production, you'd use a service like SendGrid, Mailgun, etc.)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    secure: Boolean(process.env.EMAIL_SERVER_SECURE),
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });

  try {
    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"CreatorApp" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      text,
      html,
    });

    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export function generateWorkspaceInviteEmail(inviterName: string, workspaceName: string, inviteToken: string) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/workspace/invite/${inviteToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>You've been invited to join a workspace!</h2>
      <p>${inviterName} has invited you to join the "${workspaceName}" workspace on CreatorApp.</p>
      <div style="margin: 20px 0;">
        <a href="${inviteUrl}" style="background-color: #7c3aed; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Accept Invitation
        </a>
      </div>
      <p>Or copy and paste this link in your browser: ${inviteUrl}</p>
      <p>This invitation will expire in 7 days.</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eaeaea;">
      <p style="color: #666; font-size: 12px;">
        If you weren't expecting this invitation, you can safely ignore this email.
      </p>
    </div>
  `;

  const text = `
    You've been invited to join a workspace!
    
    ${inviterName} has invited you to join the "${workspaceName}" workspace on CreatorApp.
    
    Accept the invitation by visiting: ${inviteUrl}
    
    This invitation will expire in 7 days.
    
    If you weren't expecting this invitation, you can safely ignore this email.
  `;

  return { html, text };
}

export function generateSupportTicketNotificationEmail(ticketId: string, subject: string) {
  const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL}/support/ticket/${ticketId}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Response to Your Support Ticket</h2>
      <p>There's a new response to your support ticket: <strong>${subject}</strong></p>
      <div style="margin: 20px 0;">
        <a href="${ticketUrl}" style="background-color: #7c3aed; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Ticket
        </a>
      </div>
      <p>Or copy and paste this link in your browser: ${ticketUrl}</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eaeaea;">
      <p style="color: #666; font-size: 12px;">
        Please do not reply to this email. Respond through the support portal.
      </p>
    </div>
  `;

  const text = `
    New Response to Your Support Ticket
    
    There's a new response to your support ticket: ${subject}
    
    View the ticket by visiting: ${ticketUrl}
    
    Please do not reply to this email. Respond through the support portal.
  `;

  return { html, text };
}
