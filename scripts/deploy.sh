#!/bin/bash
set -e
npx expo export -p web --output-dir docs --clear
touch docs/.nojekyll
cp docs/index.html docs/404.html

# Inject PWA meta tags into the Expo-generated index.html
PWA_TAGS='<link rel="manifest" href="/manifest.json" /><meta name="apple-mobile-web-app-capable" content="yes" /><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" /><meta name="apple-mobile-web-app-title" content="Sleep Diaries" /><link rel="apple-touch-icon" href="/icons/icon-192.png" /><link rel="apple-touch-startup-image" href="/splashscreens/iphone_15_pro_max.png" media="screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" /><link rel="apple-touch-startup-image" href="/splashscreens/iphone_15_pro.png" media="screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" /><link rel="apple-touch-startup-image" href="/splashscreens/iphone_16_pro.png" media="screen and (device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" /><link rel="apple-touch-startup-image" href="/splashscreens/iphone_14_plus.png" media="screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" /><link rel="apple-touch-startup-image" href="/splashscreens/iphone_14.png" media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" /><link rel="apple-touch-startup-image" href="/splashscreens/iphone_x.png" media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" /><link rel="apple-touch-startup-image" href="/splashscreens/iphone_8.png" media="screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" /><link rel="apple-touch-startup-image" href="/splashscreens/iphone_se.png" media="screen and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" /><script>if("serviceWorker"in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js");});}<\/script>'
echo "Injecting PWA tags..."
node << 'NODESCRIPT'
const fs = require('fs');
let html = fs.readFileSync('docs/index.html', 'utf8');

// 1. viewport-fit=cover so content fills behind notch and home indicator
html = html.replace(
  'width=device-width, initial-scale=1, shrink-to-fit=no',
  'width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover'
);

// 2. PWA meta tags + splash links + service worker
const metaTags = [
  '<link rel="manifest" href="/manifest.json" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />',
  '<meta name="apple-mobile-web-app-title" content="Sleep Diaries" />',
  '<link rel="icon" type="image/png" href="/favicon.png" />',
  '<link rel="apple-touch-icon" href="/icons/icon-192.png" />',
  '<meta name="description" content="\uD83C\uDF19 Open-source sleep diary app for clinical research \u2014 built with React Native &amp; Expo. Morning &amp; evening questionnaires, sleep metrics, and data export (CSV/JSON)." />',
  '<meta property="og:title" content="Sleep Diaries" />',
  '<meta property="og:description" content="\uD83C\uDF19 Open-source sleep diary app for clinical research \u2014 built with React Native &amp; Expo. Morning &amp; evening questionnaires, sleep metrics, and data export (CSV/JSON)." />',
  '<meta property="og:image" content="https://sleepdiaries.circadia-lab.uk/social.png" />',
  '<meta property="og:image:width" content="1200" />',
  '<meta property="og:image:height" content="630" />',
  '<meta property="og:url" content="https://sleepdiaries.circadia-lab.uk" />',
  '<meta property="og:type" content="website" />',
  '<meta property="og:site_name" content="Sleep Diaries" />',
  '<meta name="twitter:card" content="summary_large_image" />',
  '<meta name="twitter:title" content="Sleep Diaries" />',
  '<meta name="twitter:description" content="\uD83C\uDF19 Open-source sleep diary app for clinical research \u2014 built with React Native &amp; Expo. Morning &amp; evening questionnaires, sleep metrics, and data export (CSV/JSON)." />',
  '<meta name="twitter:image" content="https://sleepdiaries.circadia-lab.uk/social.png" />',
  '<link rel="apple-touch-startup-image" href="/splashscreens/iphone_16_pro.png" media="screen and (device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />',
  '<link rel="apple-touch-startup-image" href="/splashscreens/iphone_15_pro_max.png" media="screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />',
  '<link rel="apple-touch-startup-image" href="/splashscreens/iphone_15_pro.png" media="screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />',
  '<link rel="apple-touch-startup-image" href="/splashscreens/iphone_14_plus.png" media="screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />',
  '<link rel="apple-touch-startup-image" href="/splashscreens/iphone_14.png" media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />',
  '<link rel="apple-touch-startup-image" href="/splashscreens/iphone_x.png" media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />',
  '<link rel="apple-touch-startup-image" href="/splashscreens/iphone_8.png" media="screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />',
  '<link rel="apple-touch-startup-image" href="/splashscreens/iphone_se.png" media="screen and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />',
  '<script>if("serviceWorker"in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js");});}<\/script>',
].join('\n');
html = html.replace('</head>', metaTags + '\n</head>');

// 3. Inject global CSS:
//    - Fill the entire background with the app sky blue
//    - On mobile PWA (standalone), make #root fill the full screen width
//      (on desktop it stays 390px via React Native's webWrapper style)
//    - Extend safe-area padding so nothing hides behind the home indicator
const globalCSS = `
<style id="pwa-global">
  html, body {
    background: #C8DFF5;
    margin: 0;
    padding: 0;
  }
  @media all and (display-mode: standalone) {
    html, body {
      width: 100vw !important;
      height: 100vh !important;
      max-width: none !important;
      overflow: hidden;
      padding-top: env(safe-area-inset-top);
      padding-bottom: env(safe-area-inset-bottom);
      padding-left: env(safe-area-inset-left);
      padding-right: env(safe-area-inset-right);
      box-sizing: border-box;
    }
    #root {
      width: 100% !important;
      max-width: none !important;
      height: 100% !important;
      position: fixed !important;
      top: 0; left: 0; right: 0; bottom: 0;
    }
    /* Make background images fill properly */
    #root img[src*="bg"], #root img[src*="background"] {
      object-fit: cover !important;
      width: 100% !important;
      height: 100% !important;
    }
  }
</style>`;
html = html.replace('<style id="expo-reset">', globalCSS + '\n<style id="expo-reset">');

// 4. Instant CSS splash screen — shown from first paint via display-mode media query,
//    dismissed by React (_layout.jsx) once the app has loaded
const splashHTML = `
<style>
  #pwa-splash {
    display: none;
    position: fixed;
    inset: 0;
    background: #C8DFF5;
    z-index: 99999;
    align-items: center;
    justify-content: center;
  }
  #pwa-splash img { width: 160px; height: 160px; object-fit: contain; }
  @media all and (display-mode: standalone) {
    #pwa-splash { display: flex; }
  }
</style>
<div id="pwa-splash"><img src="/icons/icon-192.png" alt="" /></div>`;
html = html.replace('<div id="root">', splashHTML + '\n<div id="root">');

fs.writeFileSync('docs/index.html', html);
fs.writeFileSync('docs/404.html', html);
console.log('✅ PWA injection complete.');
NODESCRIPT
# Get font hash for redirect rule
FONT_HASH=$(grep -o 'Ionicons\.[a-f0-9]*\.ttf' docs/_expo/static/js/web/*.js | head -1 | grep -o '[a-f0-9]\{32\}')

printf "/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.${FONT_HASH}.ttf  /fonts/Ionicons.ttf  200\n/assets/*  /assets/:splat  200\n/_expo/*  /_expo/:splat  200\n/*  /index.html  200\n" > docs/_redirects

# Copy font to clean /fonts/ path
mkdir -p docs/fonts
cp node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf docs/fonts/Ionicons.ttf
echo "Copied Ionicons font with hash: $FONT_HASH"

# Copy social preview image and favicon
cp assets/images/social.png docs/social.png
cp assets/favicon.png docs/favicon.png

# Copy PWA files
cp web/manifest.json docs/manifest.json
cp web/sw.js docs/sw.js

# Copy PWA icons
mkdir -p docs/icons
cp web/icons/icon-192.png docs/icons/icon-192.png
cp web/icons/icon-512.png docs/icons/icon-512.png

# Copy iPhone/iPad splash screens
mkdir -p docs/splashscreens
cp web/splashscreens/*.png docs/splashscreens/
# iphone_16_pro uses same dimensions as iphone_15_pro
cp web/splashscreens/iphone_15_pro.png docs/splashscreens/iphone_16_pro.png

echo "✅ Done — drag docs/ to Netlify"
