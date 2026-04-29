import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Email Utility
 * Uses Nodemailer with Gmail SMTP
 *
 * IMPORTANT: For production, consider using:
 * - SendGrid, Mailgun, or AWS SES for better deliverability
 * - Gmail has daily sending limits (500/day for regular, 2000/day for Workspace)
 */

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS // Use App Password, not regular password
    }
  });
};

/**
 * Send Verification Email
 * @param {string} email - Recipient email
 * @param {string} token - Verification token
 * @param {string} username - User's name
 */
export const sendVerificationEmail = async (email, token, username) => {
  try {
    const transporter = createTransporter();

    // Read and compile template
    const templatePath = path.join(__dirname, "../templates/verifyEmail.hbs");
    const templateSource = fs.readFileSync(templatePath, "utf-8");
    const template = handlebars.compile(templateSource);

    // Verification URL - using query param format for frontend route
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${encodeURIComponent(token)}`;

    const htmlContent = template({
      username: username || "User",
      verificationUrl,
      year: new Date().getFullYear()
    });

    const mailOptions = {
      from: `"ArtVPP" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Verify Your Email - ArtVPP",
      html: htmlContent,
      attachments: [
        {
          filename: 'logo.png',
          path: path.join(__dirname, '../../frontart/public/logo.png'),
          cid: 'logo'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    throw new Error("Failed to send verification email");
  }
};

/**
 * Send OTP for Password Reset
 * @param {string} email - Recipient email
 * @param {string} otp - One-time password
 * @param {string} username - User's name
 */
export const sendOtpEmail = async (email, otp, username, purpose = "password-reset") => {
  try {
    const transporter = createTransporter();

    // Choose template and subject based on purpose
    const isArtistVerification = purpose === "artist-verification";
    const templateFile = isArtistVerification ? "artistVerifyEmail.hbs" : "otpEmail.hbs";
    const subject = isArtistVerification
      ? "Verify Your Email - Artist Application - ArtVPP"
      : "Password Reset OTP - ArtVPP";

    // Read and compile template
    const templatePath = path.join(__dirname, "../templates/" + templateFile);
    const templateSource = fs.readFileSync(templatePath, "utf-8");
    const template = handlebars.compile(templateSource);

    const htmlContent = template({
      username: username || "User",
      otp,
      validMinutes: 10,
      year: new Date().getFullYear()
    });

    const mailOptions = {
      from: `"ArtVPP" <${process.env.MAIL_USER}>`,
      to: email,
      subject,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ OTP email sending failed:", error.message);
    throw new Error("Failed to send OTP email");
  }
};

/**
 * Send Welcome Email (after verification)
 * @param {string} email - Recipient email
 * @param {string} username - User's name
 */
export const sendArtistVerificationOtp = async (email, otp, username) => {
  try {
    const transporter = createTransporter();

    const templatePath = path.join(__dirname, "../templates/artistVerifyEmail.hbs");
    const templateSource = fs.readFileSync(templatePath, "utf-8");
    const template = handlebars.compile(templateSource);

    const htmlContent = template({
      username: username || "Artist",
      otp,
      validMinutes: 10,
      year: new Date().getFullYear()
    });

    const mailOptions = {
      from: `"ArtVPP" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Verify Your Email - Artist Application - ArtVPP",
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Artist verification OTP sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Artist verification OTP sending failed:", error.message);
    throw new Error("Failed to send artist verification OTP");
  }
};

/**
 * Send Welcome Email (after verification)
 * @param {string} email - Recipient email
 * @param {string} username - User's name
 */
export const sendWelcomeEmail = async (email, username) => {
  try {
    const transporter = createTransporter();

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to ArtVPP!</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'DM Sans', Arial, sans-serif; color: #1a1a1a;">
  <!-- Hidden preview text to prevent Gmail dots and clipping -->
  <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    Your account is verified successfully. Start exploring ArtVPP now.&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9f9f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Wrapper -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; width: 100%; margin: 0 auto; background: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);">
          <tr>
            <td>
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #c0396b 0%, #e8522a 48%, #f5a623 100%); padding: 44px 40px 0;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="48" valign="middle">
                      <img src="cid:logo" alt="ArtVPP" width="48" height="48" style="width: 48px; height: 48px; border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.3); display: block;" />
                    </td>
                    <td valign="middle" style="padding-left: 12px;">
                      <div style="font-family: 'Playfair Display', serif; font-size: 22px; color: #fff; line-height: 1;">
                        ArtVPP<br/>
                        <span style="font-family: 'DM Sans', sans-serif; font-weight: 300; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; opacity: 0.8; margin-top: 4px; display: inline-block;">Creative Studio</span>
                      </div>
                    </td>
                  </tr>
                </table>

                <div style="margin-top: 32px; padding-bottom: 52px;">
                  <div style="display: inline-block; background: rgba(255, 255, 255, 0.18); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 50px; padding: 6px 14px; font-size: 12px; font-weight: 500; color: #fff; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px;">
                    <span style="font-size: 14px;">🎉</span> Account Verified
                  </div>
                  <div style="font-family: 'Playfair Display', serif; font-size: 38px; color: #fff; line-height: 1.15; max-width: 360px;">
                    Welcome to<br />
                    <span style="background: rgba(255, 255, 255, 0.18); border-radius: 8px; padding: 2px 10px;">ArtVPP</span> ✦
                  </div>
                  <p style="margin: 12px 0 0 0; font-size: 15px; color: rgba(255, 255, 255, 0.8); font-weight: 300; line-height: 1.6; max-width: 320px;">Your creative journey starts right here, right now.</p>
                </div>
              </div>

              <svg viewBox="0 0 580 44" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="display: block; margin-top: -2px; width: 100%;">
                <path d="M0,0 C145,44 435,0 580,32 L580,0 Z" fill="url(#ww)" />
                <defs>
                  <linearGradient id="ww" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#c0396b" />
                    <stop offset="50%" style="stop-color:#e8522a" />
                    <stop offset="100%" style="stop-color:#f5a623" />
                  </linearGradient>
                </defs>
              </svg>

              <!-- Body -->
              <div style="padding: 36px 40px 40px;">
                <p style="font-size: 13px; color: #aaa; letter-spacing: 0.5px; text-transform: uppercase; margin: 0 0 4px 0;">Hey there,</p>
                <h2 style="font-family: 'Playfair Display', serif; font-size: 30px; color: #111; margin: 0 0 18px 0;">${username} 👋</h2>

                <p style="font-size: 15px; line-height: 1.8; color: #555; margin: 0 0 32px 0;">
                  Congratulations — your email has been verified and your <strong>ArtVPP</strong> account is fully active! You're now part of a vibrant community of artists, collectors, and art lovers. Here's everything waiting for you inside.
                </p>

                <table width="100%" cellpadding="0" cellspacing="0" style="background: #ecfdf5; border: 1.5px solid #6ee7b7; border-radius: 16px; margin-bottom: 32px;">
                  <tr>
                    <td width="48" valign="middle" style="padding: 18px 0 18px 22px;">
                      <div style="width: 48px; height: 48px; border-radius: 14px; background: #10b981; text-align: center; line-height: 48px; font-size: 22px; box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);">✅</div>
                    </td>
                    <td valign="middle" style="padding: 18px 22px 18px 16px;">
                      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #059669; margin-bottom: 4px; font-weight: 700;">Account Status</div>
                      <p style="font-size: 15px; font-weight: 500; color: #065f46; margin: 0;">Verified &amp; Fully Active</p>
                    </td>
                  </tr>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" style="background: #fff8f2; border: 1px solid #f0ddd0; border-radius: 16px; margin-bottom: 32px; table-layout: fixed;">
                  <tr>
                    <td style="width: 33.33%; padding: 20px 10px; text-align: center; border-right: 1px solid #f0ddd0;">
                      <div style="font-family: 'Playfair Display', serif; font-size: 26px; color: #c0396b; line-height: 1; margin-bottom: 4px;">500+</div>
                      <div style="font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Artworks</div>
                    </td>
                    <td style="width: 33.33%; padding: 20px 10px; text-align: center; border-right: 1px solid #f0ddd0;">
                      <div style="font-family: 'Playfair Display', serif; font-size: 26px; color: #c0396b; line-height: 1; margin-bottom: 4px;">120+</div>
                      <div style="font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Artists</div>
                    </td>
                    <td style="width: 33.33%; padding: 20px 10px; text-align: center;">
                      <div style="font-family: 'Playfair Display', serif; font-size: 26px; color: #c0396b; line-height: 1; margin-bottom: 4px;">1K+</div>
                      <div style="font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Happy Buyers</div>
                    </td>
                  </tr>
                </table>

                <p style="font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin: 0 0 16px 0;">✦ What you can do now</p>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 0; border-bottom: 1px solid #f5f5f5;">
                  <tr>
                    <td width="42" valign="top" style="padding: 16px 16px 16px 0;">
                      <div style="background:#fff5f0; width: 42px; height: 42px; border-radius: 12px; text-align: center; line-height: 42px; font-size: 20px;">🖼️</div>
                    </td>
                    <td valign="top" style="padding: 16px 0;">
                      <div style="font-size: 14px; font-weight: 600; color: #222; margin-bottom: 4px;">Discover Student Artworks</div>
                      <p style="font-size: 13px; color: #777; line-height: 1.6; margin: 0;">Browse a curated collection of original pieces crafted by talented student artists.</p>
                    </td>
                  </tr>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 0; border-bottom: 1px solid #f5f5f5;">
                  <tr>
                    <td width="42" valign="top" style="padding: 16px 16px 16px 0;">
                      <div style="background:#f0fff8; width: 42px; height: 42px; border-radius: 12px; text-align: center; line-height: 42px; font-size: 20px;">🛒</div>
                    </td>
                    <td valign="top" style="padding: 16px 0;">
                      <div style="font-size: 14px; font-weight: 600; color: #222; margin-bottom: 4px;">Shop &amp; Collect</div>
                      <p style="font-size: 13px; color: #777; line-height: 1.6; margin: 0;">Add your favorite pieces to your cart and own one-of-a-kind artworks.</p>
                    </td>
                  </tr>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 0; border-bottom: 1px solid #f5f5f5;">
                  <tr>
                    <td width="42" valign="top" style="padding: 16px 16px 16px 0;">
                      <div style="background:#f5f0ff; width: 42px; height: 42px; border-radius: 12px; text-align: center; line-height: 42px; font-size: 20px;">❤️</div>
                    </td>
                    <td valign="top" style="padding: 16px 0;">
                      <div style="font-size: 14px; font-weight: 600; color: #222; margin-bottom: 4px;">Save Your Favourites</div>
                      <p style="font-size: 13px; color: #777; line-height: 1.6; margin: 0;">Like and bookmark artworks to build your personal collection.</p>
                    </td>
                  </tr>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                  <tr>
                    <td width="42" valign="top" style="padding: 16px 16px 16px 0;">
                      <div style="background:#fff8f0; width: 42px; height: 42px; border-radius: 12px; text-align: center; line-height: 42px; font-size: 20px;">🔔</div>
                    </td>
                    <td valign="top" style="padding: 16px 0;">
                      <div style="font-size: 14px; font-weight: 600; color: #222; margin-bottom: 4px;">Stay in the Loop</div>
                      <p style="font-size: 13px; color: #777; line-height: 1.6; margin: 0;">Get notified when new artworks drop or your orders ship.</p>
                    </td>
                  </tr>
                </table>

                <!-- Become an artist strip -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background: #2d1b33; border-radius: 16px; margin-bottom: 32px;">
                  <tr>
                    <td valign="middle" style="padding: 24px 16px 24px 24px;">
                      <div style="font-family: 'Playfair Display', serif; font-size: 18px; color: #fff; margin-bottom: 6px; font-weight: bold;">Are you an artist? 🎨</div>
                      <p style="font-size: 13px; color: rgba(255, 255, 255, 0.7); line-height: 1.5; margin: 0;">Apply to sell your creations on ArtVPP and reach thousands of art lovers.</p>
                    </td>
                    <td width="120" valign="middle" align="center" style="padding: 24px 24px 24px 0;">
                      <a href="${process.env.CLIENT_URL}/sell" style="display: inline-block; background: #e8522a; color: #fff; text-decoration: none; font-size: 13px; font-weight: 500; padding: 11px 22px; border-radius: 50px; white-space: nowrap;">Apply Now →</a>
                    </td>
                  </tr>
                </table>

                <!-- Quick tips -->
                <div style="background: #fafafa; border-radius: 16px; padding: 22px; margin-bottom: 32px; border: 1px solid #f0f0f0;">
                  <div style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 14px;">💡 Quick tips to get started</div>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                    <tr>
                      <td width="16" valign="top" style="color: #c0396b; font-size: 18px; line-height: 1;">&bull;</td>
                      <td style="font-size: 13px; color: #666; line-height: 1.6; padding-left: 4px;">Complete your profile so artists and buyers can recognise you.</td>
                    </tr>
                  </table>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                    <tr>
                      <td width="16" valign="top" style="color: #e8522a; font-size: 18px; line-height: 1;">&bull;</td>
                      <td style="font-size: 13px; color: #666; line-height: 1.6; padding-left: 4px;">Use filters on the explore page to find art by style, medium, or price range.</td>
                    </tr>
                  </table>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                    <tr>
                      <td width="16" valign="top" style="color: #f5a623; font-size: 18px; line-height: 1;">&bull;</td>
                      <td style="font-size: 13px; color: #666; line-height: 1.6; padding-left: 4px;">Follow your favourite artists to see their new drops first.</td>
                    </tr>
                  </table>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="16" valign="top" style="color: #c0396b; font-size: 18px; line-height: 1;">&bull;</td>
                      <td style="font-size: 13px; color: #666; line-height: 1.6; padding-left: 4px;">Share artworks you love with friends — help students get discovered!</td>
                    </tr>
                  </table>
                </div>

                <!-- CTA -->
                <div style="text-align: center; margin-bottom: 10px;">
                  <a href="${process.env.CLIENT_URL}" style="display: inline-block; background: #c0396b; color: #fff; text-decoration: none; font-size: 16px; font-weight: 500; letter-spacing: 0.4px; padding: 17px 52px; border-radius: 50px;">✦ Start Exploring ArtVPP</a>
                </div>
                <p style="text-align: center; font-size: 13px; color: #bbb; margin: 0 0 28px 0;">Your next favourite artwork is just one click away.</p>

                <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 0 0 24px;" />

                <div style="font-size: 14px; color: #666; line-height: 1.8;">
                  With creativity &amp; warmth,
                  <div style="font-family: 'Playfair Display', serif; font-size: 19px; color: #111; margin-top: 4px; font-weight: bold;">Team ArtVPP 🎨</div>
                </div>
              </div>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; width: 100%; margin: 0 auto; text-align: center; margin-top: 28px;">
          <tr>
            <td>
              <p style="font-size: 12px; color: #555; margin: 0;">© ${new Date().getFullYear()} ArtVPP · All rights reserved</p>
              <p style="font-size: 12px; color: #555; margin: 6px 0 0 0;">
                <a href="#" style="color: #f5a623; text-decoration: none;">Unsubscribe</a> &nbsp;·&nbsp;
                <a href="#" style="color: #f5a623; text-decoration: none;">Privacy Policy</a> &nbsp;·&nbsp;
                <a href="#" style="color: #f5a623; text-decoration: none;">Help Center</a>
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

    const mailOptions = {
      from: `"ArtVPP" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Welcome to ArtVPP! 🎨",
      html: htmlContent,
      attachments: [
        {
          filename: 'logo.png',
          path: path.join(__dirname, '../../frontart/public/logo.png'),
          cid: 'logo'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Welcome email sending failed:", error.message);
    // Don't throw - welcome email is not critical
    return false;
  }
};

/**
 * Send Artist Request Status Email
 * @param {string} email - Recipient email
 * @param {string} username - User's name
 * @param {string} status - 'approved' or 'rejected'
 * @param {string} reason - Rejection reason (if rejected)
 */
export const sendArtistStatusEmail = async (email, username, status, reason = null) => {
  try {
    const transporter = createTransporter();

    const isApproved = status === "approved";
    const subject = isApproved
      ? "🎉 Your Artist Application is Approved!"
      : "Artist Application Update";

    const htmlContent = isApproved
      ? `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #00a63d;">Congratulations! 🎨</h2>
                    <p>Hi ${username},</p>
                    <p>Great news! Your artist application has been <strong>approved</strong>!</p>
                    <p>You can now:</p>
                    <ul>
                        <li>Upload your artworks</li>
                        <li>Set prices and manage inventory</li>
                        <li>Receive orders from buyers</li>
                    </ul>
                    <a href="${process.env.CLIENT_URL}/dashboard/artist" 
                       style="display: inline-block; padding: 12px 24px; background-color: #00a63d; 
                              color: white; text-decoration: none; border-radius: 5px;">
                        Go to Artist Dashboard
                    </a>
                </div>
            `
      : `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #e53e3e;">Application Not Approved</h2>
                    <p>Hi ${username},</p>
                    <p>We've reviewed your artist application, and unfortunately we're unable to approve it at this time.</p>
                    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
                    <p>You can apply again after addressing the feedback. If you have questions, please contact support.</p>
                </div>
            `;

    const mailOptions = {
      from: `"ArtVPP" <${process.env.MAIL_USER}>`,
      to: email,
      subject,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Artist status email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Artist status email sending failed:", error.message);
    return false;
  }
};

/**
 * Send Artist Action Email (product/profile updates)
 * @param {string} email - Recipient email
 * @param {string} username - User's name
 * @param {string} status - 'approved' or 'rejected'
 * @param {string} actionType - Type of action
 * @param {string} message - Custom message or reason
 */
export const sendArtistActionEmail = async (email, username, status, actionType, message = null) => {
  try {
    const transporter = createTransporter();

    const isApproved = status === "approved";

    const actionLabels = {
      create_product: "Product Submission",
      edit_product: "Product Edit Request",
      delete_product: "Product Deletion Request",
      edit_profile: "Profile Update Request"
    };

    const actionLabel = actionLabels[actionType] || "Request";

    const subject = isApproved
      ? `✅ ${actionLabel} Approved - ArtVPP`
      : `❌ ${actionLabel} Not Approved - ArtVPP`;

    const htmlContent = isApproved
      ? `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Request Approved – ArtVPP</title>
  <link
    href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap"
    rel="stylesheet" />
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      background: #0f0f0f;
      font-family: 'DM Sans', Arial, sans-serif;
      color: #1a1a1a;
      padding: 40px 16px;
    }

    .wrapper {
      max-width: 580px;
      margin: 0 auto;
    }

    /* ── Card ── */
    .card {
      background: #ffffff;
      border-radius: 28px;
      overflow: hidden;
      box-shadow: 0 48px 96px rgba(0, 0, 0, 0.5);
    }

    /* ── Header ── */
    .header {
      background: linear-gradient(135deg, #c0396b 0%, #e8522a 48%, #f5a623 100%);
      padding: 44px 40px 0;
      position: relative;
      overflow: hidden;
    }

    .header::before {
      content: '';
      position: absolute;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.07);
      top: -100px;
      right: -80px;
    }

    .header::after {
      content: '';
      position: absolute;
      width: 160px;
      height: 160px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
      bottom: 30px;
      left: -50px;
    }

    .logo-row {
      display: flex;
      align-items: center;
      gap: 12px;
      position: relative;
      z-index: 1;
    }

    .logo-badge {
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      object-fit: cover;
    }

    .logo-name {
      font-family: 'Playfair Display', serif;
      font-size: 22px;
      color: #fff;
      letter-spacing: -0.3px;
    }

    .logo-name span {
      display: block;
      font-family: 'DM Sans', sans-serif;
      font-weight: 300;
      font-size: 11px;
      letter-spacing: 3px;
      text-transform: uppercase;
      opacity: 0.8;
      margin-top: 1px;
    }

    .header-hero {
      position: relative;
      z-index: 1;
      margin-top: 32px;
      padding-bottom: 52px;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: rgba(255, 255, 255, 0.18);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 50px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 500;
      color: #fff;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 16px;
    }

    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #7fffd4;
      box-shadow: 0 0 6px #7fffd4;
    }

    .header-title {
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      color: #fff;
      line-height: 1.15;
      max-width: 340px;
    }

    /* Wave */
    .wave {
      display: block;
      margin-top: -2px;
      width: 100%;
    }

    /* ── Body ── */
    .body {
      padding: 36px 40px 40px;
    }

    .greeting {
      font-size: 13px;
      font-weight: 400;
      color: #aaa;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
      text-transform: uppercase;
    }

    .username {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      color: #111;
      margin-bottom: 18px;
    }

    .intro {
      font-size: 15px;
      line-height: 1.8;
      color: #555;
      margin-bottom: 28px;
    }

    /* Action label chip */
    .action-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #fff5f0, #fff0f5);
      border: 1px solid #f5c6b0;
      border-radius: 10px;
      padding: 10px 16px;
      margin-bottom: 28px;
    }

    .action-chip-icon {
      font-size: 18px;
    }

    .action-chip-text {
      font-size: 13px;
      font-weight: 500;
      color: #c0396b;
      letter-spacing: 0.3px;
    }

    /* Status banner */
    .status-banner {
      background: linear-gradient(135deg, #f0fdf6, #ecfdf5);
      border: 1.5px solid #6ee7b7;
      border-radius: 16px;
      padding: 20px 22px;
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 28px;
    }

    .status-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: linear-gradient(135deg, #10b981, #059669);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
    }

    .status-content strong {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #059669;
      margin-bottom: 4px;
    }

    .status-content p {
      font-size: 15px;
      font-weight: 500;
      color: #065f46;
    }

    /* Message box */
    .message-box {
      background: #fafafa;
      border-left: 3px solid #e8522a;
      border-radius: 0 12px 12px 0;
      padding: 16px 18px;
      margin-bottom: 28px;
      font-size: 14px;
      line-height: 1.75;
      color: #444;
      font-style: italic;
    }

    /* Next steps */
    .section-label {
      font-size: 13px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #888;
      margin-bottom: 16px;
    }

    .steps {
      margin-bottom: 32px;
    }

    .step {
      display: flex;
      gap: 14px;
      padding: 14px 0;
      border-bottom: 1px solid #f5f5f5;
    }

    .step:last-child {
      border-bottom: none;
    }

    .step-num {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #c0396b, #e8522a);
      color: #fff;
      font-size: 12px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .step-body strong {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #222;
      margin-bottom: 3px;
    }

    .step-body p {
      font-size: 13px;
      color: #777;
      line-height: 1.6;
    }

    /* CTA */
    .cta-wrap {
      text-align: center;
      margin-bottom: 30px;
    }

    .cta-btn {
      display: inline-block;
      background: linear-gradient(135deg, #c0396b 0%, #e8522a 55%, #f5a623 100%);
      color: #fff !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 500;
      letter-spacing: 0.4px;
      padding: 16px 48px;
      border-radius: 50px;
      box-shadow: 0 14px 36px rgba(232, 82, 42, 0.35);
    }

    /* Divider */
    .sep {
      border: none;
      border-top: 1px solid #f0f0f0;
      margin: 0 0 24px;
    }

    .signoff {
      font-size: 14px;
      color: #666;
      line-height: 1.8;
    }

    .signoff strong {
      display: block;
      font-family: 'Playfair Display', serif;
      font-size: 19px;
      color: #111;
      margin-top: 4px;
    }

    /* Footer */
    .footer {
      text-align: center;
      margin-top: 28px;
      font-size: 12px;
      color: #555;
    }

    .footer a {
      color: #f5a623;
      text-decoration: none;
    }

    .paint-dots {
      display: flex;
      justify-content: center;
      gap: 6px;
      margin-top: 14px;
    }

    .paint-dots span {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      opacity: 0.55;
    }
  </style>
</head>

<body>
  <!-- Hidden preview text for email clients -->
  <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    Great news! Your recent submission has been successfully approved and is now live on ArtVPP.
  </div>
  <div class="wrapper">
    <div class="card">

      <!-- Header -->
      <div class="header">
        <div class="logo-row">
          <img src="cid:logo" alt="ArtVPP" class="logo-badge" onerror="this.style.display='none'" />
          <div class="logo-name">
            ArtVPP
            <span>Creative Studio</span>
          </div>
        </div>
        <div class="header-hero">
          <div class="status-pill">
            <span class="status-dot"></span>
            Approved
          </div>
          <div class="header-title">Your submission<br />has been approved ✦</div>
        </div>
      </div>

      <!-- Wave divider -->
      <svg class="wave" viewBox="0 0 580 44" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path d="M0,0 C145,44 435,0 580,32 L580,0 Z" fill="url(#wg)" />
        <defs>
          <linearGradient id="wg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#c0396b" />
            <stop offset="50%" style="stop-color:#e8522a" />
            <stop offset="100%" style="stop-color:#f5a623" />
          </linearGradient>
        </defs>
      </svg>

      <!-- Body -->
      <div class="body">

        <p class="greeting">Great news,</p>
        <h2 class="username">\${username} 🎉</h2>

        <p class="intro">
          We've carefully reviewed your recent submission on <strong>ArtVPP</strong>
          and we're excited to let you know it has been <strong>approved</strong> and
          is now live on the platform for the world to discover!
        </p>

        <!-- Action chip -->
        <div class="action-chip">
          <span class="action-chip-icon">🖼️</span>
          <span class="action-chip-text">\${actionLabel}</span>
        </div>

        <!-- Status banner -->
        <div class="status-banner">
          <div class="status-icon">✅</div>
          <div class="status-content">
            <strong>Status</strong>
            <p>Approved &amp; Live on ArtVPP</p>
          </div>
        </div>

        \${message ? \`<div class="message-box">💬 \${message}</div>\` : ""}

        <!-- Next steps -->
        <p class="section-label">What's next for you</p>
        <div class="steps">
          <div class="step">
            <div class="step-num">1</div>
            <div class="step-body">
              <strong>Share your work</strong>
              <p>Post your newly approved listing on social media to drive traffic to your portfolio.</p>
            </div>
          </div>
          <div class="step">
            <div class="step-num">2</div>
            <div class="step-body">
              <strong>Polish your profile</strong>
              <p>Keep your artist bio and links up to date — buyers love learning the story behind the art.</p>
            </div>
          </div>
          <div class="step">
            <div class="step-num">3</div>
            <div class="step-body">
              <strong>Track your analytics</strong>
              <p>Monitor views, likes, and inquiries from your dashboard to understand your audience.</p>
            </div>
          </div>
        </div>

        <!-- CTA -->
        <div class="cta-wrap">
          <a href="\${process.env.CLIENT_URL}/dashboard/artist" class="cta-btn">✦ Go to My Dashboard</a>
        </div>

        <hr class="sep" />

        <div class="signoff">
          Excited for your creative journey,
          <strong>Team ArtVPP 🎨</strong>
        </div>

      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>© \${new Date().getFullYear()} ArtVPP · All rights reserved</p>
      <p style="margin-top:6px;">
        <a href="#">Unsubscribe</a> &nbsp;·&nbsp;
        <a href="#">Privacy Policy</a> &nbsp;·&nbsp;
        <a href="#">Help Center</a>
      </p>
      <div class="paint-dots">
        <span style="background:#c0396b;"></span>
        <span style="background:#e8522a;"></span>
        <span style="background:#f5a623;"></span>
        <span style="background:#9b59b6;"></span>
        <span style="background:#3498db;"></span>
      </div>
    </div>
  </div>
</body>

</html>
`
      : `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Request Not Approved – ArtVPP</title>
  <link
    href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap"
    rel="stylesheet" />
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      background: #0f0f0f;
      font-family: 'DM Sans', Arial, sans-serif;
      color: #1a1a1a;
      padding: 40px 16px;
    }

    .wrapper {
      max-width: 580px;
      margin: 0 auto;
    }

    /* ── Card ── */
    .card {
      background: #ffffff;
      border-radius: 28px;
      overflow: hidden;
      box-shadow: 0 48px 96px rgba(0, 0, 0, 0.5);
    }

    /* ── Header – muted warm-dark gradient for rejection ── */
    .header {
      background: linear-gradient(135deg, #1a1a2e 0%, #2d1b33 45%, #3d2116 100%);
      padding: 44px 40px 0;
      position: relative;
      overflow: hidden;
    }

    .header::before {
      content: '';
      position: absolute;
      width: 280px;
      height: 280px;
      border-radius: 50%;
      background: rgba(192, 57, 107, 0.08);
      top: -90px;
      right: -70px;
    }

    .header::after {
      content: '';
      position: absolute;
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background: rgba(232, 82, 42, 0.06);
      bottom: 20px;
      left: -45px;
    }

    .logo-row {
      display: flex;
      align-items: center;
      gap: 12px;
      position: relative;
      z-index: 1;
    }

    .logo-badge {
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      object-fit: cover;
    }

    .logo-name {
      font-family: 'Playfair Display', serif;
      font-size: 22px;
      color: #fff;
      letter-spacing: -0.3px;
    }

    .logo-name span {
      display: block;
      font-family: 'DM Sans', sans-serif;
      font-weight: 300;
      font-size: 11px;
      letter-spacing: 3px;
      text-transform: uppercase;
      opacity: 0.6;
      margin-top: 1px;
    }

    .header-hero {
      position: relative;
      z-index: 1;
      margin-top: 32px;
      padding-bottom: 52px;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 50px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.7);
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 16px;
    }

    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #fca5a5;
      box-shadow: 0 0 6px #fca5a5;
    }

    .header-title {
      font-family: 'Playfair Display', serif;
      font-size: 34px;
      color: #fff;
      line-height: 1.18;
      max-width: 360px;
      opacity: 0.95;
    }

    /* Divider wave */
    .wave {
      display: block;
      margin-top: -2px;
      width: 100%;
    }

    /* ── Body ── */
    .body {
      padding: 36px 40px 40px;
    }

    .greeting {
      font-size: 13px;
      font-weight: 400;
      color: #aaa;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
      text-transform: uppercase;
    }

    .username {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      color: #111;
      margin-bottom: 18px;
    }

    .intro {
      font-size: 15px;
      line-height: 1.8;
      color: #555;
      margin-bottom: 28px;
    }

    /* Action chip */
    .action-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #fafafa;
      border: 1px solid #e5e5e5;
      border-radius: 10px;
      padding: 10px 16px;
      margin-bottom: 28px;
    }

    .action-chip-icon {
      font-size: 18px;
    }

    .action-chip-text {
      font-size: 13px;
      font-weight: 500;
      color: #555;
      letter-spacing: 0.3px;
    }

    /* Status banner */
    .status-banner {
      background: linear-gradient(135deg, #fff5f5, #fef2f2);
      border: 1.5px solid #fca5a5;
      border-radius: 16px;
      padding: 20px 22px;
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 28px;
    }

    .status-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
      box-shadow: 0 6px 16px rgba(239, 68, 68, 0.3);
    }

    .status-content strong {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #dc2626;
      margin-bottom: 4px;
    }

    .status-content p {
      font-size: 15px;
      font-weight: 500;
      color: #7f1d1d;
    }

    /* Custom message */
    .message-box {
      background: #fafafa;
      border-left: 3px solid #e8522a;
      border-radius: 0 12px 12px 0;
      padding: 16px 18px;
      margin-bottom: 28px;
      font-size: 14px;
      line-height: 1.75;
      color: #444;
      font-style: italic;
    }

    /* Default reasons */
    .reasons-box {
      background: #fdfaf8;
      border: 1px solid #f0e8e0;
      border-radius: 16px;
      padding: 20px 22px;
      margin-bottom: 28px;
    }

    .reasons-label {
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #c0396b;
      margin-bottom: 14px;
    }

    .reason-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid #f5ede8;
      font-size: 14px;
      color: #555;
      line-height: 1.6;
    }

    .reason-item:last-child {
      border-bottom: none;
    }

    .reason-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #e8522a;
      flex-shrink: 0;
      margin-top: 7px;
    }

    /* Next steps */
    .section-label {
      font-size: 13px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #888;
      margin-bottom: 16px;
    }

    .steps {
      margin-bottom: 32px;
    }

    .step {
      display: flex;
      gap: 14px;
      padding: 14px 0;
      border-bottom: 1px solid #f5f5f5;
    }

    .step:last-child {
      border-bottom: none;
    }

    .step-num {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #f5f5f5;
      color: #666;
      font-size: 12px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
      border: 1.5px solid #e5e5e5;
    }

    .step-body strong {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #222;
      margin-bottom: 3px;
    }

    .step-body p {
      font-size: 13px;
      color: #777;
      line-height: 1.6;
    }

    /* Encouragement strip */
    .encourage {
      background: linear-gradient(135deg, #fff8f0, #fff5f8);
      border-radius: 14px;
      padding: 18px 20px;
      font-size: 14px;
      line-height: 1.75;
      color: #555;
      margin-bottom: 28px;
      border: 1px solid #f5ddd0;
    }

    .encourage strong {
      color: #c0396b;
    }

    /* CTA */
    .cta-wrap {
      text-align: center;
      margin-bottom: 30px;
    }

    .cta-btn {
      display: inline-block;
      background: linear-gradient(135deg, #1a1a2e 0%, #2d1b33 50%, #3d2116 100%);
      color: #fff !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 500;
      letter-spacing: 0.4px;
      padding: 16px 48px;
      border-radius: 50px;
      box-shadow: 0 14px 36px rgba(0, 0, 0, 0.2);
    }

    /* Divider */
    .sep {
      border: none;
      border-top: 1px solid #f0f0f0;
      margin: 0 0 24px;
    }

    .signoff {
      font-size: 14px;
      color: #666;
      line-height: 1.8;
    }

    .signoff strong {
      display: block;
      font-family: 'Playfair Display', serif;
      font-size: 19px;
      color: #111;
      margin-top: 4px;
    }

    /* Footer */
    .footer {
      text-align: center;
      margin-top: 28px;
      font-size: 12px;
      color: #555;
    }

    .footer a {
      color: #f5a623;
      text-decoration: none;
    }

    .paint-dots {
      display: flex;
      justify-content: center;
      gap: 6px;
      margin-top: 14px;
    }

    .paint-dots span {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      opacity: 0.55;
    }
  </style>
</head>

<body>
  <!-- Hidden preview text for email clients -->
  <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    Action required: Your recent submission requires some updates before it can be approved.
  </div>
  <div class="wrapper">
    <div class="card">

      <!-- Header -->
      <div class="header">
        <div class="logo-row">
          <img src="cid:logo" alt="ArtVPP" class="logo-badge" onerror="this.style.display='none'" />
          <div class="logo-name">
            ArtVPP
            <span>Creative Studio</span>
          </div>
        </div>
        <div class="header-hero">
          <div class="status-pill">
            <span class="status-dot"></span>
            Not Approved
          </div>
          <div class="header-title">We have an update<br />on your submission</div>
        </div>
      </div>

      <!-- Wave divider -->
      <svg class="wave" viewBox="0 0 580 44" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path d="M0,0 C145,44 435,0 580,32 L580,0 Z" fill="url(#wgr)" />
        <defs>
          <linearGradient id="wgr" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#1a1a2e" />
            <stop offset="50%" style="stop-color:#2d1b33" />
            <stop offset="100%" style="stop-color:#3d2116" />
          </linearGradient>
        </defs>
      </svg>

      <!-- Body -->
      <div class="body">

        <p class="greeting">Hello,</p>
        <h2 class="username">\${username}</h2>

        <p class="intro">
          Thank you for submitting your work to <strong>ArtVPP</strong>. We truly appreciate
          the effort and creativity you put into your submission. After a thorough review by
          our team, we're unable to approve it at this time.
        </p>

        <!-- Action chip -->
        <div class="action-chip">
          <span class="action-chip-icon">🖼️</span>
          <span class="action-chip-text">\${actionLabel}</span>
        </div>

        <!-- Status banner -->
        <div class="status-banner">
          <div class="status-icon">✗</div>
          <div class="status-content">
            <strong>Status</strong>
            <p>Not Approved — Review Required</p>
          </div>
        </div>

        \${message ? \`<!-- Custom admin reason -->
        <div class="message-box">💬 \${message}</div>\` : \`<!-- Default reasons -->
        <div class="reasons-box">
          <p class="reasons-label">Common reasons for rejection</p>
          <div class="reason-item">
            <span class="reason-dot"></span>
            <span>Incomplete or unclear product details (title, description, or pricing)</span>
          </div>
          <div class="reason-item">
            <span class="reason-dot"></span>
            <span>Image quality or resolution does not meet our standards</span>
          </div>
          <div class="reason-item">
            <span class="reason-dot"></span>
            <span>Content does not comply with our submission guidelines or policies</span>
          </div>
        </div>\`}

        <!-- Next steps -->
        <p class="section-label">🔧 What you can do next</p>
        <div class="steps">
          <div class="step">
            <div class="step-num">1</div>
            <div class="step-body">
              <strong>Review the feedback</strong>
              <p>Read the reason above carefully — it points to exactly what needs to change.</p>
            </div>
          </div>
          <div class="step">
            <div class="step-num">2</div>
            <div class="step-body">
              <strong>Update your submission</strong>
              <p>Head to your dashboard, make the necessary improvements to your listing.</p>
            </div>
          </div>
          <div class="step">
            <div class="step-num">3</div>
            <div class="step-body">
              <strong>Resubmit for review</strong>
              <p>Once updated, resubmit and our team will review it again promptly.</p>
            </div>
          </div>
        </div>

        <!-- Encouragement -->
        <div class="encourage">
          🌟 Don't be discouraged — <strong>every great artist refines their work.</strong>
          We believe in your talent and look forward to seeing your updated submission.
          Our support team is always here if you have questions.
        </div>

        <!-- CTA -->
        <div class="cta-wrap">
          <a href="\${process.env.CLIENT_URL}/dashboard/artist" class="cta-btn">👉 Go to My Dashboard</a>
        </div>

        <hr class="sep" />

        <div class="signoff">
          With encouragement,
          <strong>Team ArtVPP 🎨</strong>
        </div>

      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>© \${new Date().getFullYear()} ArtVPP · All rights reserved</p>
      <p style="margin-top:6px;">
        <a href="#">Unsubscribe</a> &nbsp;·&nbsp;
        <a href="#">Privacy Policy</a> &nbsp;·&nbsp;
        <a href="#">Help Center</a>
      </p>
      <div class="paint-dots">
        <span style="background:#c0396b;"></span>
        <span style="background:#e8522a;"></span>
        <span style="background:#f5a623;"></span>
        <span style="background:#9b59b6;"></span>
        <span style="background:#3498db;"></span>
      </div>
    </div>
  </div>
</body>

</html>
`;

    const mailOptions = {
      from: `"ArtVPP" <${process.env.MAIL_USER}>`,
      to: email,
      subject,
      html: htmlContent,
      attachments: [
        {
          filename: 'logo.png',
          path: path.join(__dirname, '../../frontart/public/logo.png'),
          cid: 'logo'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Artist action email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Artist action email sending failed:", error.message);
    return false;
  }
};

/**
 * Send Suggestion Email to Artist Applicant
 * @param {string} email - Recipient email
 * @param {string} username - User's name
 * @param {string} suggestion - Suggestion/feedback text
 */
export const sendSuggestionEmail = async (email, username, suggestion) => {
  try {
    const transporter = createTransporter();

    const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #D4AF37;">Feedback on Your Artist Application 📝</h2>
                <p>Hi ${username},</p>
                <p>Our team has reviewed your artist application and has some feedback for you:</p>
                <div style="background-color: #f7f7f7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D4AF37;">
                    <p style="margin: 0; color: #333; white-space: pre-wrap;">${suggestion}</p>
                </div>
                <p>Please address the feedback above to improve your application. You can update your application by visiting your profile.</p>
                <a href="${process.env.CLIENT_URL}/sell" 
                   style="display: inline-block; padding: 12px 24px; background-color: #D4AF37; 
                          color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
                    View Application
                </a>
                <p style="margin-top: 20px; color: #666;">
                    If you have any questions, please don't hesitate to contact our support team.
                </p>
                <p style="margin-top: 30px; color: #666; font-size: 12px;">
                    © ${new Date().getFullYear()} ArtVPP. All rights reserved.
                </p>
            </div>
        `;

    const mailOptions = {
      from: `"ArtVPP" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Feedback on Your Artist Application - ArtVPP",
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Suggestion email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Suggestion email sending failed:", error.message);
    return false;
  }
};

