import { motion } from "framer-motion";
import { BrowserFrame, DashboardMockup, AnalyticsMockup, PlannerMockup, ChatMockup, ReportsMockup, GoalsMockup } from "./mockups";
import { SectionHeading } from "./shared";

const SHOTS: { title: string; node: React.ReactNode; span?: string }[] = [
  { title: "Dashboard", node: <DashboardMockup />, span: "lg:col-span-2 lg:row-span-2" },
  { title: "Analytics", node: <AnalyticsMockup /> },
  { title: "Budget Planner", node: <PlannerMockup /> },
  { title: "AI Chat", node: <ChatMockup /> },
  { title: "Reports", node: <ReportsMockup /> },
  { title: "Goals", node: <GoalsMockup /> },
];

export default function ScreenshotGallery() {
  return (
    <section id="screenshots" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Screenshots"
          title={<>One workspace, <span className="text-brand">every view</span></>}
          subtitle="From a bird's-eye dashboard to granular reports — explore the product surface that makes budgeting feel effortless."
        />

        <div className="mt-16 grid auto-rows-[200px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SHOTS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
              whileHover={{ y: -6 }}
              className={`group relative ${s.span ?? ""}`}
            >
              <BrowserFrame label={`${s.title.toLowerCase().replace(/\s/g, "-")}.budgetiq.com`} className="h-full transition-shadow duration-300 group-hover:shadow-blue-500/20">
                <div className="h-[calc(100%-41px)] overflow-hidden bg-white dark:bg-slate-900">{s.node}</div>
              </BrowserFrame>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-slate-900/70 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="text-sm font-semibold text-white">{s.title}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
