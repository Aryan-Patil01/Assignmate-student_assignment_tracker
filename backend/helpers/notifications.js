const { sendWhatsApp } = require('../services/whatsappService');

async function sendLoginNotification(user) {
  const phone = user.phone || user.parentPhone;
  console.log("LOGIN USER:", user.email);
  console.log("RAW PHONE:", phone);
  if (!phone) {
    console.warn(`⚠️  No phone for user ${user.email} — skipping login WhatsApp`);
    return;
  }

  const message = [
    `Hello ${user.name},`,
    'You have successfully logged into AssignMate.',
  ].join('\n');

  return sendWhatsApp(phone, message);
}

async function sendAnnouncementNotification(users, announcement) {
  if (!users || users.length === 0) {
    console.warn('⚠️  No users provided for announcement notification');
    return [];
  }

  const message = [
    `📢 New Announcement`,
    ``,
    `Title: ${announcement.title}`,
    ``,
    `${announcement.message}`,
  ].join('\n');

  const results = await Promise.allSettled(
    users.map((user) => {
      const phone = user.phone || user.parentPhone;
      if (!phone) {
        console.warn(`⚠️  No phone for user ${user.email} — skipping announcement WhatsApp`);
        return Promise.resolve({ success: false, reason: 'No phone' });
      }
      return sendWhatsApp(phone, message);
    })
  );

  const failures = results
    .map((r, i) => (r.status === 'rejected' || (r.value && !r.value.success) ? users[i]?.email || i : null))
    .filter(Boolean);

  if (failures.length > 0) {
    console.warn(`⚠️  Announcement WhatsApp failed for ${failures.length} user(s):`, failures);
  }

  return results;
}

module.exports = { sendLoginNotification, sendAnnouncementNotification };
