# Project structure

## Overview
The storefront remains a static HTML/CSS/JS experience, with an Express-style backend and Supabase-backed server logic for orders and admin operations.

## Recommended production layout
- app/ – app-level entry points and shared shell components
- components/ – reusable UI building blocks
- features/ – domain-specific flows (cart, checkout, admin, auth)
- lib/ – shared runtime helpers and framework configuration
- hooks/ – client-side state hooks when the UI is migrated to a modern framework
- services/ – external APIs and persistence services
- utils/ – pure helper functions
- types/ – shared type contracts
- constants/ – app-wide constants and config values
- middleware/ – server-side middleware
- api/ – API route handlers or serverless endpoints
- public/ – static assets and SEO files
- styles/ – central design tokens and shared style modules
- supabase/ – SQL schema and setup scripts
- tests/ – unit, integration, and browser tests
- scripts/ – maintenance and deployment helpers

## Current repo mapping
- Frontend pages: index.html, about.html, pages/
- Shared scripts: js/
- Backend: backend/
- Supabase SQL: supabase/
