import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

// The guided product tour. Each step points at a nav tab (by data-tour attribute,
// set in Layout.tsx) and explains what it's for. On small screens the sidebar is a
// hidden drawer, so if the anchor isn't visible we fall back to centered popovers.

interface TourStep {
  selector: string;
  title: string;
  description: string;
}

const STEPS: TourStep[] = [
  {
    selector: '[data-tour="nav-dashboard"]',
    title: "📊 Dashboard",
    description: "Your at-a-glance home: income, spend, investments and remaining cash for the year.",
  },
  {
    selector: '[data-tour="nav-setup"]',
    title: "🎛️ Budget Setup",
    description: "Set how much you plan to spend per item for the year. We split it across the 12 months for you.",
  },
  {
    selector: '[data-tour="nav-month"]',
    title: "📅 Month",
    description: "Zoom into a single month to see budget vs. actual for every item.",
  },
  {
    selector: '[data-tour="nav-transactions"]',
    title: "🧾 Transactions",
    description: "Log every spend here. It instantly flows into your month and dashboard totals.",
  },
  {
    selector: '[data-tour="nav-income"]',
    title: "💰 Income",
    description: "Record what comes in each month so your remaining-in-bank stays accurate.",
  },
];

const isVisible = (selector: string): boolean => {
  const el = document.querySelector<HTMLElement>(selector);
  return !!el && el.offsetParent !== null;
};

export function startTour() {
  // Anchor to the sidebar tabs when they're on screen; otherwise show centered cards.
  const anchored = isVisible(STEPS[0].selector);

  const steps: DriveStep[] = STEPS.map((s) => ({
    ...(anchored ? { element: s.selector } : {}),
    popover: { title: s.title, description: s.description },
  }));
  steps.push({
    popover: {
      title: "🎉 You're all set",
      description: "That's the tour! Add an income and a few transactions to watch your dashboard come to life.",
    },
  });

  driver({
    showProgress: true,
    allowClose: true,
    nextBtnText: "Next",
    prevBtnText: "Back",
    doneBtnText: "Done",
    steps,
  }).drive();
}

// localStorage key per user so each person sees the tour once automatically.
export const tourSeenKey = (userId: number) => `bt.tour.${userId}`;
