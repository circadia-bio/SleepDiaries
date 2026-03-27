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

// PWA meta + splash link tags
const metaTags = `
<link rel="manifest" href="/manifest.json" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Sleep Diaries" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
<link rel="apple-touch-startup-image" href="/splashscreens/iphone_16_pro.png" media="screen and (device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
<link rel="apple-touch-startup-image" href="/splashscreens/iphone_15_pro_max.png" media="screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
<link rel="apple-touch-startup-image" href="/splashscreens/iphone_15_pro.png" media="screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
<link rel="apple-touch-startup-image" href="/splashscreens/iphone_14_plus.png" media="screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
<link rel="apple-touch-startup-image" href="/splashscreens/iphone_14.png" media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
<link rel="apple-touch-startup-image" href="/splashscreens/iphone_x.png" media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
<link rel="apple-touch-startup-image" href="/splashscreens/iphone_8.png" media="screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
<link rel="apple-touch-startup-image" href="/splashscreens/iphone_se.png" media="screen and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
<script>if("serviceWorker"in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js");});}<\/script>`;

// Instant CSS splash — visible from first paint, removed by React after 1.5s
const splashDiv = `
<style>
  #pwa-splash {
    display: none;
    position: fixed;
    inset: 0;
    background: #C8DFF5;
    z-index: 99999;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }
  #pwa-splash img {
    width: 40vw;
    max-width: 180px;
  }
  /* Only show when running as installed PWA */
  @media all and (display-mode: standalone) {
    #pwa-splash { display: flex; }
  }
</style>
<div id="pwa-splash">
  <img src="/icons/icon-192.png" alt="Sleep Diaries" />
</div>`;

html = html.replace('</head>', metaTags + '</head>');
html = html.replace('<div id="root">', splashDiv + '<div id="root">');

fs.writeFileSync('docs/index.html', html);
fs.writeFileSync('docs/404.html', html);
console.log('PWA tags and instant splash injected.');
NODESCRIPT
# Get font hash for redirect rule
FONT_HASH=$(grep -o 'Ionicons\.[a-f0-9]*\.ttf' docs/_expo/static/js/web/*.js | head -1 | grep -o '[a-f0-9]\{32\}')

printf "/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.${FONT_HASH}.ttf  /fonts/Ionicons.ttf  200\n/assets/*  /assets/:splat  200\n/_expo/*  /_expo/:splat  200\n/*  /index.html  200\n" > docs/_redirects

# Copy font to clean /fonts/ path
mkdir -p docs/fonts
cp node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf docs/fonts/Ionicons.ttf
echo "Copied Ionicons font with hash: $FONT_HASH"

# Copy social preview image
cp assets/images/social.png docs/social.png

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
