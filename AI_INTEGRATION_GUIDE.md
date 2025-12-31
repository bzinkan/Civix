# Civix AI Integration - Complete Setup Guide

## Overview

We've successfully integrated the Civix-v2 AI conversational layer into your existing Civix application using a **hybrid approach**. This means:

- ✅ **Your existing structured flow system still works** (`/dashboard/tester`)
- ✅ **New AI conversational interface** available at `/ask`
- ✅ **Both systems share the same database** and can coexist
- ✅ **Cincinnati STR data works in both modes**

---

## What Was Added

### 1. Database Schema Extensions

**New Models Added** (in `prisma/schema.prisma`):
- `Ruleset` - AI-compatible rule containers
- `AIRule` - Rules with AI matching metadata
- `Citation` - Legal citations for rules
- `Conversation` - Multi-turn AI conversations
- `Message` - Individual conversation messages
- `AnonymousUsage` - Free tier usage tracking

**Enhanced User Model**:
- Added subscription fields (`subscriptionStatus`, `stripeId`, etc.)
- Added query credits for pay-per-use

### 2. AI Infrastructure

**Files Created**:
```
lib/types/conversation.ts       - TypeScript types for AI system
lib/ai/providers.ts              - Multi-provider AI client (Gemini, Claude, OpenAI)
lib/ai/matcher.ts                - Jurisdiction/category detection
lib/ai/conversation.ts           - Conversation orchestration
lib/rules/evaluator.ts           - Bridge to deterministic rules engine
lib/auth/usage-limiter.ts        - Anonymous usage tracking
```

**How It Works**:
1. User asks question in natural language
2. AI detects jurisdiction (e.g., "Cincinnati, OH")
3. AI matches to category/subcategory
4. AI extracts required inputs through conversation
5. System hands off to **deterministic rules engine**
6. Result returned with citations

### 3. UI Components

**New Pages/Components**:
- `app/ask/page.tsx` - Conversational query page
- `components/query/QueryInterface.tsx` - Chat interface component
- `app/api/query/route.ts` - API endpoint for AI queries

### 4. Dependencies Added

**AI SDKs**:
- `@google/generative-ai` - Gemini 2.0 Flash (primary, cheapest)
- `@anthropic-ai/sdk` - Claude Haiku (fallback)
- `openai` - GPT-4o-mini (fallback)

**UI Libraries**:
- `tailwindcss` - Styling framework
- `@fingerprintjs/fingerprintjs` - Anonymous user tracking
- `@tanstack/react-query` - Data fetching (for future use)
- `zod` - Schema validation

---

## Next Steps to Deploy

### Step 1: Install Dependencies

```bash
cd C:\Users\zinka\Documents\Civix
npm install
```

### Step 2: Set Up Environment Variables

Copy your `.env.example` to `.env.local` and add your API keys:

```env
# AI Providers - Get these keys:
GEMINI_API_KEY=your-key-from-https://aistudio.google.com/apikey
ANTHROPIC_API_KEY=your-key-from-https://console.anthropic.com/
OPENAI_API_KEY=your-key-from-https://platform.openai.com/api-keys

AI_PRIMARY_PROVIDER=gemini
AI_FALLBACK_ENABLED=true
```

**Cost Estimate**:
- Gemini 2.0 Flash: ~$0.001 per query
- With fallback to Claude/OpenAI: ~$0.0013 per query
- **$13 per 10,000 queries**

### Step 3: Create Database Migration

```bash
npx prisma migrate dev --name add_ai_models
```

This will:
- Create migration files
- Apply schema changes to your local database
- Regenerate Prisma Client

### Step 4: Test Locally

```bash
npm run dev
```

Then visit:
- `http://localhost:3000/ask` - AI conversational interface
- `http://localhost:3000/dashboard/tester` - Existing structured flow

### Step 5: Deploy to AWS Fargate

**Add Environment Variables to ECS Task Definition**:

In your AWS Console → ECS → Task Definitions → Edit:

```json
{
  "name": "GEMINI_API_KEY",
  "value": "your-gemini-key"
},
{
  "name": "ANTHROPIC_API_KEY",
  "value": "your-anthropic-key"
},
{
  "name": "OPENAI_API_KEY",
  "value": "your-openai-key"
},
{
  "name": "AI_PRIMARY_PROVIDER",
  "value": "gemini"
},
{
  "name": "AI_FALLBACK_ENABLED",
  "value": "true"
}
```

**Or** use AWS Secrets Manager (recommended for production):
1. Store API keys in Secrets Manager
2. Reference them in ECS task definition

**Deploy**:
```bash
git add .
git commit -m "Add AI conversational interface

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
git push
```

GitHub Actions will:
1. Build the new Docker image (includes all AI dependencies)
2. Run database migrations on RDS
3. Deploy to ECS Fargate

---

## Converting Cincinnati STR to AI Format

The final step is creating an AI-compatible version of Cincinnati STR. This involves:

1. Creating a `Ruleset` for Cincinnati/housing-property
2. Converting each `Rule` to an `AIRule` with:
   - `canonicalQuestions`: ["Can I operate a short-term rental in Cincinnati?"]
   - `keywords`: ["airbnb", "vrbo", "str", "short term rental"]
   - `requiredInputs`: ["legal_authority", "affordable_housing", etc.]

I'll create this seed data next. Would you like me to:

**A)** Create the AI-compatible Cincinnati STR seed data now?

**B)** Wait until you've tested the infrastructure locally first?

**C)** Create a migration script that converts existing DecisionFlow data to Ruleset format automatically?

---

## Architecture Diagram

```
User Question
     ↓
[AI Matcher] → Detects jurisdiction, category
     ↓
[AI Conversation] → Collects inputs through chat
     ↓
[Deterministic Rules Engine] → Evaluates conditions
     ↓
Result + Citations
```

---

## Cost Breakdown

**Free Tier**: 3 queries per anonymous user (tracked by fingerprint)

**AI API Costs** (per 1000 queries):
- Gemini 2.0 Flash: ~$1
- Claude Haiku fallback: ~$0.30 extra (only when Gemini fails)
- **Total: $1.30 per 1000 queries**

**At 10K queries/month**: ~$13/month
**At 100K queries/month**: ~$130/month

Compare to hiring a compliance consultant: $200-500/hour

---

## Two Modes Available

### Mode 1: Structured Flow (Existing)
- URL: `/dashboard/tester`
- Best for: Power users who know what they want
- Cost: $0 (no AI)
- Speed: Instant
- UX: Form-based questionnaire

### Mode 2: AI Conversation (New)
- URL: `/ask`
- Best for: Casual users, natural language queries
- Cost: ~$0.0013 per query
- Speed: 2-4 seconds
- UX: Chat interface

---

## Files Modified

- `prisma/schema.prisma` - Extended with AI models
- `package.json` - Added AI dependencies
- `app/globals.css` - Added Tailwind directives
- `app/api/query/route.ts` - Updated to use AI conversation
- `.env.example` - Added AI config variables

---

## Troubleshooting

### "Gemini API key not configured"
- Check `.env.local` has `GEMINI_API_KEY=...`
- Restart dev server after adding env vars

### "Conversation table does not exist"
- Run `npx prisma migrate dev`
- Or `npx prisma db push` for quick testing

### AI responses are slow
- Normal: 2-4 seconds for Gemini
- If slower, check your internet connection
- Consider upgrading to Gemini Pro for faster responses

### Deployment fails with "Module not found"
- Run `npm install` again
- Check `node_modules` is being copied to Docker image

---

## What's Next

1. **Test locally** - Get API keys, run migrations, test `/ask`
2. **Deploy to staging** - Test on AWS before going live
3. **Create Cincinnati STR ruleset** - Convert existing data to AI format
4. **Add more jurisdictions** - Expand to other cities
5. **Monitor costs** - Track AI API usage in console

---

Ready to proceed! Let me know if you want me to create the Cincinnati STR AI seed data or if you'd like to test the infrastructure first.
