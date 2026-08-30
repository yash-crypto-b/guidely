import { config } from '../../config';

const BASE_URL = config.platform.url;

export function bookingConfirmationMentee(data: {
  menteeName: string;
  mentorName: string;
  serviceTitle: string;
  startTime: Date;
  duration: number;
  meetingLink?: string;
  bookingId: string;
}) {
  const timeStr = data.startTime.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:24px;color:#1e293b;margin:0;">Guidely</h1>
    </div>
    
    <div style="background:white;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:48px;margin-bottom:16px;">✅</div>
        <h2 style="font-size:20px;color:#1e293b;margin:0;">Booking Confirmed!</h2>
      </div>
      
      <p style="color:#64748b;font-size:14px;line-height:1.6;">
        Hi ${data.menteeName},
      </p>
      
      <p style="color:#64748b;font-size:14px;line-height:1.6;">
        Your session with <strong style="color:#1e293b;">${data.mentorName}</strong> has been confirmed.
      </p>
      
      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:24px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Service</td>
            <td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;text-align:right;">${data.serviceTitle}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Date & Time</td>
            <td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;text-align:right;">${timeStr}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Duration</td>
            <td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;text-align:right;">${data.duration} minutes</td>
          </tr>
        </table>
      </div>
      
      ${data.meetingLink ? `
      <div style="text-align:center;margin:24px 0;">
        <a href="${data.meetingLink}" style="display:inline-block;background:#4c6ef5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
          Join Meeting
        </a>
      </div>
      ` : ''}
      
      <p style="color:#64748b;font-size:13px;line-height:1.6;margin-top:24px;">
        You can manage your booking from your <a href="${BASE_URL}/connections/my" style="color:#4c6ef5;">Connections dashboard</a>.
      </p>
    </div>
    
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:24px;">
      © ${new Date().getFullYear()} Guidely. All rights reserved.
    </p>
  </div>
</body>
</html>
  `;
}

export function bookingConfirmationMentor(data: {
  menteeName: string;
  mentorName: string;
  serviceTitle: string;
  startTime: Date;
  duration: number;
  meetingLink?: string;
  bookingMetadata?: string;
}) {
  const timeStr = data.startTime.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:24px;color:#1e293b;margin:0;">Guidely</h1>
    </div>
    
    <div style="background:white;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:48px;margin-bottom:16px;">📬</div>
        <h2 style="font-size:20px;color:#1e293b;margin:0;">New Booking!</h2>
      </div>
      
      <p style="color:#64748b;font-size:14px;line-height:1.6;">
        Hi ${data.mentorName},
      </p>
      
      <p style="color:#64748b;font-size:14px;line-height:1.6;">
        <strong style="color:#1e293b;">${data.menteeName}</strong> has booked a session with you.
      </p>
      
      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:24px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Service</td>
            <td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;text-align:right;">${data.serviceTitle}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Date & Time</td>
            <td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;text-align:right;">${timeStr}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Duration</td>
            <td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;text-align:right;">${data.duration} minutes</td>
          </tr>
        </table>
      </div>
      
      ${data.bookingMetadata ? `
      <div style="background:#eff6ff;border-radius:12px;padding:16px;margin:24px 0;">
        <p style="color:#1e40af;font-size:12px;font-weight:600;margin:0 0 8px 0;">MENTEE'S REQUEST</p>
        <p style="color:#1e293b;font-size:14px;line-height:1.6;margin:0;">${data.bookingMetadata}</p>
      </div>
      ` : ''}
      
      ${data.meetingLink ? `
      <div style="text-align:center;margin:24px 0;">
        <a href="${data.meetingLink}" style="display:inline-block;background:#4c6ef5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
          Start Meeting
        </a>
      </div>
      ` : ''}
      
      <p style="color:#64748b;font-size:13px;line-height:1.6;margin-top:24px;">
        View this booking in your <a href="${BASE_URL}/connections/dashboard" style="color:#4c6ef5;">Mentor Dashboard</a>.
      </p>
    </div>
    
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:24px;">
      © ${new Date().getFullYear()} Guidely. All rights reserved.
    </p>
  </div>
</body>
</html>
  `;
}

export function sessionReminder(data: {
  recipientName: string;
  otherPartyName: string;
  serviceTitle: string;
  startTime: Date;
  meetingLink?: string;
  minutesUntil: number;
}) {
  const timeStr = data.startTime.toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const timeLabel = data.minutesUntil <= 60
    ? `in ${data.minutesUntil} minutes`
    : `in ${Math.round(data.minutesUntil / 60)} hours`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:24px;color:#1e293b;margin:0;">Guidely</h1>
    </div>
    
    <div style="background:white;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:48px;margin-bottom:16px;">⏰</div>
        <h2 style="font-size:20px;color:#1e293b;margin:0;">Session Starting Soon!</h2>
      </div>
      
      <p style="color:#64748b;font-size:14px;line-height:1.6;">
        Hi ${data.recipientName},
      </p>
      
      <p style="color:#64748b;font-size:14px;line-height:1.6;">
        Your session with <strong style="color:#1e293b;">${data.otherPartyName}</strong> starts ${timeLabel} at <strong>${timeStr}</strong>.
      </p>
      
      <div style="background:#fef3c7;border-radius:12px;padding:16px;margin:24px 0;text-align:center;">
        <p style="color:#92400e;font-size:14px;font-weight:600;margin:0;">
          ${data.serviceTitle} • ${timeStr}
        </p>
      </div>
      
      ${data.meetingLink ? `
      <div style="text-align:center;margin:24px 0;">
        <a href="${data.meetingLink}" style="display:inline-block;background:#4c6ef5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
          Join Meeting
        </a>
      </div>
      ` : ''}
    </div>
    
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:24px;">
      © ${new Date().getFullYear()} Guidely. All rights reserved.
    </p>
  </div>
</body>
</html>
  `;
}

export function reviewRequest(data: {
  menteeName: string;
  mentorName: string;
  serviceTitle: string;
  bookingId: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:24px;color:#1e293b;margin:0;">Guidely</h1>
    </div>
    
    <div style="background:white;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:48px;margin-bottom:16px;">⭐</div>
        <h2 style="font-size:20px;color:#1e293b;margin:0;">How was your session?</h2>
      </div>
      
      <p style="color:#64748b;font-size:14px;line-height:1.6;">
        Hi ${data.menteeName},
      </p>
      
      <p style="color:#64748b;font-size:14px;line-height:1.6;">
        Your session with <strong style="color:#1e293b;">${data.mentorName}</strong> (${data.serviceTitle}) has been completed.
      </p>
      
      <p style="color:#64748b;font-size:14px;line-height:1.6;">
        We'd love to hear your feedback! Your review helps other mentees find great mentors.
      </p>
      
      <div style="text-align:center;margin:24px 0;">
        <a href="${BASE_URL}/connections/my" style="display:inline-block;background:#4c6ef5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
          Leave a Review
        </a>
      </div>
    </div>
    
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:24px;">
      © ${new Date().getFullYear()} Guidely. All rights reserved.
    </p>
  </div>
</body>
</html>
  `;
}
