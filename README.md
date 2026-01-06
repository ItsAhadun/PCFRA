# Fire Assessment Application

A comprehensive, mobile-first application for managing fire risk assessments, sites, and tenants. Built with Next.js and Supabase.

## Features

- **🔥 Fire Risk Assessments**: Interactive, step-by-step wizards for conducting detailed fire risk assessments (Hazards, Escape Routes, Fire Detection, etc.).
- **🏢 Site & Building Management**: Easily create, organize, and manage sites and buildings.
- **👥 Tenant Management**: Digital tenant registration system with secure links.
- **📱 Mobile-First Design**: Optimized interface for tablets and mobile devices to facilitate on-site inspections.
- **🔳 QR Code Integration**:
  - **Batch Printing**: Generate and print PDF sheets of QR codes for building registration points.
  - **Scanner**: Built-in QR code scanner for quick tenant registration and building access.
- **🔐 Secure Authentication**: Robust user management powered by Supabase Auth.

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org) (App Router)
- **Database & Auth**: [Supabase](https://supabase.com)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com)
- **Testing**: Vitest & React Testing Library

## Getting Started

### Prerequisites

- Node.js >= 18.17.0
- pnpm

### Locally

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd fire-assessment
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Environment Setup:**

   Rename `.env.local.example` to `.env.local` and configure your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=[YOUR_SUPABASE_URL]
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[YOUR_SUPABASE_ANON_KEY]
   ```

4. **Run the development server:**

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

- `pnpm dev`: Runs the development server.
- `pnpm build`: Builds the application for production.
- `pnpm start`: Starts the production server.
- `pnpm test`: Runs unit tests.
- `pnpm lint`: Runs ESLint.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
