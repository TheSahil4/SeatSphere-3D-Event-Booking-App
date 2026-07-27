# SeatSphere

A 3D event seat booking and venue management platform.

## Requirements

- Node.js 20 or later
- npm

## Installation

```bash
npm install
```

## Environment Setup

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Start Development Server

```bash
npm run dev
```

The app runs at http://localhost:5173

## Production Build

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

## Common Fix

If dependencies are corrupted:

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

Windows PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
npm run dev
```

## Demo Accounts

- Customer: customer@seatsphere.demo
- Admin: admin@seatsphere.demo
- Manager: manager@seatsphere.demo
- Gate Staff: staff@seatsphere.demo
- Password: Demo@12345

## Debug

Visit `/debug` to view runtime diagnostics.
