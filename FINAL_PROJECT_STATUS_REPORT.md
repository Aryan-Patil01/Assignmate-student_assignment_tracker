# AssignMate — Final Project Status Report

**Project:** Student Assignment Tracker  
**Backend:** Node.js + Express 5 + MongoDB (Atlas)  
**Frontend:** Vanilla HTML/CSS/JS (served via Express)  
**Notifications:** Twilio WhatsApp + Nodemailer Email  
**Authentication:** JWT (bcryptjs)

---

## 1. Features Implemented

### Core Platform
- **Multi-role auth**: Admin, Teacher, Mentor, Student registration & login
- **JWT authentication**: 7-day token, middleware-guarded routes
- **Role-based access control**: Each role sees only permitted routes/data
- **Admin dashboard**: Approve/delete users, change roles, assign mentors
- **Teacher dashboard**: Create assignments, evaluate submissions, view analytics/leaderboard
- **Mentor dashboard**: View assigned students, evaluate submissions, view leaderboard
- **Student dashboard**: View assignments, submit work (text + file upload), view marks
- **File uploads**: Multer-based, stored in `backend/uploads/`
- **CSV export**: Download submissions as CSV
- **Alert/banner system**: Global admin alerts displayed across all dashboards

### API Endpoints
| Route | Methods | Purpose |
|---|---|---|
| `/api/auth` | POST register, POST login, GET me | Authentication |
| `/api/assignments` | GET, POST, PUT, DELETE | Assignment CRUD |
| `/api/submissions` | PUT submit, GET my, GET by assignment, PUT evaluate, GET export | Submission workflow |
| `/api/admin` | GET pending, PUT approve, GET users, DELETE user, PUT role | Admin operations |
| `/api/mentor` | GET students, PUT assign | Mentor assignments |
| `/api/analytics` | GET teacher | Teacher analytics |
| `/api/leaderboard` | GET | Student leaderboard |
| `/api/announcements` | GET, POST, DELETE, PUT pin | Announcement system |

---

## 2. Email Notification Features

**Service file:** `backend/services/emailService.js`

| Event | Function | Subject | Non-blocking |
|---|---|---|---|
| Registration | `sendRegistrationEmail(user)` | `Welcome to AssignMate` | ✅ |
| Account Approved | `sendApprovalEmail(user)` | `AssignMate Account Approved` | ✅ |
| New Announcement | `sendAnnouncementEmail(user, announcement, postedByName)` | Announcement title | ✅ |
| Assignment Assigned | `sendAssignmentEmail(user, assignment)` | `New Assignment: {title}` | ✅ |
| Due Soon Reminder | `sendDueReminderEmail(user, assignment)` | `⏰ Due Soon: {title}` | ✅ (cron, hourly) |
| Marks Published | `sendMarksPublishedEmail(user, assignment, submission)` | `Marks Published: {title}` | ✅ |

**Key characteristics:**
- All emails sent via Gmail SMTP (Nodemailer)
- Credentials from `.env` (`EMAIL_USER`, `EMAIL_PASS`)
- All send functions are fire-and-forget (no `await` in route handlers)
- Errors caught internally and logged — never block HTTP responses
- Announcement emails use `Promise.allSettled()` — one failure doesn't affect others
- Due-date reminders use `node-cron` at `0 * * * *` (hourly)
- Duplicate reminder prevention via MongoDB unique compound index on Reminder model

---

## 3. WhatsApp Notification Features

**Service file:** `backend/services/whatsappService.js`  
**Helper:** `backend/helpers/notifications.js`

| Event | Function | Non-blocking |
|---|---|---|
| Login | `sendLoginNotification(user)` | ✅ |
| New Announcement | `sendAnnouncementNotification(users, announcement)` | ✅ |

**Key characteristics:**
- Twilio WhatsApp Business API (Sandbox mode)
- Credentials from `.env` (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`)
- Indian mobile number normalization (handles `9876543210`, `+919876543210`, `919876543210`)
- Phone stored in `User.phone` and `User.parentPhone` fields
- All sends are fire-and-forget
- Announcement WhatsApp uses `Promise.allSettled()`
- Recipients must join the Twilio Sandbox first

**Test script:** `backend/tests/whatsapp-test.js`  
```bash
cd backend
npm run whatsapp-test +919876543210
```

---

## 4. Database Models

| Model | Collection | Key Fields |
|---|---|---|
| `User` | `users` | name, email, password, role, approved, usn, class, division, subject, phone, parentPhone, isMentor, mentorId, flagged |
| `Assignment` | `assignments` | title, description, subject, class, division, deadline, priority, tags, createdBy, assignedTo[] |
| `Submission` | `submissions` | assignmentId, studentId, submittedText, fileUrl, fileName, status, marks, maxMarks, feedback, submittedAt |
| `Announcement` | `announcements` | title, message, postedBy, targetRole, pinned |
| `Reminder` | `reminders` | assignmentId, studentId, sentAt (+ unique compound index) |
| (Alerts/Banners) | `banners` | message, active, createdBy (if applicable based on admin alert feature) |

---

## 5. Dependencies Added

### Production
| Package | Version | Purpose |
|---|---|---|
| `express` | ^5.2.1 | Web framework |
| `mongoose` | ^9.6.1 | MongoDB ODM |
| `bcryptjs` | ^3.0.3 | Password hashing |
| `jsonwebtoken` | ^9.0.3 | JWT generation/verification |
| `cors` | ^2.8.6 | Cross-origin support |
| `dotenv` | ^17.4.2 | Environment variables |
| `multer` | ^2.1.1 | File upload handling |
| `json2csv` | ^6.0.0-alpha.2 | CSV export |
| `twilio` | ^6.0.2 | WhatsApp API |
| `nodemailer` | ^8.0.10 | Email SMTP |
| `node-cron` | ^3.x | Scheduled reminders |

### Dev
| Package | Version | Purpose |
|---|---|---|
| `nodemon` | ^3.0.2 | Hot reload during development |

---

## 6. Testing Instructions

### Start the server
```bash
cd backend
npm start
```

### Verify health
```bash
curl http://localhost:5000/api
# → {"message":"AssignMate API v2.0 ✅"}
```

### Test authentication
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"test123","role":"student","phone":"9876543210"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@assignmate.com","password":"admin123"}'
```

### Test WhatsApp
```bash
cd backend
npm run whatsapp-test +919876543210
```

### Test Email
```bash
cd backend
npm run email-test
```

### Test reminders (manual)
```bash
# Create assignment due within 1 hour, then wait for cron or run:
cd backend
node -e "require('./cron/reminderCron')()"
```

### Test frontend
Open `http://localhost:5000` in a browser (Express serves the frontend).

### Seeded test accounts
| Email | Password | Role |
|---|---|---|
| admin@assignmate.com | admin123 | Admin |
| teacher@assignmate.com | teacher123 | Teacher |
| student@sats.com | student123 | Student |
| test@example.com | test123 | Student |

---

## 7. Deployment Instructions

### Prerequisites
- Node.js >= 18
- MongoDB Atlas cluster (or local MongoDB)
- Twilio account (for WhatsApp)
- Gmail account with App Password (for email)

### Steps

1. **Clone repository**
   ```bash
   git clone <repo-url>
   cd Assignmate-student_assignment_tracker
   ```

2. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment**  
   Create `backend/.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<db>?...
   JWT_SECRET=<your-secret>

   TWILIO_ACCOUNT_SID=<your-sid>
   TWILIO_AUTH_TOKEN=<your-token>
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

   EMAIL_USER=<your-gmail>
   EMAIL_PASS=<your-app-password>
   ```

4. **Start server**
   ```bash
   npm start
   ```

5. **Ensure uploads directory exists**
   ```bash
   mkdir -p backend/uploads
   ```

### Platform-specific notes

| Platform | Notes |
|---|---|
| **Render** | Set build command: `cd backend && npm install`, start command: `cd backend && npm start` |
| **Railway** | Root directory: `backend`, start command: `npm start` |
| **Heroku** | `Procfile`: `web: cd backend && npm start` |
| **VPS (Linux)** | Use PM2: `pm2 start backend/server.js --name assignmate` |

---

## 8. Known Limitations

| Limitation | Detail | Priority |
|---|---|---|
| **Twilio Sandbox** | Only numbers that joined the sandbox can receive WhatsApp. Production requires Twilio-approved template messages. | Medium |
| **Gmail send limit** | 500 emails/day for free Gmail. Use a paid SMTP service (SendGrid, SES) for production. | Low |
| **No email queue** | Failed emails are logged but not retried. A queue (Bull/BullMQ + Redis) would add retry logic. | Low |
| **No WebSocket** | Dashboards don't update in real time — user must refresh. | Low |
| **Frontend is static HTML** | No component framework, no client-side routing. State managed via DOM manipulation. | Low |
| **File uploads to local disk** | Not portable across servers. Use S3/Cloudinary for production. | Medium |
| **No pagination** | Large datasets (users, assignments) load fully. | Low |
| **No rate limiting** | API endpoints have no request throttling. | Low |
| **No HTTPS** | Requires reverse proxy (Nginx, Caddy) or platform SSL. | Medium |

---

## 9. Future Enhancements

| Enhancement | Description |
|---|---|
| **Email queue** | Add Bull/BullMQ for async email delivery with retries |
| **SMS fallback** | Use Twilio SMS when WhatsApp is unavailable |
| **Push notifications** | Browser push notifications via Service Workers |
| **Real-time updates** | Socket.IO for live dashboard updates |
| **S3 file storage** | Replace local `uploads/` with AWS S3 or Cloudinary |
| **OAuth login** | Google/GitHub OAuth for admin authentication |
| **Pagination** | Server-side pagination for users, assignments, submissions |
| **Rate limiting** | `express-rate-limit` on auth endpoints |
| **Automated testing** | Jest + Supertest for API integration tests |
| **CI/CD pipeline** | GitHub Actions for lint, test, and deploy |
| **SMTP provider swap** | Abstract Nodemailer config to support SendGrid, SES, Mailgun |
| **Dark mode** | CSS variable-based theme toggle |
| **Mobile app** | React Native or Flutter client |

---

## File Inventory

```
Assignmate-student_assignment_tracker/
├── backend/
│   ├── cron/
│   │   └── reminderCron.js              # Hourly due-date reminder
│   ├── helpers/
│   │   └── notifications.js             # WhatsApp notification helpers
│   ├── middleware/
│   │   └── auth.js                      # JWT auth middleware
│   ├── models/
│   │   ├── User.js                      # User schema + validation
│   │   ├── Assignment.js                # Assignment schema
│   │   ├── Submission.js                # Submission schema
│   │   ├── Announcement.js              # Announcement schema
│   │   └── Reminder.js                  # Reminder tracking (dupe prevention)
│   ├── routes/
│   │   ├── auth.js                      # Register, login, me
│   │   ├── admin.js                     # User management
│   │   ├── assignments.js               # Assignment CRUD
│   │   ├── submissions.js               # Submit, evaluate, export
│   │   ├── announcements.js             # Announcement CRUD
│   │   ├── mentor.js                    # Mentor-student mapping
│   │   ├── analytics.js                 # Teacher analytics
│   │   └── leaderboard.js               # Leaderboard
│   ├── services/
│   │   ├── whatsappService.js           # Twilio WhatsApp client
│   │   └── emailService.js              # Nodemailer + 6 templates
│   ├── tests/
│   │   ├── whatsapp-test.js             # WhatsApp send test
│   │   └── email-test.js                # Email send test
│   ├── .env                             # Credentials (gitignored)
│   ├── .env.example                     # Template
│   ├── server.js                        # Entry point
│   ├── db.js                            # MongoDB connection
│   ├── upload.js                        # Multer config
│   ├── package.json
│   ├── EMAIL_SETUP.md
│   └── WHATSAPP_SETUP.md
├── frontend/
│   ├── index.html                       # Login/Register
│   ├── student.html                     # Student dashboard
│   ├── teacher.html                     # Teacher dashboard
│   ├── mentor.html                      # Mentor dashboard
│   └── admin.html                       # Admin dashboard
├── ASSIGNMATE_FULL_DOCS.md              # Full project documentation
├── FINAL_PROJECT_STATUS_REPORT.md       # This file
└── package.json                         # Root (minimal)
```
