# AssignMate v2.0 — Complete Project Documentation

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database — MongoDB Models](#4-database--mongodb-models)
5. [API Endpoints (Backend Routes)](#5-api-endpoints-backend-routes)
6. [Authentication & Middleware](#6-authentication--middleware)
7. [Frontend Pages](#7-frontend-pages)
8. [Roles & Permissions Matrix](#8-roles--permissions-matrix)
9. [Features by Role](#9-features-by-role)
10. [File Upload System](#10-file-upload-system)
11. [Hosted URL](#11-hosted-url)
12. [Environment Variables](#12-environment-variables)
13. [Running Locally](#13-running-locally)

---

## 1. Project Overview

**AssignMate** is a full-stack student assignment tracking system designed for educational institutions. It enables teachers to create and assign work, students to submit text/files, mentors to evaluate submissions, and admins to manage the entire ecosystem.

- **Hosted API:** `https://assignmate-student-assignment-tracker.onrender.com`
- **Version:** 2.0.0
- **Brand name on dashboards:** SATS (Student Assignment Tracking System)

---

## 2. Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | >= 18.0.0 | Runtime |
| Express | ^5.2.1 | HTTP framework |
| Mongoose | ^9.6.1 | MongoDB ODM |
| bcryptjs | ^3.0.3 | Password hashing |
| jsonwebtoken | ^9.0.3 | JWT authentication |
| multer | ^2.1.1 | File upload handling |
| json2csv | ^6.0.0-alpha.2 | CSV export |
| cors | ^2.8.6 | Cross-origin support |
| dotenv | ^17.4.2 | Environment variables |
| nodemon | ^3.0.2 (dev) | Auto-restart |

### Frontend
| Technology | Purpose |
|---|---|
| Pure HTML5 + CSS3 | Static pages |
| Vanilla JavaScript (ES6+) | Dynamic behavior |
| Chart.js (CDN) | Analytics charts (teacher dashboard) |
| Google Fonts (Inter, Plus Jakarta Sans) | Typography |

### Database
- **MongoDB** (connection via `MONGO_URI` env variable)
- Connection forced to IPv4 (`family: 4`) for compatibility

---

## 3. Project Structure

```
D:\github\Assignmate-student_assignment_tracker\
├── .gitignore
├── package-lock.json (root — empty/placeholder)
│
├── backend/
│   ├── .env                          # (gitignored) MONGO_URI, JWT_SECRET, PORT
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js                     # Entry point — Express app setup
│   ├── db.js                         # MongoDB connection logic
│   ├── upload.js                     # Multer configuration for file uploads
│   ├── middleware/
│   │   └── auth.js                   # JWT verification middleware
│   ├── models/
│   │   ├── User.js                   # User schema (all roles)
│   │   ├── Assignment.js             # Assignment schema
│   │   ├── Submission.js             # Submission/evaluation schema
│   │   └── Announcement.js           # Announcement schema
│   ├── routes/
│   │   ├── auth.js                   # Register, login, profile
│   │   ├── assignments.js            # Assignment CRUD + student list
│   │   ├── submissions.js            # Submit, evaluate, file access, CSV export
│   │   ├── admin.js                  # User management (approve, delete, role change)
│   │   ├── mentor.js                 # Mentor-student assignment
│   │   ├── analytics.js              # Per-assignment & teacher analytics
│   │   ├── leaderboard.js            # Student ranking by score
│   │   └── announcements.js          # Announcement CRUD + pinning
│   └── uploads/                      # Uploaded files stored here (gitignored except .gitkeep)
│
└── frontend/
    ├── package-lock.json
    ├── dashboard.css                 # Shared dark-theme CSS (not actively used by all pages — was early design)
    ├── index.html                    # Login/Register page (landing)
    ├── student.html                  # Student dashboard
    ├── teacher.html                  # Teacher dashboard
    ├── mentor.html                   # Mentor dashboard
    └── admin.html                    # Admin dashboard
```

---

## 4. Database — MongoDB Models

### 4.1 User (`models/User.js`)

| Field | Type | Constraints |
|---|---|---|
| `name` | String | required |
| `email` | String | required, unique |
| `password` | String | required (bcrypt-hashed) |
| `role` | String (enum) | `'admin'`, `'teacher'`, `'mentor'`, `'student'` — required |
| `approved` | Boolean | default: `false` |
| `usn` | String | default: `''` (student roll number) |
| `class` | String | default: `''` (e.g. "6th Sem") |
| `division` | String | default: `''` (e.g. "A") |
| `subject` | String | default: `''` (teacher's subject) |
| `phone` | String | default: `''` |
| `parentPhone` | String | default: `''` (for WhatsApp alerts) |
| `isMentor` | Boolean | default: `false` |
| `mentorId` | ObjectId (ref: User) | default: `null` |
| `flagged` | Boolean | default: `false` |
| `flagReason` | String | default: `''` |
| `timestamps` | auto | `createdAt`, `updatedAt` |

### 4.2 Assignment (`models/Assignment.js`)

| Field | Type | Constraints |
|---|---|---|
| `title` | String | required |
| `description` | String | default: `''` |
| `subject` | String | required |
| `class` | String | default: `''` |
| `division` | String | default: `''` |
| `deadline` | Date | required |
| `priority` | String (enum) | `'low'`, `'medium'`, `'high'` — default: `'medium'` |
| `tags` | [String] | default: `[]` |
| `createdBy` | ObjectId (ref: User) | — |
| `assignedTo` | [ObjectId] (ref: User) | array of student IDs |
| `timestamps` | auto | `createdAt`, `updatedAt` |

### 4.3 Submission (`models/Submission.js`)

| Field | Type | Constraints |
|---|---|---|
| `assignmentId` | ObjectId (ref: Assignment) | required |
| `studentId` | ObjectId (ref: User) | required |
| `submittedText` | String | default: `''` |
| `fileUrl` | String | default: `''` (stored filename on disk) |
| `fileName` | String | default: `''` (original filename) |
| `status` | String (enum) | `'pending'`, `'submitted'`, `'late'`, `'evaluated'` — default: `'pending'` |
| `marks` | Number | default: `null` |
| `maxMarks` | Number | default: `100` |
| `feedback` | String | default: `''` |
| `submittedAt` | Date | — |
| `timestamps` | auto | `createdAt`, `updatedAt` |

**Key behavior:** When an assignment is created, a `pending` Submission is auto-created for each assigned student. When a student later submits, the status changes to `'submitted'` or `'late'` (depending on deadline). After evaluation, status becomes `'evaluated'`.

### 4.4 Announcement (`models/Announcement.js`)

| Field | Type | Constraints |
|---|---|---|
| `title` | String | required |
| `message` | String | required |
| `postedBy` | ObjectId (ref: User) | — |
| `targetRole` | String (enum) | `'all'`, `'student'`, `'teacher'`, `'mentor'` — default: `'all'` |
| `pinned` | Boolean | default: `false` |
| `timestamps` | auto | `createdAt`, `updatedAt` |

---

## 5. API Endpoints (Backend Routes)

All endpoints prefixed with `/api`. Protected routes require `Authorization: Bearer <token>` header.

### 5.1 Auth Routes (`/api/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Register user (name, email, password, role + optional fields). Returns `{ message }`. |
| POST | `/login` | No | Login (email + password). Returns `{ token, role, name, id, isMentor }`. JWT expires in 7 days. |
| GET | `/me` | Yes | Get current user profile (populated with `mentorId`). Passwords excluded. |

**Register body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "role": "student|teacher|mentor",
  "usn": "1AM22CS001",
  "class": "6th Sem",
  "division": "A",
  "subject": "Data Structures",
  "phone": "+91 9876543210",
  "parentPhone": "+91 9876543211"
}
```

### 5.2 Assignment Routes (`/api/assignments`)

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| POST | `/` | Yes | teacher, mentor, admin | Create assignment. Auto-creates pending submissions for each assigned student. |
| GET | `/` | Yes | all | List assignments (role-filtered: teachers see own, students see assigned, admin sees all). |
| GET | `/:id` | Yes | all | Get single assignment with populated student/creator data. |
| PUT | `/:id` | Yes | owner or admin | Update assignment. |
| DELETE | `/:id` | Yes | owner or admin | Delete assignment + all related submissions. |
| GET | `/meta/students` | Yes | all | List approved students (name, email, usn, class, division) for assignment dropdown. |

**POST body:**
```json
{
  "title": "TCP Header Analysis",
  "description": "Analyze the TCP header...",
  "subject": "Computer Networks",
  "class": "6th Sem",
  "division": "A",
  "deadline": "2025-04-15T23:59:00Z",
  "priority": "high",
  "tags": ["networking", "tcp"],
  "assignedTo": ["student_id_1", "student_id_2"]
}
```

### 5.3 Submission Routes (`/api/submissions`)

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| PUT | `/submit/:assignmentId` | Yes | student | Submit assignment with text + optional file (multipart/form-data). Auto-detects late status. |
| GET | `/my` | Yes | student | Get own submissions (populated with assignment details). |
| GET | `/assignment/:assignmentId` | Yes | teacher, mentor, admin | Get all submissions for an assignment (populated with student info). |
| PUT | `/evaluate/:submissionId` | Yes | teacher, mentor, admin | Evaluate submission: save marks, maxMarks, feedback. Sets status to `'evaluated'`. |
| GET | `/file/:filename` | Yes | all | Preview uploaded file in browser (inline). |
| GET | `/download/:filename` | Yes | all | Download uploaded file as attachment. |
| GET | `/export` | Yes | teacher, mentor, admin | Export submissions as CSV (`?assignmentId=...`). Includes student details, marks, feedback. |

### 5.4 Admin Routes (`/api/admin`)

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/pending` | Yes | admin | List all unapproved users (passwords excluded). |
| PUT | `/approve/:id` | Yes | admin | Approve a user. |
| GET | `/users` | Yes | admin | List all users (passwords excluded). |
| DELETE | `/user/:id` | Yes | admin | Delete a user. |
| PUT | `/role/:id` | Yes | admin | Change user role (`{ role: "student|teacher|mentor|admin" }`). |

### 5.5 Mentor Routes (`/api/mentor`)

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/students` | Yes | mentor | List students where `mentorId` matches the logged-in mentor. |
| PUT | `/assign` | Yes | admin | Assign mentor to student (`{ studentId, mentorId }`). |

### 5.6 Analytics Routes (`/api/analytics`)

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/assignment/:assignmentId` | Yes | teacher, mentor, admin | Stats: total, submitted, late, evaluated, pending + marks data array. |
| GET | `/teacher` | Yes | teacher, mentor, admin | Overview of all assignments by the user: per-assignment total/submitted/pending. |
| GET | `/timeline/:assignmentId` | Yes | teacher, mentor, admin | Submission timeline sorted by submission time, showing student name, time, status, late flag. |

### 5.7 Leaderboard Routes (`/api/leaderboard`)

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/` | Yes | all | Top students ranked by `score = 60% * avgMarks + 40% * submitRate`. Returns rank, student info, avgMarks, submitRate, onTime count, total, submitted, score. |

### 5.8 Announcement Routes (`/api/announcements`)

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| POST | `/` | Yes | teacher, mentor, admin | Create announcement (`{ title, message, targetRole, pinned }`). |
| GET | `/` | Yes | all | List announcements filtered by user's role (or `'all'`). Sorted by pinned then newest. |
| DELETE | `/:id` | Yes | owner or admin | Delete announcement. |
| PUT | `/pin/:id` | Yes | admin | Toggle pin status (`{ pinned: true/false }`). |

### 5.9 Health Check

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api` | No | Returns `{ message: "AssignMate API v2.0 ✅" }` |

### 5.10 Static Files

| Path | Description |
|---|---|
| `/uploads/:filename` | Serves uploaded files statically (preview). |
| `/` (or any frontend path) | Serves static files from `../frontend/` directory. |

---

## 6. Authentication & Middleware

### Auth Middleware (`middleware/auth.js`)

1. Extracts token from `Authorization: Bearer <token>` header.
2. Verifies using `jsonwebtoken.verify(token, JWT_SECRET)`.
3. If valid, attaches `decoded` payload to `req.user` (contains `{ id, role, name, isMentor }`).
4. Returns `401` if missing or invalid token.

### JWT Payload
```json
{
  "id": "user_object_id",
  "role": "student|teacher|mentor|admin",
  "name": "John Doe",
  "isMentor": false,
  "iat": 1234567890,
  "exp": 1234567890
}
```
- **Expires in:** 7 days

### Error Handler (Global)
All uncaught errors return `{ message: <error message> }` with HTTP 500.

---

## 7. Frontend Pages

### 7.1 index.html — Login & Registration

**Route:** `index.html` (root)

**Features:**
- Dark mode toggle (persisted in `localStorage`)
- Tab switcher: Login / Register
- **Login form:** Email + Password, "Remember me" checkbox, "Forgot password" link
- **Register form:** First/Last name, Email, Password + Confirm, Role dropdown
  - **If Student selected:** Shows USN, Class, Division, Parent Phone fields
  - **If Teacher selected:** Shows Subject field
  - **All:** Phone number, Terms & Conditions checkbox
- Login redirects based on role:
  - admin → `admin.html`
  - teacher → `teacher.html`
  - student → `student.html`
  - mentor → `mentor.html`
- API calls to `https://assignmate-student-assignment-tracker.onrender.com/api/auth/login` and `/register`

### 7.2 student.html — Student Dashboard

**Sections (nav):**
1. **Dashboard** — Stats cards (Total, Pending, Submitted), Overall Progress bar, Upcoming Deadlines list, WhatsApp alert toggle
2. **Assignments** — All assignments grouped: pending first (sorted by deadline), then done. Each card shows subject, title, description, deadline status. Pending cards have: textarea for answer, file drop zone, submit button, WhatsApp alert button (for urgent/overdue)
3. **Submitted** — All submitted work with status badges, mentor feedback box (marks + feedback text), file download links
4. **Calendar** — Monthly calendar view with color-coded deadline days: 🟣 Pending, 🟡 Urgent (≤3 days), 🔴 Overdue, 🟢 Submitted. Month navigation buttons, "today" highlight
5. **Notices** — Announcements from teachers/admin with pin indicator

**Auth guard:** Redirects to correct dashboard if wrong role, checks JWT expiry, redirects to login if no token.

**WhatsApp integration:**
- Toggle for WhatsApp alerts (stored in `localStorage`)
- Alert button on each pending urgent/overdue card opens `wa.me` with pre-filled message
- Dashboard shows toast if alerts enabled and assignments need attention

### 7.3 teacher.html — Teacher Dashboard

**CDN:** Chart.js (analytics)

**Sections (nav):**
1. **Create Assignment** — Form with: Title, Subject, Description, Deadline (datetime-local), Max Marks, Student selector (chips — click to toggle selection). Creates assignment via API.
2. **My Assignments** — Grid of assignment cards showing subject, title, description, deadline, number of assigned students
3. **Submissions** — Assignment selector dropdown, Export CSV button, list of submissions per student with:
   - Student name/email, status badge
   - Submitted text displayed in box
   - File link if uploaded
   - Grade/Feedback input fields with Save button
4. **Analytics** — Two Chart.js charts:
   - Doughnut chart: Submitted / Pending / Late distribution
   - Bar chart: Submitted count per assignment
5. **Leaderboard** — Table with Rank (🥇🥈🥉 for top 3), Student name/USN, Avg Marks, Submit Rate, Score
6. **Announcements** — Create form (title, message, target audience: Everyone/Students/Mentors) + list of existing announcements

### 7.4 mentor.html — Mentor Dashboard

**CDN:** Chart.js

**Sections (nav):**
1. **My Students** — Grid of student cards with avatar, name, email
2. **Give Feedback** — Assignment selector → shows submissions from students enrolled in mentor's assignment. Each submission has: text display, file link, marks input (number), feedback text input, Save button
3. **Leaderboard** — Same ranking table as teacher
4. **Notices** — Announcements list

### 7.5 admin.html — Admin Dashboard

**Sections (nav):**
1. **Pending Approvals** — Stats cards (Total Users, Pending, Approved, Students count). List of unapproved users with Approve/Delete buttons and role change dropdown per user. Pending count badge on sidebar.
2. **All Users** — Full user list with name/email, role badge, active/pending status badge, Delete button, role change dropdown + "Role" button
3. **Assign Mentor** — Two dropdowns (Student + Mentor), "Assign →" button, success message
4. **Announcements** — Create form (title, message, target audience, "Pin this announcement" checkbox) + list with Pin/Unpin and Delete buttons per announcement

### 7.6 dashboard.css

A dark-themed CSS file (early design, not used by the current set of HTML pages which have inline styles). Contains utility classes:
- Sidebar layout (260px fixed)
- Form inputs, buttons (primary/success/danger), badges, cards
- Progress bars, file drops, chips, toasts, skeleton loaders, empty states
- Custom scrollbar styling

---

## 8. Roles & Permissions Matrix

| Feature | Student | Teacher | Mentor | Admin |
|---|---|---|---|---|
| View own assignments | ✅ (assigned) | ✅ (own created) | ✅ (own created) | ✅ (all) |
| Create assignments | ❌ | ✅ | ✅ | ✅ |
| Submit assignment (text/file) | ✅ | ❌ | ❌ | ❌ |
| Evaluate submissions | ❌ | ✅ | ✅ | ✅ |
| Export CSV | ❌ | ✅ | ✅ | ✅ |
| View analytics | ❌ | ✅ | ✅ | ✅ |
| View leaderboard | ✅ | ✅ | ✅ | ✅ |
| Approve users | ❌ | ❌ | ❌ | ✅ |
| Delete users | ❌ | ❌ | ❌ | ✅ |
| Change user roles | ❌ | ❌ | ❌ | ✅ |
| Assign mentor to student | ❌ | ❌ | ❌ | ✅ |
| Post announcements | ❌ | ✅ | ✅ | ✅ |
| Pin/unpin announcements | ❌ | ❌ | ❌ | ✅ |
| View own students (mentees) | ❌ | ❌ | ✅ | ✅ |
| View announcements | ✅ (filtered) | ✅ (filtered) | ✅ (filtered) | ✅ (all) |
| Upload files | ✅ | ❌ | ❌ | ❌ |
| Preview/download files | ✅ (own) | ✅ (all for assignment) | ✅ (all for assignment) | ✅ (all) |
| WhatsApp alerts | ✅ (opt-in toggle) | ❌ | ❌ | ❌ |
| Deadline calendar | ✅ | ❌ | ❌ | ❌ |

---

## 9. Features by Role

### Student Features
- Login/register with approval workflow
- Dark mode toggle on login page
- Dashboard with stats (total/pending/submitted), progress bar, upcoming deadlines
- View assignments with deadline status (normal/urgent/overdue)
- Submit text answers and/or file attachments
- Late submission auto-detection
- View submitted work with mentor feedback (marks & text)
- Monthly deadline calendar with color codes
- View notices/announcements (filtered by role)
- WhatsApp alert toggle — sends alerts for urgent/overdue assignments
- WhatsApp button on each urgent/overdue card to message teacher
- Session expiry check with auto-redirect

### Teacher Features
- Create assignments with student selection (chip UI), deadline, priority
- Auto-creation of pending submissions for all assigned students
- View all created assignments with student count
- Review submissions per assignment
- Evaluate submissions: grade (number) + feedback text
- Export submissions as CSV (includes student details, marks, feedback)
- Analytics dashboard:
  - Doughnut chart (submitted/pending/late)
  - Bar chart (submissions per assignment)
- Leaderboard view with score calculation
- Post announcements to students/mentors/everyone

### Mentor Features
- View assigned students (where mentorId matches)
- View teacher-created assignments
- Review submissions and provide marks + feedback
- Leaderboard view
- View notices/announcements

### Admin Features
- Stats dashboard (total users, pending, approved, students)
- View pending user registrations and approve/delete
- View all users with status badges
- Change user roles (student/teacher/mentor/admin)
- Assign mentors to students
- Full CRUD on announcements with pin/unpin capability
- Access all data across all roles

---

## 10. File Upload System

**Library:** multer ^2.1.1

**Configuration (`upload.js`):**
- **Storage:** Disk storage to `uploads/` directory (relative to backend)
- **Filename:** `{timestamp}-{random9digit}{ext}` (e.g. `1680123456789-987654321.pdf`)
- **Allowed file types:**
  - `.pdf`, `.doc`, `.docx`, `.png`, `.jpg`, `.jpeg`, `.zip`, `.txt`
- **File size limit:** 10 MB
- **Error handling:** Invalid file types return a multer error

**Access:**
- Preview: `GET /api/submissions/file/:filename` (inline via `res.sendFile`)
- Download: `GET /api/submissions/download/:filename` (attachment via `res.download`)
- Static: `/uploads/:filename` (Express static middleware)

**Storage:** Backend `uploads/` directory (gitignored, keeps only `.gitkeep`)

---

## 11. Hosted URL

The live deployment is at:

**https://assignmate-student-assignment-tracker.onrender.com**

All API calls in frontend JavaScript use:
```js
const API = 'https://assignmate-student-assignment-tracker.onrender.com/api';
```

---

## 12. Environment Variables

| Variable | Description | Default |
|---|---|---|
| `MONGO_URI` | MongoDB connection string | (required) |
| `JWT_SECRET` | Secret key for JWT signing | (required) |
| `PORT` | Server port | `5000` |

---

## 13. Running Locally

```powershell
# 1. Clone and navigate
cd D:\github\Assignmate-student_assignment_tracker

# 2. Install backend dependencies
cd backend
npm install

# 3. Create .env file
echo "MONGO_URI=your_mongodb_connection_string" > .env
echo "JWT_SECRET=your_jwt_secret" >> .env
echo "PORT=5000" >> .env

# 4. Start server
npm run dev    # with nodemon (auto-restart)
# or
npm start      # production

# 5. Open in browser
# http://localhost:5000 (serves frontend static files)
# http://localhost:5000/index.html (login page)
```

**Note:** The frontend HTML files point to the hosted Render URL. To use locally, replace `https://assignmate-student-assignment-tracker.onrender.com` with `http://localhost:5000` in all frontend `.html` files, or configure CORS accordingly.

---

> **Generated from full source code analysis — May 2026**
