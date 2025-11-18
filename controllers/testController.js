const { sendEmail, verifyEmailConfig } = require('../utils/emailService');

// @desc    Test email sending
// @route   POST /api/test/email
// @access  Public (for testing)
exports.testEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Check if email is configured
    const isConfigured = await verifyEmailConfig();
    if (!isConfigured) {
      return res.status(500).json({
        success: false,
        message: 'Email service is not configured. Please check your environment variables.',
        required: {
          EMAIL_HOST: process.env.EMAIL_HOST || 'Not set',
          EMAIL_PORT: process.env.EMAIL_PORT || 'Not set',
          EMAIL_USER: process.env.EMAIL_USER ? 'Set' : 'Not set',
          EMAIL_PASS: process.env.EMAIL_PASS ? 'Set' : 'Not set',
        },
      });
    }

    // Test email HTML template
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Email - MyLearnHub</title>
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
          .test-badge {
            display: inline-block;
            background-color: #28a745;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 14px;
            margin-bottom: 20px;
          }
          .content {
            margin-bottom: 30px;
          }
          .content p {
            margin-bottom: 15px;
            font-size: 16px;
          }
          .info-box {
            background-color: #e7f3ff;
            border-left: 4px solid #2196F3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .success-box {
            background-color: #d4edda;
            border-left: 4px solid #28a745;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📚 MyLearnHub</div>
            <div class="test-badge">TEST EMAIL</div>
          </div>
          
          <div class="content">
            <div class="success-box">
              <p><strong>✅ Email Service is Working!</strong></p>
              <p>This is a test email from MyLearnHub backend.</p>
            </div>
            
            <p>If you received this email, it means:</p>
            <ul>
              <li>✅ Nodemailer is properly configured</li>
              <li>✅ Email service connection is successful</li>
              <li>✅ SMTP settings are correct</li>
              <li>✅ Email sending functionality is working</li>
            </ul>
            
            <div class="info-box">
              <p><strong>Email Configuration Details:</strong></p>
              <p>Host: ${process.env.EMAIL_HOST || 'Not set'}</p>
              <p>Port: ${process.env.EMAIL_PORT || 'Not set'}</p>
              <p>From: ${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'Not set'}</p>
              <p>Sent at: ${new Date().toLocaleString()}</p>
            </div>
            
            <p>You can now use the email service for:</p>
            <ul>
              <li>Registration welcome emails</li>
              <li>Password reset emails</li>
              <li>Notification emails</li>
              <li>And more!</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>This is a test email sent from MyLearnHub Backend API</p>
            <p>&copy; ${new Date().getFullYear()} MyLearnHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Plain text version
    const textTemplate = `
TEST EMAIL - MyLearnHub

✅ Email Service is Working!

This is a test email from MyLearnHub backend.

If you received this email, it means:
- Nodemailer is properly configured
- Email service connection is successful
- SMTP settings are correct
- Email sending functionality is working

Email Configuration Details:
- Host: ${process.env.EMAIL_HOST || 'Not set'}
- Port: ${process.env.EMAIL_PORT || 'Not set'}
- From: ${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'Not set'}
- Sent at: ${new Date().toLocaleString()}

You can now use the email service for:
- Registration welcome emails
- Password reset emails
- Notification emails
- And more!

This is a test email sent from MyLearnHub Backend API
© ${new Date().getFullYear()} MyLearnHub. All rights reserved.
    `;

    // Send test email
    const result = await sendEmail({
      to: email,
      subject: 'Test Email - MyLearnHub Email Service ✅',
      html: htmlTemplate,
      text: textTemplate,
    });

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Test email sent successfully!',
        data: {
          to: email,
          messageId: result.messageId,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error || result.message,
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending test email',
      error: error.message,
    });
  }
};

// @desc    Check email configuration status
// @route   GET /api/test/email/config
// @access  Public (for testing)
exports.checkEmailConfig = async (req, res) => {
  try {
    const isConfigured = await verifyEmailConfig();

    res.status(200).json({
      success: true,
      configured: isConfigured,
      config: {
        EMAIL_HOST: process.env.EMAIL_HOST || 'Not set',
        EMAIL_PORT: process.env.EMAIL_PORT || 'Not set',
        EMAIL_USER: process.env.EMAIL_USER ? 'Set ✓' : 'Not set ✗',
        EMAIL_PASS: process.env.EMAIL_PASS ? 'Set ✓' : 'Not set ✗',
        EMAIL_FROM: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'Not set',
        FRONTEND_URL: process.env.FRONTEND_URL || 'Not set',
      },
      message: isConfigured
        ? 'Email service is properly configured'
        : 'Email service is not configured. Please check your environment variables.',
    });
  } catch (error) {
    console.error('Check email config error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking email configuration',
      error: error.message,
    });
  }
};
