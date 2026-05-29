require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function test() {
    try {
        const result = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: 'ritviksshinde16@gmail.com',
            subject: 'AssignMate Email Test',
            text: 'Nodemailer is working!'
        });

        console.log('SUCCESS');
        console.log(result.messageId);
    } catch (err) {
        console.error(err);
    }
}

test();