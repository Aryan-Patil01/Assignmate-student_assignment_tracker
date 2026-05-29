require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { sendWhatsApp } = require('../services/whatsappService');

async function runTest() {
  const phone = process.argv[2];

  if (!phone) {
    console.error('❌ Usage: node tests/whatsapp-test.js <phone-number>');
    console.error('   Example: node tests/whatsapp-test.js +919876543210');
    process.exit(1);
  }

  const testMessage = [
    '🔔 AssignMate WhatsApp Test',
    '',
    'If you receive this message,',
    'your Twilio WhatsApp integration is working correctly!',
    '',
    '— AssignMate Team',
  ].join('\n');

  console.log(`📤 Sending test WhatsApp to ${phone}...`);
  const result = await sendWhatsApp(phone, testMessage);

  if (result.success) {
    console.log(`✅ Test WhatsApp sent successfully!`);
    console.log(`   SID: ${result.sid}`);
    process.exit(0);
  } else {
    console.error(`❌ Test WhatsApp failed: ${result.reason}`);
    process.exit(1);
  }
}

runTest();
