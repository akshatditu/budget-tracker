import { useEffect, useState } from "react";
import Seo from "../components/landing/Seo";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import Features, { FeatureStrip } from "../components/landing/Features";
import AISection from "../components/landing/AISection";
import ScreenshotGallery from "../components/landing/ScreenshotGallery";
import WhyBudgetIQ from "../components/landing/WhyBudgetIQ";
import HowItWorks from "../components/landing/HowItWorks";
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
      <div className="relative min-h-screen overflow-x-hidden scroll-smooth bg-white text-slate-900 antialiased dark:bg-[#0a0d13] dark:text-white">
        {/* Ambient background glows */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="lp-pulse-glow absolute -top-52 left-1/2 h-[700px] w-[1100px] max-w-[120vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(15,157,143,0.1),transparent)] dark:bg-[radial-gradient(closest-side,rgba(45,212,191,0.1),transparent)]" />
          <div className="lp-pulse-glow absolute top-[600px] -right-64 h-[760px] w-[760px] rounded-full bg-[radial-gradient(closest-side,rgba(124,58,237,0.08),transparent)] dark:bg-[radial-gradient(closest-side,rgba(167,139,250,0.1),transparent)]" />
        </div>

        <div className="relative z-10">
          <Navbar dark={dark} onToggleDark={() => setDark((v) => !v)} />
          <main>
            <Hero />
            <Features />
            <FeatureStrip />
            <AISection />
            <ScreenshotGallery />
            <WhyBudgetIQ />
            <HowItWorks />
            <FAQ />
            <CTA />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
