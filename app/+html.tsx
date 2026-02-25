import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

const SITE_URL = "https://trustgolf.app";
const SITE_TITLE = "Trust Golf — Premium Golf Companion";
const SITE_DESC = "Discover 45+ courses, track scores, analyze your swing with AI, and unlock exclusive deals. Your premium golf companion by DarkWave Studios LLC.";
const OG_IMAGE = `${SITE_URL}/assets/images/icon.png`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <title>{SITE_TITLE}</title>
        <meta name="description" content={SITE_DESC} />
        <meta name="keywords" content="golf, golf app, golf courses, score tracker, handicap calculator, swing analyzer, AI golf, tee times, golf deals, USGA handicap, golf GPS, DarkWave Studios" />
        <meta name="author" content="DarkWave Studios LLC" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href={SITE_URL} />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Trust Golf" />
        <meta property="og:title" content={SITE_TITLE} />
        <meta property="og:description" content={SITE_DESC} />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1024" />
        <meta property="og:image:height" content="1024" />
        <meta property="og:image:alt" content="Trust Golf App Icon" />
        <meta property="og:locale" content="en_US" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SITE_TITLE} />
        <meta name="twitter:description" content={SITE_DESC} />
        <meta name="twitter:image" content={OG_IMAGE} />
        <meta name="twitter:image:alt" content="Trust Golf App Icon" />

        <meta name="theme-color" content="#1B5E20" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Trust Golf" />
        <meta name="application-name" content="Trust Golf" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#1B5E20" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/assets/images/icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/assets/images/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/assets/images/favicon.png" />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />

        <ScrollViewStyleReset />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "MobileApplication",
          "name": "Trust Golf",
          "applicationCategory": "SportsApplication",
          "operatingSystem": "iOS, Android, Web",
          "description": SITE_DESC,
          "url": SITE_URL,
          "image": OG_IMAGE,
          "author": {
            "@type": "Organization",
            "name": "DarkWave Studios LLC",
            "url": "https://darkwavestudios.io"
          },
          "publisher": {
            "@type": "Organization",
            "name": "DarkWave Studios LLC",
            "url": "https://darkwavestudios.io"
          },
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "120",
            "bestRating": "5"
          },
          "featureList": [
            "45+ Golf Course Catalog",
            "AI Swing Analysis",
            "USGA Handicap Calculator",
            "Score & Stats Tracking",
            "Exclusive Tee Time Deals",
            "GPS Course Navigator"
          ]
        })}} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "DarkWave Studios LLC",
          "url": "https://darkwavestudios.io",
          "logo": OG_IMAGE,
          "sameAs": [],
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer support",
            "url": SITE_URL
          }
        })}} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Trust Golf",
          "url": SITE_URL,
          "description": SITE_DESC,
          "publisher": {
            "@type": "Organization",
            "name": "DarkWave Studios LLC"
          },
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": `${SITE_URL}/blog?q={search_term_string}`
            },
            "query-input": "required name=search_term_string"
          }
        })}} />

        <style dangerouslySetInnerHTML={{ __html: `
          body { background-color: #1B5E20; overflow: hidden; }
          #root { flex: 1; display: flex; }
        `}} />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function() {});
            });
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
