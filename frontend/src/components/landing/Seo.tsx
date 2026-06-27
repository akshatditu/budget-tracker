import { Helmet } from "react-helmet-async";

const TITLE = "BudgetIQ — Smarter Budgeting. Powered by AI.";
const DESCRIPTION =
  "BudgetIQ unifies expense tracking, budget planning, AI insights, savings goals, and financial analytics into one beautifully simple workspace. Free to start.";
const URL = "https://budgetiq.app/";
const OG_IMAGE = "https://budgetiq.app/og-image.png";

/** Document head for the landing page: meta, Open Graph, Twitter, JSON-LD. */
export default function Seo() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "BudgetIQ",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    description: DESCRIPTION,
    url: URL,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "1280",
    },
  };

  return (
    <Helmet>
      <html lang="en" />
      <title>{TITLE}</title>
      <meta name="description" content={DESCRIPTION} />
      <meta name="theme-color" content="#2563eb" />
      <link rel="canonical" href={URL} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="BudgetIQ" />
      <meta property="og:title" content={TITLE} />
      <meta property="og:description" content={DESCRIPTION} />
      <meta property="og:url" content={URL} />
      <meta property="og:image" content={OG_IMAGE} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={TITLE} />
      <meta name="twitter:description" content={DESCRIPTION} />
      <meta name="twitter:image" content={OG_IMAGE} />

      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}
