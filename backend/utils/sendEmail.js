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

    const gradient = isApproved 
      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" 
      : "linear-gradient(135deg, #e8522a 0%, #c0396b 100%)";
    const icon = isApproved ? "✅" : "⚠️";
    const statusText = isApproved ? "Approved" : "Not Approved";
    const headerTitle = isApproved 
      ? `Your application<br />has been approved ✦`
      : `Your application<br />was not approved`;
    const headerSub = isApproved
      ? "You are now an official artist on ArtVPP. Let's start selling."
      : "We need a few changes before your application can be approved.";

    const bannerBg = isApproved ? "#ecfdf5" : "#fff8f8";
    const bannerBorder = isApproved ? "#6ee7b7" : "#ffcdd2";
    const bannerIconBg = isApproved ? "#10b981" : "#e53935";
    const bannerTitleColor = isApproved ? "#059669" : "#c62828";
    const bannerTextColor = isApproved ? "#065f46" : "#b71c1c";
    const ctaColor = isApproved ? "#10b981" : "#e53935";

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'DM Sans', Arial, sans-serif; color: #1a1a1a;">
  <!-- Hidden preview text -->
  <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${isApproved ? "Great news! Your artist application has been successfully approved." : "Update on your artist application."}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9f9f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Wrapper -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; width: 100%; margin: 0 auto; background: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);">
          <tr>
            <td>
              <!-- Header -->
              <div style="background: ${gradient}; padding: 44px 40px 0;">
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
                    <span style="font-size: 14px;">${icon}</span> ${statusText}
                  </div>
                  <div style="font-family: 'Playfair Display', serif; font-size: 38px; color: #fff; line-height: 1.15; max-width: 360px;">
                    ${headerTitle}
                  </div>
                  <p style="margin: 12px 0 0 0; font-size: 15px; color: rgba(255, 255, 255, 0.8); font-weight: 300; line-height: 1.6; max-width: 320px;">${headerSub}</p>
                </div>
              </div>

              <!-- Body -->
              <div style="padding: 36px 40px 40px;">
                <p style="font-size: 13px; color: #aaa; letter-spacing: 0.5px; text-transform: uppercase; margin: 0 0 4px 0;">Hey there,</p>
                <h2 style="font-family: 'Playfair Display', serif; font-size: 30px; color: #111; margin: 0 0 18px 0;">${username || "Artist"} 👋</h2>

                <p style="font-size: 15px; line-height: 1.8; color: #555; margin: 0 0 32px 0;">
                  ${isApproved 
                    ? "Great news! Your artist application has been successfully approved. You can now start uploading artworks, setting prices, and managing your inventory directly from your artist dashboard."
                    : "We've reviewed your artist application. Unfortunately, we aren't able to approve it at this time. Please see the feedback below."}
                </p>

                <table width="100%" cellpadding="0" cellspacing="0" style="background: ${bannerBg}; border: 1.5px solid ${bannerBorder}; border-radius: 16px; margin-bottom: 32px;">
                  <tr>
                    <td width="48" valign="middle" style="padding: 18px 0 18px 22px;">
                      <div style="width: 48px; height: 48px; border-radius: 14px; background: ${bannerIconBg}; text-align: center; line-height: 48px; font-size: 22px; color: white;">${icon}</div>
                    </td>
                    <td valign="middle" style="padding: 18px 22px 18px 16px;">
                      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: ${bannerTitleColor}; margin-bottom: 4px; font-weight: 700;">Application Status</div>
                      <p style="font-size: 15px; font-weight: 500; color: ${bannerTextColor}; margin: 0;">${statusText}</p>
                    </td>
                  </tr>
                </table>

                ${reason ? `
                <div style="background: #fafafa; border-left: 3px solid #e8522a; border-radius: 0 12px 12px 0; padding: 16px 18px; margin-bottom: 28px; font-size: 14px; line-height: 1.75; color: #444; font-style: italic;">
                  ${reason}
                </div>
                ` : ''}

                <!-- CTA -->
                <div style="text-align: center; margin-bottom: 10px;">
                  <a href="${process.env.CLIENT_URL}/dashboard/artist" style="display: inline-block; background: ${ctaColor}; color: #fff; text-decoration: none; font-size: 16px; font-weight: 500; letter-spacing: 0.4px; padding: 17px 52px; border-radius: 50px;">Go to Dashboard</a>
                </div>
                <p style="text-align: center; font-size: 13px; color: #bbb; margin: 0 0 28px 0;">Log in to manage your submissions and profile.</p>

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
    console.log(`✅ Artist status email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Artist status email sending failed:", error.message);
    return false;
  }
};


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

    const gradient = isApproved 
      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" 
      : "linear-gradient(135deg, #e8522a 0%, #c0396b 100%)";
    const icon = isApproved ? "✅" : "⚠️";
    const statusText = isApproved ? "Approved" : "Not Approved";
    const headerTitle = isApproved 
      ? `Your submission<br />has been approved ✦`
      : `Your submission<br />was not approved`;
    const headerSub = isApproved
      ? "Your artwork is now live and ready to be discovered."
      : "We need a few changes before your artwork can go live.";

    const bannerBg = isApproved ? "#ecfdf5" : "#fff8f8";
    const bannerBorder = isApproved ? "#6ee7b7" : "#ffcdd2";
    const bannerIconBg = isApproved ? "#10b981" : "#e53935";
    const bannerTitleColor = isApproved ? "#059669" : "#c62828";
    const bannerTextColor = isApproved ? "#065f46" : "#b71c1c";
    const ctaColor = isApproved ? "#10b981" : "#e53935";

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'DM Sans', Arial, sans-serif; color: #1a1a1a;">
  <!-- Hidden preview text -->
  <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${isApproved ? "Great news! Your recent submission has been successfully approved." : "Update on your recent submission."}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9f9f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Wrapper -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; width: 100%; margin: 0 auto; background: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);">
          <tr>
            <td>
              <!-- Header -->
              <div style="background: ${gradient}; padding: 44px 40px 0;">
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
                    <span style="font-size: 14px;">${icon}</span> ${statusText}
                  </div>
                  <div style="font-family: 'Playfair Display', serif; font-size: 38px; color: #fff; line-height: 1.15; max-width: 360px;">
                    ${headerTitle}
                  </div>
                  <p style="margin: 12px 0 0 0; font-size: 15px; color: rgba(255, 255, 255, 0.8); font-weight: 300; line-height: 1.6; max-width: 320px;">${headerSub}</p>
                </div>
              </div>

              <!-- Body -->
              <div style="padding: 36px 40px 40px;">
                <p style="font-size: 13px; color: #aaa; letter-spacing: 0.5px; text-transform: uppercase; margin: 0 0 4px 0;">Hey there,</p>
                <h2 style="font-family: 'Playfair Display', serif; font-size: 30px; color: #111; margin: 0 0 18px 0;">${username || "Artist"} 👋</h2>

                <p style="font-size: 15px; line-height: 1.8; color: #555; margin: 0 0 32px 0;">
                  ${isApproved 
                    ? "Great news! Your recent artwork submission has been reviewed and successfully approved. It's now live and visible to collectors everywhere."
                    : "We've reviewed your recent artwork submission. Unfortunately, we aren't able to approve it as it currently stands. Please see the feedback below."}
                </p>

                <table width="100%" cellpadding="0" cellspacing="0" style="background: ${bannerBg}; border: 1.5px solid ${bannerBorder}; border-radius: 16px; margin-bottom: 32px;">
                  <tr>
                    <td width="48" valign="middle" style="padding: 18px 0 18px 22px;">
                      <div style="width: 48px; height: 48px; border-radius: 14px; background: ${bannerIconBg}; text-align: center; line-height: 48px; font-size: 22px; color: white;">${icon}</div>
                    </td>
                    <td valign="middle" style="padding: 18px 22px 18px 16px;">
                      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: ${bannerTitleColor}; margin-bottom: 4px; font-weight: 700;">Submission Status</div>
                      <p style="font-size: 15px; font-weight: 500; color: ${bannerTextColor}; margin: 0;">${statusText}</p>
                    </td>
                  </tr>
                </table>

                ${message ? `
                <div style="background: #fafafa; border-left: 3px solid #e8522a; border-radius: 0 12px 12px 0; padding: 16px 18px; margin-bottom: 28px; font-size: 14px; line-height: 1.75; color: #444; font-style: italic;">
                  ${message}
                </div>
                ` : ''}

                <!-- CTA -->
                <div style="text-align: center; margin-bottom: 10px;">
                  <a href="${process.env.CLIENT_URL}/dashboard/artist" style="display: inline-block; background: ${ctaColor}; color: #fff; text-decoration: none; font-size: 16px; font-weight: 500; letter-spacing: 0.4px; padding: 17px 52px; border-radius: 50px;">Go to Dashboard</a>
                </div>
                <p style="text-align: center; font-size: 13px; color: #bbb; margin: 0 0 28px 0;">Log in to manage your submissions and profile.</p>

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

