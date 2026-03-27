#!/bin/bash
set -e
npx expo export -p web --output-dir docs --clear
touch docs/.nojekyll
cp docs/index.html docs/404.html
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
cp assets/icon.png docs/icons/icon-192.png
cp assets/icon.png docs/icons/icon-512.png

echo "✅ Done — drag docs/ to Netlify"
