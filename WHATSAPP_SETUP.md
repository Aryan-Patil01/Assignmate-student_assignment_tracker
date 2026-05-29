# WhatsApp Notification Setup (Twilio Sandbox)

AssignMate uses the **Twilio WhatsApp Sandbox** to send real WhatsApp messages for:

- Login notifications
- Announcement broadcasts

---

## Environment Variables

Add these to `backend/.env`:

```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

| Variable | Description |
|---|---|
| `TWILIO_ACCOUNT_SID` | Found in your Twilio Console dashboard |
| `TWILIO_AUTH_TOKEN` | Found in your Twilio Console dashboard |
| `TWILIO_WHATSAPP_NUMBER` | The Sandbox number (e.g. `whatsapp:+14155238886`) |

---

## Twilio Sandbox Setup

1. **Create a Twilio account** at https://www.twilio.com/try-twilio

2. **Go to the WhatsApp Sandbox:**
   - Login to Twilio Console
   - Navigate to: **Messaging > Try it Out > Send a WhatsApp Message**
   - Or visit: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp

3. **Your Sandbox credentials will show:**
   - Sandbox Number (e.g. `+1 415 523 8886`)
   - Join Code (e.g. `join something-here`)

4. **Set the Sandbox number** in your `.env` file:
   ```
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ```

---

## How Students Join the Sandbox

To receive WhatsApp messages, each student must opt in:

1. Open WhatsApp on their phone
2. Send the join code message to the Sandbox number:
   ```
   join <code>
   ```
   Example: `join percent-bet`

3. They will receive a confirmation reply from Twilio

4. Now AssignMate can send them WhatsApp notifications

> ⚠️ **Important:** Twilio Sandbox only allows sending messages to numbers that have joined the Sandbox. In production, you would request WhatsApp Business API approval.

---

## Testing the Integration

### 1. Run the test script

```bash
cd backend
npm run whatsapp-test +919876543210
```

Replace `+919876543210` with a phone number that has joined the Sandbox.

### 2. Expected output

```
📤 Sending test WhatsApp to +919876543210...
✅ WhatsApp sent to whatsapp:+919876543210 — SID: SMxxxxxxxxxxxx
✅ Test WhatsApp sent successfully!
```

### 3. Verify in Twilio Console

Check the logs at: **Twilio Console > Monitor > Logs > Messages**

---

## How It Works

### Login Notifications

When any user logs in successfully, `sendLoginNotification(user)` is called:

```
Hello John Doe,
You have successfully logged into AssignMate.
```

- The login still succeeds even if the WhatsApp fails
- Errors are logged to the console only

### Announcement Notifications

When a teacher, mentor, or admin creates an announcement, `sendAnnouncementNotification(users, announcement)` is called:

```
📢 New Announcement

Title: Assignment Deadline Extended

The deadline for the TCP/IP assignment has been extended to Friday.
```

- All approved users matching the `targetRole` are fetched
- Messages are sent in parallel using `Promise.allSettled()`
- The announcement creation is never blocked by WhatsApp failures
- Failed numbers are logged

---

## Code Structure

```
backend/
├── services/
│   └── whatsappService.js     # Low-level Twilio send function
├── helpers/
│   └── notifications.js       # sendLoginNotification / sendAnnouncementNotification
├── routes/
│   ├── auth.js                # Calls sendLoginNotification on login
│   └── announcements.js       # Calls sendAnnouncementNotification after creation
├── tests/
│   └── whatsapp-test.js       # CLI test script
└── .env                       # Twilio credentials
```

---

## Troubleshooting

| Problem | Likely Fix |
|---|---|
| `Twilio not configured` warning | Check `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` in `.env` |
| `403` / `not authorized` | The recipient hasn't joined the Sandbox. Send them the join code. |
| `63016` error (sandbox number) | You can only send to numbers that have joined your Sandbox |
| `Invalid phone number` | Ensure the phone includes country code (e.g., `+919876543210`) |
| No WhatsApp received | Check Twilio Console > Monitor > Logs > Messages for delivery status |

### Common Twilio Error Codes

| Code | Meaning |
|---|---|
| 63016 | Message from Sandbox can only be sent to participants who have joined |
| 21211 | Invalid 'To' phone number |
| 21608 | This number is not verified for sending SMS |
| 30003 | Carrier violation — message was rejected |

---

## Deployment Notes

- The `.env` file is **gitignored**. You must set the environment variables on your hosting platform.
- For **Render**, set them in: Dashboard > Your Service > Environment Variables
- For **Netlify** (serverless functions), set them in: Site settings > Environment variables
- For **Railway / Heroku**, use their respective env variable dashboards

### Production (Beyond Sandbox)

To move beyond the Sandbox:

1. Apply for **WhatsApp Business API** approval via Twilio
2. Get a dedicated **WhatsApp Business Sender** number
3. Update `TWILIO_WHATSAPP_NUMBER` to your approved number
4. Remove the Sandbox join requirement

---

## Rollback

To disable WhatsApp notifications without removing code:

1. Remove (or comment out) the three `TWILIO_*` variables from `.env`
2. The app will log `⚠️  Twilio not configured — skipping WhatsApp send`
3. All other functionality remains unaffected
