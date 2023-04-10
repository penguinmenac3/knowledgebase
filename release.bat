npm run build
git add -f dist
git commit -m "Build gh-pages."
git push
git subtree push --prefix dist origin gh-pages
