# Setting Rostra up for real use (for Bobi)

Everything below is clicking in web dashboards and pasting values. Nothing needs to change in the code. Do it in this order; each step says what it unlocks.

## 1. Netlify: turn off site protection (unlocks: anyone can open the site)
The live site currently answers "401 Unauthorized" to visitors. In Netlify: open the site → **Site configuration** → **Access & security** (or "Site protection") → make it public / remove the password. Under **Build & deploy → Continuous deployment**, make sure the branch to deploy is `main` and that no build settings are overridden (the repository's `netlify.toml` provides them). Then, under **Cloud compute → Functions → Region**, choose **Frankfurt (fra)** so the API runs in the EU, and redeploy.

## 2. Supabase: the database and accounts (unlocks: sign-in, classes, teacher view, saved work)
1. https://supabase.com/dashboard → **New project**. Name: `rostra`. Region: **Frankfurt (eu-central-1)**. Choose a database password and keep it somewhere safe (Netlify does not need it).
2. Wait for the project to finish setting up (a few minutes).
3. Left menu → **SQL Editor** → **New query**. Open `supabase/migrations/0001_init.sql` from this repository, copy all of it into the editor, press **Run**. It should end with "Success. No rows returned".
4. In the same editor, create your first school so a teacher can join (pick your own code: letters and digits, up to 8):
   ```sql
   insert into public.schools (name, slug, invite_code) values ('Rostra test school', 'rostra-test', 'ROSTRA1');
   ```
5. Left menu → **Project Settings** (gear) → **API**. Copy three values:
   - **Project URL** (like `https://abcdefgh.supabase.co`) → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key (click to reveal; keep it secret) → `SUPABASE_SERVICE_ROLE_KEY`
6. Left menu → **Authentication** → **Sign In / Providers** (or "Providers" → **Email**): turn **off** "Allow new users to sign up". Rostra's own server creates every account (students with a class code, teachers with an invite code), so nobody needs Supabase's public sign-up form, and leaving it on would let strangers make logins. Keep "Enable email provider" on. "Confirm email" can stay off: the server marks accounts confirmed itself.

## 3. Anthropic: the AI key (unlocks: the examiner, the coach, speech feedback)
1. https://console.anthropic.com → **API keys** → **Create key**. Name it `rostra-netlify`. Copy it once.
2. Under **Billing**, add prepaid credits. Start with about €50; one oral exam costs roughly €0.25–0.30.

## 4. Deepgram: speech-to-text with Bulgarian, EU servers (unlocks: spoken answers transcribed on the server)
Optional but recommended. Without it, Chrome and Safari use their own built-in speech recognition (free, but it sends audio to Google/Apple and it does not work in Firefox).
1. https://console.deepgram.com → sign up → **API Keys** → **Create key** → `DEEPGRAM_API_KEY`.
2. Leave `DEEPGRAM_API_URL` as `https://api.eu.deepgram.com` and `DEEPGRAM_MODEL` as `nova-3`.

## 5. Netlify: paste the keys (unlocks: all of the above on the live site)
Netlify → the site → **Project configuration** → **Environment variables** → **Add a variable** → "Add a single variable", one at a time:

| Key | Value |
|---|---|
| `ANTHROPIC_API_KEY` | from step 3 |
| `SUPABASE_URL` | from step 2 |
| `SUPABASE_ANON_KEY` | from step 2 |
| `SUPABASE_SERVICE_ROLE_KEY` | from step 2 |
| `ROSTRA_ADMIN_EMAILS` | your email, e.g. `gudev.boris@gmail.com` (lets you create schools from the Account page) |
| `ROSTRA_ADMIN_SETUP_CODE` | a private code you invent, letters and digits, e.g. `ROSTRA-ADMIN-2026`. You type it once, in step 6, instead of a school invite code. Keep it to yourself. |
| `DEEPGRAM_API_KEY` | from step 4 (optional) |

Then **Deploys** → **Trigger deploy** → **Deploy site**, and wait for it to finish.

## 6. First sign-in
Open the live site → **Join as a teacher** → in the invite code field type your `ROSTRA_ADMIN_SETUP_CODE` (not a school code), then your email (the one in `ROSTRA_ADMIN_EMAILS`) and a password. That makes you the Rostra admin. On your **Account** page, "Create school" gives you the invite code for each real school; send that code to its teachers. (The `ROSTRA1` school from step 2.4 is only there so a colleague can try the teacher side before any real school exists.)

Nobody else can sign up with your email: the server refuses it unless the set-up code is typed, and the set-up code lives only in Netlify.

Passwords: a teacher resets a student's password from the class page; you (admin) can reset any student in your school. A teacher who forgets their own password: Supabase → **Authentication** → **Users** → the teacher → **⋯** → **Reset password** (or "Send password recovery" once SMTP is configured).

## 7. Try it as a class would
Teacher: **Classes** → create a class → note the 6-character code → open it → **Set an oral exam**.
Student (another browser or a private window): **Join as a student** with the class code → Home shows the assignment → **Sit the exam** → allow the microphone → speak.
Teacher: open the class again → the result row → **Open report**.

## 8. Watch the cost
Supabase → **Table Editor** → `usage` lists every AI call with its cost in dollars. From a computer with the repository and a `.env` holding the Supabase values, `node scripts/cost-report.mjs 30` prints cost per exam and per user. Per-user daily limits are `ROSTRA_DAILY_CALLS` (150) and `ROSTRA_DAILY_USD` (3); change them in Netlify if a class needs more.
