# MekaStore Media Center

File sharing and media management platform for MekaStore ecosystem.

## Features

- **File Upload** - Drag & drop, multiple files, up to 500MB
- **Public Links** - Direct playable links for videos/images (works with WhatsApp)
- **Password Protection** - Optional password for shared files
- **Folder Organization** - Organize files in folders
- **Dashboard** - Stats: files count, storage used, downloads
- **Authentication** - Admin/Viewer roles with NextAuth

## Tech Stack

- Next.js 14 + TypeScript + TailwindCSS
- PostgreSQL 15 + Prisma ORM
- NextAuth (credentials)
- Docker Compose

## Quick Start (Development)

```bash
npm install
cp .env.example .env   # edit DATABASE_URL
npx prisma db push
npm run db:seed         # creates admin@mekastore.com / admin123
npm run dev
```

## Docker Deployment

```bash
cp .env.example .env    # edit secrets
docker compose up -d
```

## Default Credentials

- **Email**: admin@mekastore.com
- **Password**: admin123

## URLs

- **Dashboard**: https://media.mekastore.com/dashboard
- **Direct file link**: `https://media.mekastore.com/api/public/{token}/{filename}`
- **Share page**: `https://media.mekastore.com/share/{token}`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `NEXTAUTH_SECRET` | JWT secret key | - |
| `NEXTAUTH_URL` | App base URL | https://media.mekastore.com |
| `PORT` | Server port | 3200 |
| `UPLOAD_DIR` | Upload directory path | /app/uploads |
