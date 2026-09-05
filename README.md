# NeuroHire AI

NeuroHire AI is an enterprise-grade Applicant Tracking System (ATS) powered by generative AI. It automates resume screening, interview scheduling, and intelligent candidate matching.

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL (Neon Serverless) + Prisma ORM
- **Authentication:** Auth.js (NextAuth v5)
- **AI Integration:** OpenAI `gpt-4o` + Vercel AI SDK
- **Background Jobs:** Inngest
- **Payments:** Stripe
- **Styling:** Tailwind CSS + shadcn/ui

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Stripe Account
- OpenAI API Key

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sriteja2007/NeuroHire-AI.git
   cd NeuroHire-AI
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env` and fill in your secrets.
   ```bash
   cp .env.example .env
   ```

4. **Initialize the Database:**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```

6. **Start Inngest (Background Jobs):**
   In a separate terminal, start the Inngest local dev server:
   ```bash
   npx inngest-cli@latest dev
   ```

## Documentation
- [System Architecture](./ARCHITECTURE.md)

## Contributing
Please refer to standard Git workflows. Run `npm run lint` and `npm run build` before pushing to ensure all checks pass.
