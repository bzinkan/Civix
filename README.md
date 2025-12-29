Civix

Civix is an industry-agnostic compliance and rules-interpretation platform.

It provides clear, authoritative answers to questions like “Is this allowed?” (the What) and monetizes the actionable guidance on “How to comply” (the How) through reports and subscriptions.

The system is designed to work across industries including zoning, animals, business regulation, construction, and environmental rules.

Core Principles

Single deployable application

Frontend + backend in one Next.js repo

Free answers prove knowledge

Paid reports deliver execution

Rules engine is industry-agnostic

Infrastructure stays boring and stable

Tech Stack

Framework: Next.js (App Router)

Runtime: Node.js 24

Backend: Next.js API routes

Database: PostgreSQL (AWS RDS)

ORM: Prisma

Payments: Stripe (subscriptions + one-time purchases)

Hosting: AWS Elastic Beanstalk

CI: GitHub Actions

Repo Structure (High Level)
app/            → UI + API routes
lib/            → Business logic (rules, auth, permissions)
components/     → Reusable UI components
prisma/         → Database schema
.github/        → CI workflows
.elasticbeanstalk/ → EB configuration
.ebextensions/  → EB environment config

Free vs Paid Model
Free (“What”)

Clear, direct answers

Example:

“⚠️ Restricted. You generally cannot build a front-yard fence here.”

Paid (“How”)

Compliance reports

Permit steps

Required forms

Pre-vetted service providers

Available via:

One-time purchase

Monthly subscription

API Design
Endpoint	Purpose
/api/health	Deployment & uptime checks
/api/query	Free compliance answers
/api/report	Paid compliance reports
/api/auth	Authentication
/api/stripe	Payments & webhooks
Rules Engine

Rules live in lib/rules/ and are separated by domain:

lib/rules/
├── zoning.ts
├── animals.ts
├── business.ts


New industries are added without infrastructure changes.

Authentication & Payments

Authentication is required for paid access

Stripe handles:

Monthly subscriptions

One-time purchases

Auth and payments are implemented minimally to avoid early lock-in

Environment Variables

Copy .env.example to .env and configure:

DATABASE_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXTAUTH_SECRET=


Secrets are managed via AWS Elastic Beanstalk environment variables in production.

Development
npm install
npm run dev


App runs at:
http://localhost:3000

Rule Tester

Use `/dashboard/tester` to select a flow and jurisdiction, enter answers, and run
the decision engine with debug output (matched/failed rule IDs and the first
failed condition).

Rule conditions should reference stable question keys using the `answers.` path,
for example: `answers.is_restricted_breed`.

CI / Deployment

GitHub Actions validates builds on every push

Elastic Beanstalk deploys from the main branch

Target state:

push → CI → deploy → live URL

Status

🚧 Active development
Infrastructure and architecture are locked before feature expansion.

License

Private / Proprietary
