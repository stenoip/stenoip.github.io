const express = require('express');
const nodemailer = require('nodemailer');
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse incoming JSON data
app.use(express.json());

// Route to handle email sending
app.post('/send-email', async (req, res) => {
  const { fromEmail, fromPassword, toEmail, subject, message } = req.body;

  // Validate that all required fields are provided
  if (!fromEmail || !fromPassword || !toEmail || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    // Create the transporter using the user's provided email and password
    const transporter = nodemailer.createTransport({
      service: 'gmail',  // Using Gmail as an example; modify as needed
      auth: {
        user: fromEmail,    // The sender's email (from the form)
        pass: fromPassword  // The sender's email password (from the form)
      }
    });

    // Set up email options
    const mailOptions = {
      from: fromEmail,   // Sender's email
      to: toEmail,       // Recipient's email
      subject: subject,  // Email subject
      text: message      // Email body
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Respond to the client
    return res.status(200).json({ message: '✅ Email sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: '❌ Failed to send email: ' + error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
