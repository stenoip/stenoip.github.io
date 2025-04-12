const express = require('express');
const nodemailer = require('nodemailer');
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Route to send email
app.post('/api/send-email', async (req, res) => {
  const { fromEmail, fromPassword, toEmail, subject, message } = req.body;

  // Validate required fields
  if (!fromEmail || !fromPassword || !toEmail || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Create transporter using user-provided email service
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Assuming Gmail. You could dynamically choose based on user input
      auth: {
        user: fromEmail,
        pass: fromPassword
      }
    });

    // Mail options
    const mailOptions = {
      from: fromEmail,  // Sender's email (from request)
      to: toEmail,      // Recipient's email
      subject: subject, // Email subject
      text: message     // Email message
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
