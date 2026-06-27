import { useEffect, useState } from "react";
import Seo from "../components/landing/Seo";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import Stats from "../components/landing/Stats";
import Features, { FeatureStrip } from "../components/landing/Features";
import AISection from "../components/landing/AISection";
import ScreenshotGallery from "../components/landing/ScreenshotGallery";
import WhyBudgetIQ from "../components/landing/WhyBudgetIQ";
import HowItWorks from "../components/landing/HowItWorks";
import Testimonials from "../components/landing/Testimonials";
import Pricing from "../components/landing/Pricing";
import FAQ from "../components/landing/FAQ";
import CTA from "../components/landing/CTA";
import Footer from "../components/landing/Footer";

const STORAGE_KEY = "bt.landing.theme";

/**
 * Public marketing landing page shown to signed-out visitors. Owns its own
 * scoped dark-mode (`.dark` on the wrapper) so toggling never affects the
 * authenticated app, which is light-only.
 */
export default function Landing() {
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved === "dark";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className={dark ? "dark" : ""}>
      <Seo />
      <div className="min-h-screen overflow-x-hidden scroll-smooth bg-gradient-to-b from-white via-slate-50 to-white text-slate-900 antialiased dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-white">
        <Navbar dark={dark} onToggleDark={() => setDark((v) => !v)} />
        <main>
          <Hero />
          <Stats />
          <Features />
          <FeatureStrip />
          <AISection />
          <ScreenshotGallery />
          <WhyBudgetIQ />
          <HowItWorks />
          <Testimonials />
          <Pricing />
          <FAQ />
          <CTA />
        </main>
        <Footer />
      </div>
    </div>
  );
}
