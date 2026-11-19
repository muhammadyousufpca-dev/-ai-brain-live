# AI Brain — Progressive Public School (Live version)

This package puts the school AI Brain on a **public link** so parents can open
it on any phone and use **Topic Questions** (live answers in Roman Urdu).
No login needed for parents.

**What is inside this folder**

- `public/index.html` — the full AI Brain page (Chat, Diary Helper, Fees,
  Fee Calculator, Timings, Syllabus, Date Sheet, Notices, Homework, Leave,
  Admission, Teacher Contacts) **plus** a new **Topic Questions** section.
- `server.js` — small server: shows the page and answers Topic Questions
  through Google Gemini. The Gemini key is read **only** from the
  `GEMINI_API_KEY` environment variable. **No key is written in any file.**
- `package.json` — server needs only Express, Node 20.
- `render.yaml` — tells Render to run this as a **free** web service.
- `.gitignore` — keeps `node_modules` out of the upload.

**School data is fixed in the page:** fees Pre-Primary Rs 2,000 / Primary
Rs 2,000 / Middle Rs 2,500 / High Rs 3,000 per month, exam fee Rs 800 per
term, winter timings 8:30 AM – 1:45 PM (Pre-Primary 11:45, Friday 12:00).

---

## Deploy steps (do them in order)

### Step 1 — Get a Gemini API key (free)

1. Open **https://aistudio.google.com** in Chrome and sign in with Google.
2. Click **Get API key** (top left), then **Create API key**.
3. Copy the key somewhere safe (a note on your phone).
   **Never paste the key in a chat, email or any file.** You will paste it
   only once, inside the Render dashboard in Step 3.

### Step 2 — Put these files on GitHub

1. Open **https://github.com** and sign in (make a free account if needed).
2. Click **+** (top right) → **New repository**.
3. Repository name: `ai-brain-live`. Keep it **Public**. Click **Create repository**.
4. On the new empty repo page, click **uploading an existing file**.
5. Drag **all files from this folder** (`public` folder, `server.js`,
   `package.json`, `render.yaml`, `.gitignore`, `README.md`) into the
   upload area. Click **Commit changes**.

### Step 3 — Create the free service on Render

1. Open **https://dashboard.render.com** and sign up / sign in
   (easiest: **Sign up with GitHub**).
2. Click **New +** → **Web Service**.
3. Choose **Build and deploy from a Git repository** → select the
   `ai-brain-live` repo → **Connect**.
4. Render reads `render.yaml` by itself. Check these values:
   - **Name:** `ai-brain-live`
   - **Environment:** Node
   - **Plan:** **Free**
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Scroll to **Environment Variables** → **Add Environment Variable**:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** paste the Gemini API key from Step 1.
6. Click **Create Web Service**. Wait 2–5 minutes while it builds.
   When it says **Live**, your public link is shown at the top, like:
   `https://ai-brain-live.onrender.com`
7. Open that link on your phone. Scroll to **Topic Questions**, type
   e.g. `Photosynthesis kya hai?` and press **Ask**. The answer comes
   in Roman Urdu with 3 practice questions.

### Step 4 — Share the link

Send the Render link to parents in the class WhatsApp groups. It is the
same link for everyone — no login, no app install.

---

## Honest limits of the free tier

- **The service sleeps after about 15 minutes with no visitors.** The
  first question after a sleep can take **30–50 seconds** to answer.
  Later questions are fast (a few seconds). This is normal on the free
  plan — nothing is broken.
- **Gemini free tier has a daily limit.** If many parents ask questions
  in one day, Topic Questions may show "Aaj ki limit poori ho gayi hai —
  kal dobara koshish karein." It works again the next day.
- **One visitor can ask at most 20 questions per hour** (built-in limit,
  so one person cannot use up the whole daily quota).

If the school later wants it always fast, Render's paid Starter plan is
about $7/month — but start free first.

## Updating the page later

Change a file, upload the new version to the same GitHub repo, and Render
redeploys it by itself (1–2 minutes). The public link stays the same.

## If something goes wrong

- Page opens but Topic Questions says "Server par abhi API key set nahi
  hai": the `GEMINI_API_KEY` variable is missing in Render → Dashboard →
  your service → **Environment** → add it again → **Manual Deploy** →
  **Deploy latest commit**.
- Deploy fails on Render: open the **Logs** tab in Render and take a
  screenshot of the red error lines.
- "Aaj ki limit poori ho gayi hai": Gemini daily free limit — wait until
  tomorrow, nothing to fix.
