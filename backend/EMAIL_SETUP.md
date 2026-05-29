# AssignMate Email Setup

## Overview

AssignMate uses Nodemailer with Gmail's SMTP to send transactional emails for registration, approval, announcements, assignments, marks, and due-date reminders.

---

## Environment Variables

The following variables must be set in `backend/.env`:

```env
EMAIL_USER=gmail
EMAIL_PASS=password

```

| Variable | Description |
|---|---|
| `EMAIL_USER` | Gmail address used as the sender |
| `EMAIL_PASS` | Gmail **App Password** (16 chars, space-separated) |

> **Do not use your regular Gmail password. Use an App Password only.**

---

## Gmail App Password Setup

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (required for App Passwords)
3. Go to https://myaccount.google.com/apppasswords
4. Select app: **Mail**
5. Select device: **Other (custom name)** → enter `AssignMate`
6. Click **Generate**
7. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)
8. Paste it into `EMAIL_PASS` in `.env` (spaces included)

> App Passwords are only shown once. Regenerate if lost.

---

## Email Types

| Event | Function | Subject | Trigger |
|---|---|---|---|
| Registration | `sendRegistrationEmail(user)` | `Welcome to AssignMate` | `POST /api/auth/register` |
| Account Approved | `sendApprovalEmail(user)` | `AssignMate Account Approved` | `PUT /api/admin/approve/:id` |
| New Announcement | `sendAnnouncementEmail(user, announcement, postedByName)` | `{announcement.title}` | `POST /api/announcements` |
| Assignment Assigned | `sendAssignmentEmail(user, assignment)` | `New Assignment: {title}` | `POST /api/assignments` |
| Due Soon Reminder | `sendDueReminderEmail(user, assignment)` | `⏰ Due Soon: {title}` | Cron job (every hour) |
| Marks Published | `sendMarksPublishedEmail(user, assignment, submission)` | `Marks Published: {title}` | `PUT /api/submissions/evaluate/:id` |

---

## Key Files

| File | Purpose |
|---|---|
| `backend/services/emailService.js` | Centralized Nodemailer transporter + all 6 template functions |
| `backend/cron/reminderCron.js` | `node-cron` task — hourly check for assignments due within 24h |
| `backend/models/Reminder.js` | Tracks sent reminders (prevents duplicate due-date emails) |
| `backend/tests/email-test.js` | CLI test script for all email types |

---

## Testing

### Quick test (manual email)

```bash
cd backend
node test-email.js
```

### Test all 6 email types

```bash
cd backend
npm run email-test
```

The test script sends one email per type to the address configured inside the script.

### Verify cron is running

Start the server and look for:

```
⏰ Reminder cron scheduled: every hour at minute 0
```

To manually trigger the cron logic:

```bash
cd backend
node -e "
const start = require('./cron/reminderCron');
start();  // registers cron — wait for the next minute 0, or...
// ...manually invoke the task logic via a test
"
```

---

## Architecture

```
Route handler (auth.js / admin.js / etc.)
  → emailService.sendXxxEmail(user, ...)    // fire-and-forget, no await
    → sendEmail(to, subject, text)           // nodemailer transporter
      → transporter.sendMail()               // Gmail SMTP
```

- Email failures are caught internally by `sendEmail()`.
- Errors are logged with `console.error()`.
- **Email never blocks the HTTP response.**
- All `Promise.allSettled()` calls ensure one failed email doesn't affect others.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Invalid login` | Wrong App Password | Regenerate at myaccount.google.com/apppasswords |
| `Username and Password not accepted` | App Password has spaces removed | Include spaces: `abcd efgh ijkl mnop` |
| `getaddrinfo ENOTFOUND smtp.gmail.com` | No internet | Check network connectivity |
| `Email sent` log but no inbox | Check Spam folder | Mark as "Not Spam" |
| `Sender address rejected` | EMAIL_USER mismatch | Ensure `from:` matches `auth.user` |
| Duplicate reminder emails | Reminder index missing | Ensure `Reminder` collection has unique compound index |
| Reminder cron not firing | Server timezone | Cron uses system time — verify with `node -e "console.log(new Date())"` |

---

## Rollback Email Changes

```powershell
Remove-Item -LiteralPath "backend/services/emailService.js" -ErrorAction SilentlyContinue
Remove-Item -LiteralPath "backend/cron/reminderCron.js" -ErrorAction SilentlyContinue
Remove-Item -LiteralPath "backend/models/Reminder.js" -ErrorAction SilentlyContinue
Remove-Item -LiteralPath "backend/tests/email-test.js" -ErrorAction SilentlyContinue
Remove-Item -LiteralPath "backend/EMAIL_SETUP.md" -ErrorAction SilentlyContinue
npm uninstall node-cron
git checkout HEAD -- backend/routes/auth.js backend/routes/admin.js
git checkout HEAD -- backend/routes/announcements.js backend/routes/assignments.js
git checkout HEAD -- backend/routes/submissions.js backend/server.js
git checkout HEAD -- backend/services/emailService.js backend/package.json
```
