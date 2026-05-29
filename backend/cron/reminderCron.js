const cron = require('node-cron');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const Reminder = require('../models/Reminder');
const { sendDueReminderEmail } = require('../services/emailService');

let isScheduled = false;

function startReminderCron() {
  if (isScheduled) return;
  isScheduled = true;

  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Checking assignments due within 24 hours...');

    try {
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const assignments = await Assignment.find({
        deadline: { $gte: now, $lte: in24h }
      });

      if (assignments.length === 0) {
        console.log('⏰ No assignments due within 24 hours.');
        return;
      }

      console.log(`⏰ Found ${assignments.length} assignment(s) due soon.`);

      for (const assignment of assignments) {
        for (const studentId of assignment.assignedTo) {
          try {
            await Reminder.create({ assignmentId: assignment._id, studentId });

            const student = await User.findById(studentId).select('name email');
            if (!student || !student.email) continue;

            await sendDueReminderEmail(student, assignment);
          } catch (err) {
            if (err.code === 11000) continue;
            console.error(`❌ Reminder error for assignment ${assignment._id}, student ${studentId}:`, err.message);
          }
        }
      }
    } catch (err) {
      console.error('❌ Reminder cron error:', err.message);
    }
  });

  console.log('⏰ Reminder cron scheduled: every hour at minute 0');
}

module.exports = startReminderCron;
