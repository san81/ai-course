# Week 7 · The hostel agent in n8n (and on WhatsApp)

The Colab notebook builds the agent in Python. This guide builds the **same agent with no code** in n8n, connected to the same **Mr. Chenna Reddy** MCP server, and then puts it on **WhatsApp**.

| File | What it is |
|---|---|
| `chenna_reddy_mcp.py` + `valve-manual.csv` | Mr. Chenna Reddy, the hostel's MCP ("Master of Control Panels"), as a real MCP server |
| `week7-n8n-3-chenna-reddy-check.json` | Connection check: n8n asks Chenna Reddy one question. No AI, no key |
| `week7-n8n-1-hostel-agent-chat.json` | The agent: type a complaint in n8n's chat → it works the problem → sends a WhatsApp update to the warden |
| `week7-n8n-2-hostel-agent-whatsapp.json` | Fully on WhatsApp: a student messages a WhatsApp number → the agent replies on WhatsApp |

Everything here is free: n8n runs on your laptop, Gemini is the free tier, and WhatsApp uses Meta's free **test number**.

---

## Part A · Run n8n and Mr. Chenna Reddy on your laptop (10 minutes)

You need **Node.js** (nodejs.org, LTS version) and **Python 3**.

1. **Start Mr. Chenna Reddy.** In a terminal, inside the folder with `chenna_reddy_mcp.py` and `valve-manual.csv`:
   ```
   pip install mcp
   python chenna_reddy_mcp.py --http
   ```
   Leave it running. He's now at `http://localhost:8000/mcp`.
2. **Start n8n** in a second terminal:
   ```
   npx n8n
   ```
   Open **http://localhost:5678** and create your (local) account.
3. **Import the connection check:** top-right **⋯ → Import from File** → `week7-n8n-3-chenna-reddy-check.json` → **Execute workflow**. You should see manual **page 44** (the orange lever). If you do, n8n can reach Chenna Reddy.

> 🔄 **Change his world:** stop him (Ctrl + C) and start him again with `STUCK_LEVERS=orange python chenna_reddy_mcp.py --http` (Windows PowerShell: `$env:STUCK_LEVERS="orange"; python chenna_reddy_mcp.py --http`).

## Part B · The agent, with a WhatsApp update to the warden (15 minutes)

1. **Import** `week7-n8n-1-hostel-agent-chat.json`.
2. **Gemini key:** open **Gemini (free tier)** → Credential → *Create new* → paste your key from aistudio.google.com (the same free key as the notebook).
3. **Try it without WhatsApp first:** the WhatsApp node will fail until Part C, so right-click it → **Deactivate**. Click **Open chat** and paste:
   > Anna, water is pouring from the pipe under the sink in the C-block 2nd floor bathroom!! The floor is flooding.
4. Open **Night-duty agent → Logs**: every step of think → act → observe, in order: contacts → warden → plumber → Chenna Reddy's manual → orange lever → check the leak → reply.
5. **Change the world, watch the plan change:**
   - Open **call_person**, set `WARDEN_ANSWERS = false` → it calls the deputy warden instead.
   - Set `PLUMBER_COMES = 'tomorrow at 9 am'` → the reply to the student changes.
   - Restart Chenna Reddy with `STUCK_LEVERS=orange` → it shuts yellow instead.

## Part C · WhatsApp (instructor demo, 20 minutes, once)

Meta's WhatsApp Business **Cloud API** has a free **test number** that can send to a few phone numbers you verify.

1. Go to **developers.facebook.com** → **My Apps → Create app** → choose the use case **Connect with customers through WhatsApp**, and create or pick a business portfolio.
2. Open **WhatsApp → API Setup**:
   - Note the **Phone number ID** of the test number.
   - Under **To**, add **your own phone number** (the "warden") and verify it with the code WhatsApp sends.
   - Click **Generate access token** and copy it. Also copy the **WhatsApp Business Account ID**.
   - The temporary token expires quickly (about a day). For anything longer, create a permanent *system user* token (see Meta's guide).
3. **Open the 24-hour window:** from your phone, send any message (e.g. "hi") **to the test number**. Free-form text can only be sent to someone who has messaged the number in the last 24 hours. Without this, only approved templates like `hello_world` go through.
4. In n8n, open **WhatsApp update to the warden**:
   - Credential → *Create new* (**WhatsApp API**) → Access Token + Business Account ID.
   - **Sender Phone Number ID** → the test number's ID (replace `PASTE_PHONE_NUMBER_ID`).
   - **Recipient's Phone Number** → your number with country code, e.g. `919876543210` (replace the placeholder).
5. Reactivate the node, open the chat, paste the complaint. Your phone buzzes with the agent's update. 📱

**Fully on WhatsApp** (`week7-n8n-2-…`): the **WhatsApp Trigger** needs a public web address for Meta to call, so it only works on **n8n Cloud** (free trial) or with a tunnel to your laptop (e.g. `cloudflared tunnel --url http://localhost:5678`, then set n8n's `WEBHOOK_URL` to that address). It uses a second credential, **WhatsApp OAuth** (App ID + App Secret from *App settings → Basic*). Mr. Chenna Reddy must then be reachable from n8n too: same machine, or the same tunnel trick for port 8000.

## Part D · Students: Telegram instead (no Meta account needed)

In workflow 1, deactivate the WhatsApp node and activate **Telegram update (alternative)**:

1. In Telegram, message **@BotFather** → `/newbot` → copy the bot token.
2. Send your new bot any message, then open `https://api.telegram.org/bot<TOKEN>/getUpdates` and copy `"chat":{"id": …}`.
3. In n8n: Telegram credential = the token; **Chat ID** = that number.

---

### If something fails

| You see | Fix |
|---|---|
| `ECONNREFUSED localhost:8000` | Chenna Reddy isn't running: Part A step 1 |
| The agent never uses Chenna Reddy's tools | Re-run the connection check (Part A step 3); restart n8n after starting him |
| `429` from Gemini | Free limit: wait a minute (daily limit resets at midnight US Pacific) |
| WhatsApp `(#131030) Recipient phone number not in allowed list` | Add and verify that number under **API Setup → To** |
| WhatsApp message not delivered, no error | The 24-hour window is closed: message the test number from that phone first |
| WhatsApp `(#190) access token expired` | Generate a new token on **API Setup** |

Official docs: [n8n WhatsApp credentials](https://docs.n8n.io/integrations/builtin/credentials/whatsapp) · [WhatsApp Cloud API: get started](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/) · [Model Context Protocol](https://modelcontextprotocol.io)
