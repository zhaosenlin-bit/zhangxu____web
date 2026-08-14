@echo off
title Deploy ZhangXu Web to GitHub Pages
cd /d "%~dp0"
echo Building and deploying to https://zhaosenlin-bit.github.io/zhangxu____web/
echo This will push to the gh-pages branch using your saved GitHub login.
powershell -NoProfile -ExecutionPolicy Bypass -Command "node scripts/deploy-github-pages.mjs"
echo.
pause
