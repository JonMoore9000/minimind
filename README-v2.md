# MiniMind v2 - AI-Powered Learning for Kids

MiniMind is an AI-powered educational platform designed for children aged 3-10. It provides age-appropriate explanations, personalized stories, bedtime mode, and learning activities with a freemium subscription model.

## Features

### Free Plan (MiniMind Basic)
- 5 chats per day
- Basic Q&A mode
- Single child profile
- No saved history

### Plus Plan (MiniMind Plus) - $7/month
- Unlimited chats (fair-use)
- Personalized stories with child's name and favorites
- Bedtime mode with gentle stories and lullabies
- Learning mode with age-appropriate explanations
- Save & replay favorite stories
- Parent dashboard
- Up to 5 child profiles
- Chat history saved for 1 year

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS, Framer Motion
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **AI**: OpenAI GPT-4
- **Deployment**: Vercel (recommended)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo>
cd minimind
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and keys
3. In the SQL Editor, run the contents of `supabase-schema.sql` to create all tables
4. Configure authentication:
   - Go to Authentication > Settings
   - Add your domain to "Site URL" and "Redirect URLs"
   - Enable email authentication

### 3. Set up Stripe

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Create a product called "MiniMind Plus" with a monthly subscription price of $7
3. Note down the product ID and price ID
4. Update `lib/stripe.ts` with your actual product and price IDs
5. Set up a webhook endpoint pointing to `https://yourdomain.com/api/stripe/webhook`
6. Configure webhook to listen for these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 4. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- `OPENAI_API_KEY` - Your OpenAI API key
- `APP_URL` - Your app URL (http://localhost:3000 for development)

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
├── app/
│   ├── api/                 # API routes
│   │   ├── stripe/         # Stripe integration
│   │   ├── explain/        # Basic Q&A endpoint
│   │   ├── story/          # Story generation
│   │   ├── bedtime/        # Bedtime stories
│   │   ├── learning/       # Learning mode
│   │   └── child-profiles/ # Child profile management
│   ├── auth/               # Authentication pages
│   ├── app/                # Main app (protected)
│   ├── pricing/            # Pricing page
│   └── page.tsx            # Landing page
├── lib/
│   ├── supabase/           # Supabase client configuration
│   ├── types/              # TypeScript types
│   ├── subscription.ts     # Plan management utilities
│   └── stripe.ts           # Stripe configuration
├── middleware.ts           # Auth middleware
├── supabase-schema.sql     # Database schema
└── .env.example           # Environment variables template
```

## Key Features Implementation

### Authentication & Authorization
- Supabase Auth with email/password
- Row Level Security (RLS) on all tables
- Middleware for protected routes
- User profiles automatically created on signup

### Subscription Management
- Stripe integration for payments
- Webhook handling for subscription events
- Plan-based feature flags
- Usage tracking and limits

### AI Features
- OpenAI GPT-4 integration
- Age-appropriate content filtering
- Personalized stories using child profiles
- Different modes: explain, story, bedtime, learning

### Database Design
- User profiles with plan information
- Child profiles with favorites for personalization
- Usage counters for daily limits
- Stories and chat sessions for history
- Subscription tracking

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Testing Stripe Integration

1. Use Stripe test keys during development
2. Test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
3. Use webhook testing with Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

## Support

For questions or issues, please check the code comments or create an issue in the repository.

## License

This project is for educational purposes. Please ensure you comply with all service terms (OpenAI, Stripe, Supabase) when deploying.
