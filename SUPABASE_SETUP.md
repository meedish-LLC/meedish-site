# Meedish — Supabase Setup Guide

This guide covers everything needed to connect and configure Supabase for the Meedish website.
Run the SQL sections **in order** in the **Supabase SQL Editor** (Dashboard → SQL Editor → New query).

---

## 1. Project Connection

Edit `supabase.js` with your project's values:

```js
const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY';
```

Find these in: **Supabase Dashboard → Project Settings → API**.

---

## 2. Database Tables

### 2.1 — `services` table

Stores the four service cards shown on the homepage (Graphic Design, Web Design, UI/UX, Custom Service Hubs).
> **Note:** The homepage currently uses **hardcoded HTML buttons**. The `services` table is managed from the admin panel for future dynamic rendering.

```sql
CREATE TABLE IF NOT EXISTS services (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    icon        TEXT NOT NULL,           -- e.g. "fas fa-paint-brush"
    background_image TEXT,              -- storage path in the "services" bucket
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 2.2 — `team` table

Stores team members displayed in the Team section (loaded dynamically).

```sql
CREATE TABLE IF NOT EXISTS team (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              TEXT NOT NULL,
    role              TEXT NOT NULL,
    short_description TEXT NOT NULL,
    full_description  TEXT,
    image             TEXT,             -- storage path in the "team" bucket
    portfolio_link    TEXT,             -- optional external URL
    created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 2.3 — `portfolio` table

Stores portfolio projects. Category is embedded in `description` using the delimiter `||CATEGORY||`.

```sql
CREATE TABLE IF NOT EXISTS portfolio (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    description TEXT NOT NULL,          -- format: "Description text||CATEGORY||meedish"
    project_url TEXT NOT NULL,
    image       TEXT,                   -- storage path in the "portfolio" bucket
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

**Valid category values** (appended after `||CATEGORY||`):
| Value | Label shown |
|-------|-------------|
| `meedish` | Meedish Projects |
| `gravity` | Meedish & Gavity |
| `globyte` | Meedish & Globyte |

---

### 2.4 — `admin_settings` table

Stores the hashed admin password for the admin panel login.

```sql
CREATE TABLE IF NOT EXISTS admin_settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the default password row (password is "admin1")
INSERT INTO admin_settings (key, value)
VALUES (
    'admin_password',
    '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
)
ON CONFLICT (key) DO NOTHING;
```

> ⚠️ **IMPORTANT — Change the admin password immediately after first login!**
> The default password is **`admin1`**. Use the "Change Password" button in the admin panel right away.

---

## 3. Row Level Security (RLS) Policies

Enable RLS on all tables, then set policies so the public can **read** data and only the anon key (used by the admin panel client-side) can **write**.

```sql
-- ── SERVICES ──────────────────────────────────────────────
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on services"
    ON services FOR SELECT USING (true);

CREATE POLICY "Allow anon insert on services"
    ON services FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon update on services"
    ON services FOR UPDATE USING (true);

CREATE POLICY "Allow anon delete on services"
    ON services FOR DELETE USING (true);


-- ── TEAM ──────────────────────────────────────────────────
ALTER TABLE team ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on team"
    ON team FOR SELECT USING (true);

CREATE POLICY "Allow anon insert on team"
    ON team FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon update on team"
    ON team FOR UPDATE USING (true);

CREATE POLICY "Allow anon delete on team"
    ON team FOR DELETE USING (true);


-- ── PORTFOLIO ─────────────────────────────────────────────
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on portfolio"
    ON portfolio FOR SELECT USING (true);

CREATE POLICY "Allow anon insert on portfolio"
    ON portfolio FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon update on portfolio"
    ON portfolio FOR UPDATE USING (true);

CREATE POLICY "Allow anon delete on portfolio"
    ON portfolio FOR DELETE USING (true);


-- ── ADMIN SETTINGS ────────────────────────────────────────
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on admin_settings"
    ON admin_settings FOR SELECT USING (true);

CREATE POLICY "Allow anon update on admin_settings"
    ON admin_settings FOR UPDATE USING (true);

CREATE POLICY "Allow anon insert on admin_settings"
    ON admin_settings FOR INSERT WITH CHECK (true);
```

---

## 4. Storage Buckets

Create three **public** storage buckets — one per content type.

### 4.1 — Via Dashboard

1. Go to **Storage** in the left sidebar.
2. Click **New bucket**.
3. Create each bucket below with **"Public bucket"** toggled ON:

| Bucket name | Used for |
|-------------|----------|
| `services`  | Service card background images |
| `team`      | Team member profile photos |
| `portfolio` | Portfolio project screenshots |

### 4.2 — Via SQL (alternative)

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES
    ('services',  'services',  true),
    ('team',      'team',      true),
    ('portfolio', 'portfolio', true)
ON CONFLICT (id) DO NOTHING;
```

### 4.3 — Storage RLS Policies

Allow public reads and anon uploads/deletes:

```sql
-- ── SERVICES BUCKET ───────────────────────────────────────
CREATE POLICY "Public read services"
    ON storage.objects FOR SELECT USING (bucket_id = 'services');

CREATE POLICY "Anon upload services"
    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'services');

CREATE POLICY "Anon delete services"
    ON storage.objects FOR DELETE USING (bucket_id = 'services');


-- ── TEAM BUCKET ───────────────────────────────────────────
CREATE POLICY "Public read team"
    ON storage.objects FOR SELECT USING (bucket_id = 'team');

CREATE POLICY "Anon upload team"
    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'team');

CREATE POLICY "Anon delete team"
    ON storage.objects FOR DELETE USING (bucket_id = 'team');


-- ── PORTFOLIO BUCKET ──────────────────────────────────────
CREATE POLICY "Public read portfolio"
    ON storage.objects FOR SELECT USING (bucket_id = 'portfolio');

CREATE POLICY "Anon upload portfolio"
    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'portfolio');

CREATE POLICY "Anon delete portfolio"
    ON storage.objects FOR DELETE USING (bucket_id = 'portfolio');
```

---

## 5. Admin Panel Usage

| URL | Purpose |
|-----|---------|
| `index.html` | Public website |
| `admin.html` | Content management (password-protected) |

**Default credentials:**
- Password: `admin1`
- Change immediately via **Change Password** button after logging in.

**What the admin panel manages:**
- **Services tab** — Add/edit/delete services (used by `services` table; homepage still uses static HTML).
- **Team tab** — Add/edit/delete team members (dynamically loaded on homepage).
- **Portfolio tab** — Add/edit/delete portfolio items with category selection (dynamically loaded on homepage).

---

## 6. Verification Checklist

After completing setup, verify:

- [ ] `supabase.js` has correct URL and anon key
- [ ] All 4 tables exist in **Table Editor**
- [ ] All 3 storage buckets are created and marked **public**
- [ ] Opening `index.html` → Team section loads (check browser console for errors)
- [ ] Opening `index.html` → Portfolio section shows scrolling cards
- [ ] Opening `admin.html` → Login with `admin1` works
- [ ] Admin panel → add a test team member → verify it appears on `index.html`
- [ ] Admin panel → Change Password immediately

---

## 7. Troubleshooting

| Error | Likely Cause | Fix |
|-------|-------------|-----|
| `relation "team" does not exist` | Table not created | Run SQL in section 2 |
| `JWT expired` or `JWT invalid` | Wrong anon key in `supabase.js` | Copy key from Dashboard → API |
| Images not showing | Bucket not public or RLS missing | Re-run storage SQL in section 4 |
| 403 on insert/update/delete | RLS blocking writes | Run policies in section 3 |
| Admin login always fails | `admin_settings` row missing | Run INSERT in section 2.4 |
| `updated_at` column error on password change | Column missing from `admin_settings` | Ensure you ran the full CREATE TABLE in section 2.4 |
