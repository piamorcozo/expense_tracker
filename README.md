# Cutoff — Expense Tracker

Your personal cutoff-based expense tracker: Angular + Flask + MySQL.

```
cutoff-app/
  backend/     Flask API (Python) + MySQL schema
  frontend/    Angular 17 app (standalone components)
```

## What's implemented

- **Users**: lightweight switcher (no passwords) — pick "who's using this" from a dropdown.
- **Maintenance**: must-haves (auto-added to every new cutoff list) + banks list.
- **Lists**: create a Cutoff-based list (name, month, day 15/30, budget) or an Other-expense list (name, optional budget). Cutoff lists auto-inherit your must-haves as ₱0 pending items.
- **List detail**: remaining budget, status badge (tap to cycle Open → Pending → Closed), Close/Open list button, full item CRUD (name, amount, bank, status, due date, remarks). Closed lists are read-only.
- **Dashboard**: hero card for the current Open cutoff (remaining budget + a little progress ring), the two "quick access" cards (open cutoff + other expenses), and a Pending lists section with quick-add (+) and Open buttons.
- **History**: dynamically pulls every Closed list, still viewable (read-only) by tapping in.
- **Savings**: deposit log (amount, date, bank, status), a running total, and a predictive card forecasting your Dec 30 total based on your most frequent deposit amount.
- **Dark/light mode**, mobile-first responsive layout with a bottom tab bar on phones and a sidebar on desktop.

---

## 1. Local setup

### Database (MySQL)
```bash
mysql -u root -p < backend/schema.sql
```
This creates the `cutoff_tracker` database and all tables.

### Backend (Flask)
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # edit DATABASE_URL to match your MySQL credentials
python app.py                    # runs on http://localhost:5000
```
On first run, if the `users` table is empty, the app seeds a default user ("Pia") plus starter banks (BPI, BDO, GCash, Maya) and must-haves (Rent, Electricity, Water, Internet) so the app isn't empty on first load. Add more people from the `/api/users` endpoint (a simple "add user" UI is a natural next step if you want one).

### Frontend (Angular)
```bash
cd frontend
npm install
npm start                        # runs on http://localhost:4200, proxies to localhost:5000 per environment.ts
```
Open `http://localhost:4200` on your phone (same wifi network, use your computer's local IP instead of localhost) to test the mobile layout for real.

---

## 2. Deploying for free

A solid free-tier combo, since MySQL specifically (not Postgres) is a requirement:

**Database — Railway** (free MySQL, easiest path)
1. Create a project at railway.app → "Provision MySQL".
2. Open the MySQL service → copy the connection string it gives you.
3. Run `backend/schema.sql` against it (Railway's web console has a query tab, or connect locally with `mysql -h <host> -P <port> -u <user> -p < backend/schema.sql`).

**Backend — Railway or Render** (both have Flask-friendly free tiers)
1. Push the `backend/` folder to a GitHub repo (or the whole `cutoff-app` repo, root directory setting = `backend`).
2. New Web Service → connect the repo → it will detect `Procfile` (`web: gunicorn app:app`).
3. Set the environment variable `DATABASE_URL` to the Railway MySQL connection string, formatted as:
   `mysql+pymysql://<user>:<password>@<host>:<port>/railway`
4. Deploy. Note the resulting URL (e.g. `https://cutoff-backend.up.railway.app`).

**Frontend — Vercel or Netlify** (free static hosting, great for Angular)
1. Update `frontend/src/environments/environment.prod.ts` → set `apiUrl` to your deployed backend URL + `/api`.
2. Push `frontend/` to GitHub.
3. Import the repo on Vercel/Netlify. Build command: `npm run build`. Output directory: `dist/cutoff-frontend/browser` (Angular's new "application" builder nests output under `/browser`).
4. Deploy — you'll get a URL you can open straight from your phone's home screen (add to home screen for an app-like feel).

---

## 3. Notes & next steps

- **Auth**: intentionally no passwords per your call — anyone with the URL can switch users. Fine for personal/family use; add real auth later if this ever leaves your household.
- **Filters** (date range chips on Dashboard/History) are currently visual placeholders — wiring them to actual date-range queries is a quick follow-up once you're using the app day-to-day and know what ranges you actually reach for.
- **Savings forecast** is a simple mode-based projection (most frequent deposit × cutoffs remaining in the year). Easy to make smarter later (e.g. trailing 3-cutoff average) if the simple version feels off.
- The Angular app talks to Flask entirely over `X-User-Id`/`user_id` — no cookies/sessions — matching the "no login" decision.
