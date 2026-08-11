# DivyangSathi Final Setup

This package keeps User and Admin themes separate and contains all website assets.

## Required one-time Supabase step
Run `FINAL_SETUP.sql` in Supabase SQL Editor. This enables approved profile reviews and reliable Admin alerts for new users, interests, UTR/membership requests, and reports.

## Email notifications
A production-safe template is included in `supabase/functions/send-email/`. Deploy it as a Supabase Edge Function and set `RESEND_API_KEY` and `EMAIL_FROM`. Browser code never contains secret API keys. Configure database webhooks or call the Edge Function from trusted server-side flows for registration, interest, membership and approval emails.

## WhatsApp payment alerts
Template is in `supabase/functions/send-whatsapp/`. Deploy it and set `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and `ADMIN_WHATSAPP_NUMBER`. Use Meta WhatsApp Business Cloud API credentials.

## OTP login
The login page uses Supabase `signInWithOtp`. In Supabase Auth settings, enable email sign-in / OTP and add your deployed site URL + `profile.html` redirect URL.

## AI Match / Fake Profile
Existing Match % is retained. The new fake-profile indicator is intentionally a non-destructive heuristic review signal, not a claim of ML identity detection and never auto-bans users. A true ML system would require a separately deployed model/service.

## Google Map
Only district/state-level Google Maps embed is shown on profile details to avoid exposing a private street address.

## Before production
Test Auth, RLS, membership approval, reports, admin access, OTP redirect, email/WhatsApp credentials, and mobile layouts on a staging copy first.
