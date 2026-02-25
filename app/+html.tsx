import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#1B5E20" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Trust Golf" />
        <meta name="description" content="Premium golf companion — course catalog, score tracking, AI swing analysis, and exclusive deals. By DarkWave Studios LLC." />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/assets/images/icon.png" />
        <link rel="icon" type="image/png" href="/assets/images/favicon.png" />
        <ScrollViewStyleReset />
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
