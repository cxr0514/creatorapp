# AI Content Wizard 🎬

Transform your long videos into engaging, shareable clips with the power of AI.

## Features

- 🔐 **Google OAuth Authentication** - Secure sign-in with Google
- 📹 **Video Upload** - Drag & drop video files up to 500MB
- ☁️ **Cloud Storage** - Videos stored securely on Backblaze B2
- 🎯 **AI-Powered Clipping** - Create clips from your videos (coming soon)
- 📱 **Responsive Design** - Works on desktop and mobile
- 🗄️ **Database Integration** - PostgreSQL with Prisma ORM

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: PostgreSQL with Prisma ORM
- **Storage**: Backblaze B2 (S3-compatible) for video and image storage
- **Authentication**: Google OAuth via NextAuth.js
- **UI Components**: Shadcn/ui components

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Google OAuth credentials
- Backblaze B2 account

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd creatorapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file with the following variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/contentwizard"
   
   # NextAuth
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   # Backblaze B2 Storage
   B2_BUCKET_NAME="your-bucket-name"
   B2_KEY_ID="your-b2-key-id"
   B2_APP_KEY="your-b2-application-key"
   B2_ENDPOINT="https://s3.us-west-002.backblazeb2.com"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Sign In**: Click "Sign In with Google" on the landing page
2. **Upload Videos**: Drag and drop video files or click to select
3. **Manage Content**: View your uploaded videos in the dashboard
4. **Create Clips**: (Feature coming soon) Generate clips from your videos

## Project Structure

```
src/
├── app/
│   ├── api/          # API routes
│   │   ├── auth/     # NextAuth configuration
│   │   ├── videos/   # Video management APIs
│   │   └── clips/    # Clip management APIs
│   ├── globals.css   # Global styles
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Home page
├── components/
│   ├── dashboard/    # Dashboard components
│   ├── landing/      # Landing page components
│   ├── providers/    # Context providers
│   └── ui/           # Reusable UI components
└── lib/
    ├── prisma.ts     # Prisma client
    ├── b2.ts         # Backblaze B2 storage utilities
    └── utils.ts      # Utility functions
```

## Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

### Backblaze B2 Setup

1. Sign up at [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html)
2. Create a bucket for your application
3. Generate application keys with read/write permissions
4. Note your endpoint URL (typically `https://s3.us-west-002.backblazeb2.com`)
5. Add the credentials to your `.env.local` file

### Database Setup

1. Install PostgreSQL locally or use a cloud provider
2. Create a database named `contentwizard`
3. Update the `DATABASE_URL` in your `.env.local` file

## Development

- **Start development server**: `npm run dev`
- **Build for production**: `npm run build`
- **Start production server**: `npm start`
- **Database operations**: `npx prisma studio` (database GUI)
- **Reset database**: `npx prisma db push --force-reset`

## Storage Migration

This application has been migrated from Cloudinary to Backblaze B2 for cost-effective, scalable storage. B2 provides:

- S3-compatible API for easy integration
- Significantly lower storage costs
- High durability and availability
- Simple pricing structure

All video uploads, thumbnails, and template assets are now stored in Backblaze B2 with presigned URLs for secure access.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

If you have any questions or need help, please open an issue in the repository.
