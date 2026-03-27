import Link from "next/link"
import { LandingNav } from "@/components/landing/nav"
import { Hero } from "@/components/landing/hero"
import { ChatDemo } from "@/components/landing/chat-demo"
import { DataSources } from "@/components/landing/data-sources"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Stats } from "@/components/landing/stats"
import { FeatureCards } from "@/components/landing/feature-cards"
import { CTA } from "@/components/landing/cta"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <LandingNav />
      <Hero />
      <ChatDemo />
      <HowItWorks />
      <DataSources />
      <Stats />
      <FeatureCards />
      <CTA />

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-xs text-muted-foreground">
          <span>דירות &copy; {new Date().getFullYear()}</span>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-foreground">תנאי שימוש</Link>
            <Link href="/privacy" className="hover:text-foreground">פרטיות</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
