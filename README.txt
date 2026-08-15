DIVYANGSATHI CMS ACCESS FIX

Files to replace in GitHub root:
1) cms.js
2) admin-cms.js
3) cms-page-manager.js

Then run CMS_ADMIN_RECOVERY.sql ONCE in Supabase SQL Editor.

Why:
- Website CMS and Admin CMS were checking public.admins directly.
- If RLS blocks the row, CMS showed a false Access Denied.
- If the admin row was accidentally deleted, the recovery SQL restores it from auth.users.
- The new JS first uses public.is_active_admin() and falls back to direct lookup.

Do NOT replace membership.html/app.js from the older project ZIP with this fix package.
