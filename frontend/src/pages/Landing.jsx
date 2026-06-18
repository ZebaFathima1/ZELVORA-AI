import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Hero from "@/components/sections/Hero";
import AIDemo from "@/components/sections/AIDemo";
import WhyDifferent from "@/components/sections/WhyDifferent";
import LearningJourney from "@/components/sections/LearningJourney";
import Features from "@/components/sections/Features";
import DashboardPreview from "@/components/sections/DashboardPreview";
import Metrics from "@/components/sections/Metrics";
import Testimonials from "@/components/sections/Testimonials";
import FinalCTA from "@/components/sections/FinalCTA";

export default function Landing() {
  return (
    <div className="bg-[#0A0A0F] text-white min-h-screen" data-testid="landing-page">
      <Navbar />
      <main>
        <Hero />
        <AIDemo />
        <WhyDifferent />
        <LearningJourney />
        <Features />
        <DashboardPreview />
        <Metrics />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
