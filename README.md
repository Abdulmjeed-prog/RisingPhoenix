# Saaf

A specialized marketplace platform that bridges the gap between people who want unique, custom-made items and the skilled artisans who can build them. Unlike standard e-commerce sites where users buy finished goods, Saaf focuses on the **collaboration journey** — from a rough sketch to a finished masterpiece.

## Overview

Clients post custom requests (with reference images, budget, and deadlines), workshops submit proposals, and the two parties collaborate through a structured workflow that covers messaging, progress updates, milestone-based payments, and dispute resolution.

## Features

- **Custom requests & proposals** — Clients describe what they want; workshops bid with timelines and pricing.
- **Workshop & artisan accounts** — Separate roles for clients, workshops, and staff with dedicated dashboards.
- **Progress tracking** — Milestone-based updates so clients can follow a project from sketch to completion.
- **In-app messaging** — Direct communication between clients and workshops on each project.
- **Secure payments** — Stripe integration for proposal payments and milestone releases.
- **Disputes** — A formal dispute flow when projects go sideways.
- **Invitations** — Workshops can be invited to bid on specific requests.
- **Notifications** — In-app notifications plus Twilio-powered SMS for key events.
- **Content moderation** — Automatic profanity and image moderation (better-profanity + NudeNet + OpenAI).
- **Internationalization** — Multi-language support via Django's i18n with compiled message catalogs.
- **Phone verification** — International phone number support with `django-phonenumber-field`.

## Tech Stack

- **Backend:** Django 5.2, Python 3.11
- **Database:** PostgreSQL (production) / SQLite (development)
- **Storage:** AWS S3 via `django-storages` (production), local filesystem (development)
- **Static files:** WhiteNoise
- **Payments:** Stripe
- **SMS / OTP:** Twilio
- **AI / Moderation:** OpenAI, NudeNet, better-profanity
- **Deployment:** Render (via `render.yaml`), Gunicorn

## Project Structure

```
rising_phoenix/
├── account/        # Auth, user accounts, profiles
├── workshop/       # Workshop profiles and management
├── staff/          # Admin/staff dashboards
├── request/        # Custom-build requests from clients
├── proposal/       # Workshop proposals on requests
├── progress/       # Project milestones and updates
├── message/        # In-app messaging
├── payment/        # Stripe payments
├── dispute/        # Dispute handling
├── invitation/     # Workshop invitations
├── notification/   # In-app + SMS notifications
├── main/           # Landing, shared views
├── demo_data/      # Seed/demo data fixtures
├── locale/         # Translation catalogs
└── rising_phoenix/ # Project settings, urls, moderation config
```

## Getting Started

### Prerequisites

- Python 3.11
- pip
- (Optional) PostgreSQL if you don't want to use the default SQLite

### Setup

```bash
# 1. Clone
git clone https://github.com/<your-org>/RisingPhoenix.git
cd RisingPhoenix

# 2. Create a virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create a .env file (see "Environment variables" below)

# 5. Run migrations
cd rising_phoenix
python manage.py migrate

# 6. (Optional) Compile translation messages
python manage.py compilemessages

# 7. Create a superuser
python manage.py createsuperuser

# 8. Run the dev server
python manage.py runserver
```

The app will be available at http://127.0.0.1:8000.

### Environment variables

Create a `.env` file in the project root with values appropriate for your environment:

```env
SECRET_KEY=your-django-secret-key
DEBUG=True

# Database (optional — defaults to SQLite if unset)
DATABASE_URL=postgres://user:password@localhost:5432/rising_phoenix

# Stripe
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio (SMS / OTP)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890

# OpenAI (moderation)
OPENAI_API_KEY=sk-...

# AWS S3 (production media storage)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_STORAGE_BUCKET_NAME=...
AWS_S3_REGION_NAME=...
```

## Deployment

This project is configured to deploy on [Render](https://render.com) via the included `render.yaml`. It provisions a web service plus a PostgreSQL database, and on each deploy it:

1. Installs dependencies
2. Compiles translation messages
3. Collects static files
4. Runs migrations
5. Starts Gunicorn

Set the required secrets (Stripe, Twilio, OpenAI, AWS) in the Render dashboard.

## Design & Documentation

- **Wireframes:** [resources/wireframe/wireframe1.html](resources/wireframe/wireframe1.html) — open in a browser to view the UI mockups.
- **UML diagram:** [resources/UML_Diagram/UML.png](resources/UML_Diagram/UML.png) — high-level data model and relationships.

## Demo Data

A `demo_data` app is included with fixtures to seed the database with sample users, workshops, requests, and proposals for local testing.

## Tests

Tests live in the `test/` directory at the repo root.

```bash
cd rising_phoenix
python manage.py test
```

## License

This project is a capstone deliverable. License terms TBD by the project owners.
