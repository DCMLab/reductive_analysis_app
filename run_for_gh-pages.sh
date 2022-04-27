#!/bin/bash

sed -ie "s/HEADLESS = false/HEADLESS = true/" jest-puppeteer.config.js
sed -ie "s/defineConfig({/defineConfig({ base: '\/reductive_analysis_app\/',/" vite.config.js
