const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'utils/sendEmail.js');
let content = fs.readFileSync(filePath, 'utf8');

const startIndex = content.indexOf('export const sendArtistActionEmail =');
const endIndex = content.indexOf('export const sendSuggestionEmail =');

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find boundaries");
    process.exit(1);
}

const newFunction = `export const sendArtistActionEmail = async (email, username, status, actionType, message = null) => {
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
      ? \\\`✅ \\\${actionLabel} Approved - ArtVPP\\\`
      : \\\`❌ \\\${actionLabel} Not Approved - ArtVPP\\\`;

    const gradient = isApproved 
      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" 
      : "linear-gradient(135deg, #e8522a 0%, #c0396b 100%)";
    const icon = isApproved ? "✅" : "⚠️";
    const statusText = isApproved ? "Approved" : "Not Approved";
    const headerTitle = isApproved 
      ? \\\`Your submission<br />has been approved ✦\\\`
      : \\\`Your submission<br />was not approved\\\`;
    const headerSub = isApproved
      ? "Your artwork is now live and ready to be discovered."
      : "We need a few changes before your artwork can go live.";

    const bannerBg = isApproved ? "#ecfdf5" : "#fff8f8";
    const bannerBorder = isApproved ? "#6ee7b7" : "#ffcdd2";
    const bannerIconBg = isApproved ? "#10b981" : "#e53935";
    const bannerTitleColor = isApproved ? "#059669" : "#c62828";
    const bannerTextColor = isApproved ? "#065f46" : "#b71c1c";
    const ctaColor = isApproved ? "#10b981" : "#e53935";

    const htmlContent = \\\`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>\\\${subject}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'DM Sans', Arial, sans-serif; color: #1a1a1a;">
  <!-- Hidden preview text -->
  <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    \\\${isApproved ? "Great news! Your recent submission has been successfully approved." : "Update on your recent submission."}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9f9f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Wrapper -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; width: 100%; margin: 0 auto; background: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);">
          <tr>
            <td>
              <!-- Header -->
              <div style="background: \\\${gradient}; padding: 44px 40px 0;">
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
                    <span style="font-size: 14px;">\\\${icon}</span> \\\${statusText}
                  </div>
                  <div style="font-family: 'Playfair Display', serif; font-size: 38px; color: #fff; line-height: 1.15; max-width: 360px;">
                    \\\${headerTitle}
                  </div>
                  <p style="margin: 12px 0 0 0; font-size: 15px; color: rgba(255, 255, 255, 0.8); font-weight: 300; line-height: 1.6; max-width: 320px;">\\\${headerSub}</p>
                </div>
              </div>

              <!-- Body -->
              <div style="padding: 36px 40px 40px;">
                <p style="font-size: 13px; color: #aaa; letter-spacing: 0.5px; text-transform: uppercase; margin: 0 0 4px 0;">Hey there,</p>
                <h2 style="font-family: 'Playfair Display', serif; font-size: 30px; color: #111; margin: 0 0 18px 0;">\\\${username || "Artist"} 👋</h2>

                <p style="font-size: 15px; line-height: 1.8; color: #555; margin: 0 0 32px 0;">
                  \\\${isApproved 
                    ? "Great news! Your recent artwork submission has been reviewed and successfully approved. It's now live and visible to collectors everywhere."
                    : "We've reviewed your recent artwork submission. Unfortunately, we aren't able to approve it as it currently stands. Please see the feedback below."}
                </p>

                <table width="100%" cellpadding="0" cellspacing="0" style="background: \\\${bannerBg}; border: 1.5px solid \\\${bannerBorder}; border-radius: 16px; margin-bottom: 32px;">
                  <tr>
                    <td width="48" valign="middle" style="padding: 18px 0 18px 22px;">
                      <div style="width: 48px; height: 48px; border-radius: 14px; background: \\\${bannerIconBg}; text-align: center; line-height: 48px; font-size: 22px; color: white;">\\\${icon}</div>
                    </td>
                    <td valign="middle" style="padding: 18px 22px 18px 16px;">
                      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: \\\${bannerTitleColor}; margin-bottom: 4px; font-weight: 700;">Submission Status</div>
                      <p style="font-size: 15px; font-weight: 500; color: \\\${bannerTextColor}; margin: 0;">\\\${statusText}</p>
                    </td>
                  </tr>
                </table>

                \\\${message ? \\\`
                <div style="background: #fafafa; border-left: 3px solid #e8522a; border-radius: 0 12px 12px 0; padding: 16px 18px; margin-bottom: 28px; font-size: 14px; line-height: 1.75; color: #444; font-style: italic;">
                  \\\${message}
                </div>
                \\\` : ''}

                <!-- CTA -->
                <div style="text-align: center; margin-bottom: 10px;">
                  <a href="\\\${process.env.CLIENT_URL}/dashboard/artist" style="display: inline-block; background: \\\${ctaColor}; color: #fff; text-decoration: none; font-size: 16px; font-weight: 500; letter-spacing: 0.4px; padding: 17px 52px; border-radius: 50px;">Go to Dashboard</a>
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
              <p style="font-size: 12px; color: #555; margin: 0;">© \\\${new Date().getFullYear()} ArtVPP · All rights reserved</p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>\\\`;

    const mailOptions = {
      from: \\\`"ArtVPP" <\\\${process.env.MAIL_USER}>\\\`,
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
    console.log(\\\`✅ Artist action email sent to \\\${email}\\\`);
    return true;
  } catch (error) {
    console.error("❌ Artist action email sending failed:", error.message);
    return false;
  }
};

\`;

content = content.substring(0, startIndex) + newFunction + content.substring(endIndex);
fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully replaced sendArtistActionEmail");
