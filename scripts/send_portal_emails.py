import json
import smtplib
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ─────────────────────────────────────────────
#  FLAG
#  1 → test mode: only sends to "arnav-goyal"
#  2 → live mode: sends to everyone
# ─────────────────────────────────────────────
FLAG = 1

# ─────────────────────────────────────────────
#  CONFIG — fill these in before running
# ─────────────────────────────────────────────
PORTAL_URL    = "https://bodhiaic.vercel.app"   # your deployed URL
SENDER_EMAIL  = "arnav.goyal_ug2023@ashoka.edu.in"           # Gmail you're sending from
SENDER_PASS   = "umwz spms wklm iomr"            # Gmail App Password (not your real password)
#   → gmail.com → Manage Account → Security → 2FA on → App Passwords → create one

MEMBERS_FILE  = "/Users/arnav/Desktop/workspaces/aic/data/members.json"           # path relative to this script

# ─────────────────────────────────────────────
#  LOAD MEMBERS
# ─────────────────────────────────────────────
with open(MEMBERS_FILE, "r") as f:
    all_members = json.load(f)

if FLAG == 1:
    members = [m for m in all_members if m["id"] == "arnav-goyal"]
    print(f"[TEST MODE] Sending to {len(members)} member(s).")
elif FLAG == 2:
    members = all_members
    print(f"[LIVE MODE] Sending to {len(members)} member(s).")
else:
    raise ValueError("FLAG must be 1 or 2.")

# ─────────────────────────────────────────────
#  EMAIL BUILDER
# ─────────────────────────────────────────────
def build_email(member: dict) -> MIMEMultipart:
    first_name = member["name"].split()[0]
    username   = member["email"]
    password   = f"{first_name.lower()}@bodhi"

    subject = "Your BODHI Capital Member Portal Access"

    html = f"""
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
             background: #f8fafc; margin: 0; padding: 32px;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff;
              border-radius: 16px; overflow: hidden;
              box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #15803d, #166534);
                padding: 32px 40px 28px;">
      <p style="margin: 0; font-size: 22px; font-weight: 700;
                color: #ffffff; letter-spacing: -0.3px;">
        BODHI Capital
      </p>
      <p style="margin: 6px 0 0; font-size: 13px; color: #bbf7d0;">
        Member Portal
      </p>
    </div>

    <!-- Body -->
    <div style="padding: 36px 40px;">
      <p style="margin: 0 0 20px; font-size: 15px; color: #1e293b;">
        Hi {first_name},
      </p>
      <p style="margin: 0 0 28px; font-size: 15px; color: #475569; line-height: 1.6;">
        Your access to the BODHI Capital member portal is ready.
        Log in below to explore pitches, the live market oracle, and The Pit.
      </p>

      <!-- Credentials box -->
      <div style="background: #f1f5f9; border-radius: 12px; padding: 24px 28px;
                  margin-bottom: 28px; border: 1px solid #e2e8f0;">
        <p style="margin: 0 0 14px; font-size: 12px; font-weight: 600;
                  text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8;">
          Your credentials
        </p>

        <div style="margin-bottom: 14px;">
          <p style="margin: 0 0 3px; font-size: 11px; color: #94a3b8;">Portal URL</p>
          <a href="{PORTAL_URL}" style="font-size: 14px; color: #15803d;
             font-weight: 600; text-decoration: none;">{PORTAL_URL}</a>
        </div>

        <div style="margin-bottom: 14px;">
          <p style="margin: 0 0 3px; font-size: 11px; color: #94a3b8;">Username</p>
          <p style="margin: 0; font-size: 14px; color: #1e293b;
             font-family: 'Courier New', monospace; font-weight: 600;">{username}</p>
        </div>

        <div>
          <p style="margin: 0 0 3px; font-size: 11px; color: #94a3b8;">Password</p>
          <p style="margin: 0; font-size: 14px; color: #1e293b;
             font-family: 'Courier New', monospace; font-weight: 600;">{password}</p>
        </div>
      </div>

      <!-- CTA button -->
      <a href="{PORTAL_URL}"
         style="display: inline-block; background: linear-gradient(135deg, #16a34a, #15803d);
                color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;
                padding: 14px 32px; border-radius: 10px; letter-spacing: 0.1px;">
        Open Portal →
      </a>
    </div>

    <!-- Footer -->
    <div style="padding: 20px 40px 28px; border-top: 1px solid #f1f5f9;">
      <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
        BODHI Capital · Ashoka University<br>
        This email was sent to {username}
      </p>
    </div>

  </div>
</body>
</html>
"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"BODHI Capital <{SENDER_EMAIL}>"
    msg["To"]      = member["email"]
    msg.attach(MIMEText(html, "html"))
    return msg


# ─────────────────────────────────────────────
#  SEND
# ─────────────────────────────────────────────
def main():
    if not members:
        print("No members matched. Check your FLAG or member ID.")
        return

    print(f"Connecting to Gmail SMTP...")
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(SENDER_EMAIL, SENDER_PASS)
        print("Logged in.\n")

        for i, member in enumerate(members, 1):
            msg = build_email(member)
            server.sendmail(SENDER_EMAIL, member["email"], msg.as_string())
            print(f"[{i}/{len(members)}] Sent → {member['name']} ({member['email']})")
            if i < len(members):
                time.sleep(0.5)   # small delay to avoid rate limits

    print(f"\nDone. {len(members)} email(s) sent.")


if __name__ == "__main__":
    main()
