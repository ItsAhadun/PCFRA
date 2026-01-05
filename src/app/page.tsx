import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { createClient } from '@/supabase/server'
import {
  Flame,
  Shield,
  ClipboardCheck,
  Building2,
  FileText,
  ArrowRight,
  CheckCircle,
} from 'lucide-react'

const FEATURES = [
  {
    icon: ClipboardCheck,
    title: '10-Section Wizard',
    description:
      'Comprehensive assessment covering fire doors, escape routes, detection systems, and more.',
  },
  {
    icon: Shield,
    title: '5×5 Risk Matrix',
    description:
      'Automated risk scoring with Severity × Likelihood calculation and critical alerts.',
  },
  {
    icon: Building2,
    title: 'High-Rise Ready',
    description:
      'Special modules for buildings over 18m, meeting Building Safety Act 2022 requirements.',
  },
  {
    icon: FileText,
    title: 'Golden Thread',
    description:
      'Full audit trail and documentation to satisfy legal compliance inquiries.',
  },
]

export default async function Home() {
  // Check if user is authenticated
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  return (
    <div className="from-background to-muted min-h-screen bg-gradient-to-b">
      {/* Navigation */}
      <nav className="bg-background/80 sticky top-0 z-50 border-b backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Flame className="h-8 w-8 text-orange-500" />
            <span className="text-xl font-bold">PCFRA</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            {user ? (
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/sign-up">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
            <Shield className="h-4 w-4" />
            Building Safety Act 2022 Compliant
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight lg:text-6xl">
            Principal Contractor
            <br />
            <span className="text-orange-500">Fire Risk Assessment</span>
          </h1>

          <p className="text-muted-foreground mx-auto mb-10 max-w-2xl text-xl">
            A comprehensive compliance ecosystem for safety officers to perform
            high-stakes fire risk assessments on construction sites with full
            Golden Thread documentation.
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            {user ? (
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link href="/auth/sign-up">
                    Start Free Assessment
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/auth/login">Sign In to Dashboard</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-muted/50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold">
              Everything You Need for Compliance
            </h2>
            <p className="text-muted-foreground mx-auto max-w-xl">
              Built specifically for the UK construction industry to meet the
              strict requirements of the Building Safety Act 2022.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-background rounded-xl border p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <feature.icon className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Checklist Section */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-bold">
                Complete Assessment Workflow
              </h2>
              <p className="text-muted-foreground mb-8">
                Our 10-section wizard guides you through every aspect of fire
                risk assessment, ensuring nothing is missed.
              </p>

              <div className="space-y-4">
                {[
                  'Site Information & Building Details',
                  'Fire Door Compliance',
                  'Hot Works Management',
                  'Escape Routes Assessment',
                  'Fire Detection Systems',
                  'Emergency Procedures',
                  'Hazard Identification with Photo Evidence',
                  'Action Plan with Assignments',
                  'Risk Matrix Summary',
                  'Digital Sign-off & PDF Export',
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-sm font-medium text-green-600 dark:bg-green-900/30">
                      {index + 1}
                    </div>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 p-1">
              <div className="bg-background rounded-xl p-8">
                <div className="text-center">
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                    <Flame className="h-8 w-8 text-orange-500" />
                  </div>
                  <h3 className="mb-2 text-2xl font-bold">Ready to Start?</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first fire risk assessment in minutes.
                  </p>
                  {user ? (
                    <Button className="w-full" size="lg" asChild>
                      <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                  ) : (
                    <Button className="w-full" size="lg" asChild>
                      <Link href="/auth/sign-up">Create Free Account</Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-orange-500" />
              <span className="font-bold">PCFRA</span>
              <span className="text-muted-foreground text-sm">
                © {new Date().getFullYear()}
              </span>
            </div>
            <p className="text-muted-foreground text-center text-sm">
              Designed for UK Building Safety Act 2022 compliance
            </p>
            <ThemeSwitcher />
          </div>
        </div>
      </footer>
    </div>
  )
}
