#!/bin/bash
set -e
npx expo export -p web --output-dir docs --clear
touch docs/.nojekyll
cp docs/index.html docs/404.html
printf '/assets/*  /assets/:splat  200\n/_expo/*  /_expo/:splat  200\n/*  /index.html  200\n' > docs/_redirects
echo "Done - drag docs/ to Netlify"
