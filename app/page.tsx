import { LandingHeader } from '@/components/landing/header'
import { LandingHero } from '@/components/landing/hero'
import { LandingServices } from '@/components/landing/services'
import { LandingBenefits } from '@/components/landing/benefits'
import { LandingPlans } from '@/components/landing/plans'
import { LandingContact } from '@/components/landing/contact'
import { LandingFooter } from '@/components/landing/footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingServices />
        <LandingBenefits />
        <LandingPlans />
        <LandingContact />
      </main>
      <LandingFooter />
    </div>
  )
}
