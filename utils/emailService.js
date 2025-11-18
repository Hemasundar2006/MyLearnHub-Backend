const nodemailer = require('nodemailer');

// Create reusable transporter object
const createTransporter = () => {
  // Check if email configuration is provided
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send registration welcome email using nodemailer
 * @param {Object} userData - User data object
 * @param {string} userData.name - User's name
 * @param {string} userData.email - User's email
 * @returns {Promise<Object>} - Email send result
 */
const sendRegistrationEmail = async (userData) => {
  try {
    // Check configuration first
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ Email service not configured!');
      console.error('   Missing EMAIL_USER:', !process.env.EMAIL_USER);
      console.error('   Missing EMAIL_PASS:', !process.env.EMAIL_PASS);
      console.error('   EMAIL_HOST:', process.env.EMAIL_HOST || 'smtp.gmail.com (default)');
      console.error('   EMAIL_PORT:', process.env.EMAIL_PORT || '587 (default)');
      return { 
        success: false, 
        message: 'Email service not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.' 
      };
    }

    const transporter = createTransporter();

    // Check if email is configured
    if (!transporter) {
      console.error('❌ Failed to create email transporter');
      return { success: false, message: 'Failed to create email transporter' };
    }

    // Email HTML template
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to MyLearnHub</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
          }
          .welcome-message {
            font-size: 24px;
            color: #333;
            margin-bottom: 20px;
          }
          .content {
            margin-bottom: 30px;
          }
          .content p {
            margin-bottom: 15px;
            font-size: 16px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #667eea;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
          .button:hover {
            background-color: #5568d3;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .info-box {
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📚 MyLearnHub</div>
            <div class="welcome-message">Welcome, ${userData.name}!</div>
          </div>
          
          <div class="content">
            <p>Thank you for registering with MyLearnHub! We're excited to have you join our learning community.</p>
            
            <div class="info-box">
              <p><strong>Your Account Details:</strong></p>
              <p>Name: ${userData.name}</p>
              <p>Email: ${userData.email}</p>
            </div>
            
            <p>You can now:</p>
            <ul>
              <li>Explore our wide range of courses</li>
              <li>Submit thoughts and ideas</li>
              <li>Ask doubts and get answers</li>
              <li>Earn coins for your participation</li>
              <li>Track your learning progress</li>
            </ul>
            
            <p>Get started by logging into your account and exploring what we have to offer!</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'https://mylearnhub.com'}/login" class="button">Login to MyLearnHub</a>
            </div>
          </div>
          
          <div class="footer">
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>&copy; ${new Date().getFullYear()} MyLearnHub. All rights reserved.</p>
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Plain text version
    const textTemplate = `
Welcome to MyLearnHub!

Thank you for registering, ${userData.name}!

Your Account Details:
- Name: ${userData.name}
- Email: ${userData.email}

You can now:
- Explore our wide range of courses
- Submit thoughts and ideas
- Ask doubts and get answers
- Earn coins for your participation
- Track your learning progress

Get started by logging into your account: ${process.env.FRONTEND_URL || 'https://mylearnhub.com'}/login

If you have any questions, feel free to reach out to our support team.

© ${new Date().getFullYear()} MyLearnHub. All rights reserved.
    `;

    // Email options
    const mailOptions = {
      from: `"MyLearnHub" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: userData.email,
      subject: 'Welcome to MyLearnHub - Registration Successful! 🎉',
      text: textTemplate,
      html: htmlTemplate,
    };

    // Send email using nodemailer
    console.log(`📧 Attempting to send registration email to: ${userData.email}`);
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Registration email sent successfully:', info.messageId);
    console.log('   To:', userData.email);
    console.log('   Message ID:', info.messageId);
    return { 
      success: true, 
      messageId: info.messageId,
      message: 'Registration email sent successfully' 
    };
  } catch (error) {
    console.error('❌ Error sending registration email:', error.message);
    console.error('   Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
    return { 
      success: false, 
      error: error.message,
      errorCode: error.code,
      message: `Failed to send registration email: ${error.message}` 
    };
  }
};

/**
 * Send generic email using nodemailer
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content
 * @returns {Promise<Object>} - Email send result
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    // Check if email is configured
    if (!transporter) {
      console.warn('Email service not configured. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    const mailOptions = {
      from: options.from || `"MyLearnHub" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || '',
      html: options.html || options.text || '',
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.messageId);
    return { 
      success: true, 
      messageId: info.messageId,
      message: 'Email sent successfully' 
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error.message,
      message: 'Failed to send email' 
    };
  }
};

/**
 * Verify email configuration
 * @returns {Promise<boolean>} - True if email is configured
 */
const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      return false;
    }

    // Verify transporter configuration
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email configuration verification failed:', error);
    return false;
  }
};

module.exports = {
  sendRegistrationEmail,
  sendEmail,
  verifyEmailConfig,
};