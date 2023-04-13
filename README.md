# Knowledgebase

> Hosted on: https://penguinmenac3.github.io/knowledgebase/

Manage your knowledge. The app is a static webpage that can be installed as an app and connects to a WebFS backend. Your data is stored on your WebFS backend server, so you have full controll over your data.

## Start APP Development Server

Simply start the lightning dev server using:
```bash
npm run dev
```

## Start WebFS Test Server

Start a PHP server within the `src/WebFS` folder.
```bash
cd src/WebFS
php -S localhost:8080
```

## Build the app for release

Run the build command, add and commit the dist folder and then push this folger to gh-pages.
```bash
npm run build
git add -f dist
git commit -m "Build gh-pages."
git push
git subtree push --prefix dist origin gh-pages
```
