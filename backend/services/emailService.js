const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmail(to, subject, text) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text
    });
    console.log(`✅ Email sent to ${to} — subject: "${subject}" — ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ Email send failed for ${to}:`, err.message);
    return { success: false, reason: err.message };
  }
}

async function sendRegistrationEmail(user) {
  const text = [
    `Hello ${user.name},`,
    '',
    'Your account has been created successfully on AssignMate.',
    '',
    'Your account is currently pending admin approval.',
    'You will not be able to log in until an admin approves your account.',
    '',
    'You will receive an email when your account has been approved.',
    '',
    'Thank you,',
    'AssignMate Team'
  ].join('\n');

  return sendEmail(user.email, 'Welcome to AssignMate', text);
}

async function sendApprovalEmail(user) {
  const text = [
    `Hello ${user.name},`,
    '',
    'Your AssignMate account has been approved by the admin.',
    'You can now log in and start using the platform.',
    '',
    'Login here: http://localhost:5000',
    '',
    'Thank you,',
    'AssignMate Team'
  ].join('\n');

  return sendEmail(user.email, 'AssignMate Account Approved', text);
}

async function sendAnnouncementEmail(user, announcement, postedByName) {
  const text = [
    `Hello ${user.name},`,
    '',
    `New Announcement from ${postedByName}:`,
    '',
    `Title: ${announcement.title}`,
    '',
    `${announcement.message}`,
    '',
    'Thank you,',
    'AssignMate Team'
  ].join('\n');

  return sendEmail(user.email, announcement.title, text);
}

async function sendAssignmentEmail(user, assignment) {
  const deadlineStr = new Date(assignment.deadline).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short'
  });

  const text = [
    `Hello ${user.name},`,
    '',
    'A new assignment has been assigned to you:',
    '',
    `Title: ${assignment.title}`,
    `Description: ${assignment.description}`,
    `Subject: ${assignment.subject}`,
    `Deadline: ${deadlineStr}`,
    '',
    'Please submit your work before the deadline.',
    '',
    'Thank you,',
    'AssignMate Team'
  ].join('\n');

  return sendEmail(user.email, `New Assignment: ${assignment.title}`, text);
}

async function sendDueReminderEmail(user, assignment) {
  const deadlineStr = new Date(assignment.deadline).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short'
  });

  const text = [
    `Hello ${user.name},`,
    '',
    `Reminder: "${assignment.title}" is due within 24 hours.`,
    '',
    `Subject: ${assignment.subject}`,
    `Deadline: ${deadlineStr}`,
    '',
    'Please submit your work on time.',
    '',
    'Thank you,',
    'AssignMate Team'
  ].join('\n');

  return sendEmail(user.email, `⏰ Due Soon: ${assignment.title}`, text);
}

async function sendMarksPublishedEmail(user, assignment, submission) {
  const text = [
    `Hello ${user.name},`,
    '',
    `Your marks for "${assignment.title}" have been published.`,
    '',
    `Marks: ${submission.marks} / ${submission.maxMarks}`,
    `Feedback: ${submission.feedback || 'No feedback provided'}`,
    '',
    'You can view the details in your dashboard.',
    '',
    'Thank you,',
    'AssignMate Team'
  ].join('\n');

  return sendEmail(user.email, `Marks Published: ${assignment.title}`, text);
}

module.exports = {
  sendRegistrationEmail,
  sendApprovalEmail,
  sendAnnouncementEmail,
  sendAssignmentEmail,
  sendDueReminderEmail,
  sendMarksPublishedEmail
};
