import { FeaturesGrid } from '@/components/marketing/section/FeaturesGrid'
import { HeroSection } from '@/components/marketing/section/HeroSection'
import { HowItWorks } from '@/components/marketing/section/HowItWorks'
import { LogoMarquee } from '@/components/marketing/section/LogoMarquee'
import { Pricing } from '@/components/marketing/section/Pricing'

export default function LandingPage() {
    return (
        <div style={{ background: '#0a0a0b' }}>
            <HeroSection />
            <LogoMarquee />
            <HowItWorks />
            <FeaturesGrid />
            <Pricing />
        </div>
    )
}