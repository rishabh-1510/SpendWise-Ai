## Day 1 — 2026-05-06

**Hours worked:** 5

**What I did:**  
- Setup React + Vite + TypeScript
- Configured Tailwind and shadcn
- Built landing page navbar and hero section
- Setup routing structure

**What I learned:**  
Tailwind v4 and shadcn integration with Vite requires proper alias configuration in tsconfig.json.

**Blockers / what I'm stuck on:**  
Had issues with shadcn import aliases and router setup initially.

**Plan for tomorrow:**  
Build audit form and pricing data structure.

## Day 3 — AI Integration + Dynamic Report System — 2026-05-11

**Hours worked:** 7

**What I did:**  
- Built the dynamic Results/Report page UI
- Connected audit results dynamically using localStorage
- Implemented reusable audit and pricing utility functions
- Added dynamic AI spend charts using Recharts
- Created optimization score and savings calculation system
- Added recommendation generation through audit engine logic
- Integrated external AI API for AI-generated audit summaries
- Added loading states during report generation
- Built dynamic analytics cards and spend breakdown sections
- Added support for:
  - flat pricing
  - per-seat pricing
  - usage-based plans
- Improved localStorage persistence with reusable helper functions
- Refactored AuditForm logic for cleaner architecture and scalability
- Improved dashboard responsiveness and spacing
- Refined report styling, gradients, glow effects, and glassmorphism UI

**What I learned:**  
- Separating pricing and audit logic into reusable utility functions improves scalability
- Derived financial calculations should be centralized instead of manually synced
- LocalStorage persistence becomes easier with helper-based architecture
- AI API integrations require proper endpoint handling and fallback logic
- Dynamic dashboard systems are easier to maintain with modular reusable components

**Blockers / issues faced:**  
- Faced Gemini/OpenRouter API integration and endpoint issues
- Encountered localStorage synchronization problems between pages
- Had issues handling both flat and per-seat pricing dynamically
- Faced TypeScript errors caused by audit engine function signature mismatches
- Recharts data initially failed to render because of inconsistent storage keys

**How I solved them:**  
- Refactored pricing calculations into reusable utility functions
- Standardized localStorage structure and storage keys
- Added automatic spend recalculation after every row update
- Implemented fallback handling for failed AI API responses
- Updated audit engine parameters and TypeScript typings
- Debugged chart rendering using browser localStorage inspection tools

**Plan for tomorrow:**  
- Add PDF/download functionality for reports
- Improve AI recommendation quality
- Add public report sharing functionality
- Improve dashboard animations and responsiveness
- Refine analytics charts and visualization system
- Perform final project cleanup and optimization

## Day 4 — PDF Export + Backend Integration — 2026-05-12

**Hours worked:** 6

**What I did:**  
- Integrated PDF export functionality using:
  - `jspdf`
  - `html2canvas`
- Added downloadable AI audit report generation
- Implemented report capture using React refs
- Connected download actions to report dashboard buttons
- Refactored report export logic into reusable utility structure
- Added AI Summary Card component for cleaner report presentation
- Started backend integration using Supabase
- Configured Supabase client setup and environment variables
- Created backend project structure for lead storage
- Added Supabase utility configuration file
- Improved report component architecture and export handling
- Fixed PDF rendering issues caused by unsupported `oklch()` colors
- Converted chart and export-related styles to compatible HEX colors
- Improved Recharts rendering consistency for exported reports
- Refined report UI spacing, button behavior, and dashboard layout
- Performed general cleanup and code organization

**What I learned:**  
- Browser-based PDF generation libraries have limitations with modern CSS color functions
- `html2canvas` works best with HEX/RGB colors instead of `oklch()`
- Separating export logic into reusable utilities improves maintainability
- Supabase provides a lightweight backend solution without requiring a custom Express server
- Environment variable management is critical when integrating external services

**Blockers / issues faced:**  
- PDF generation initially failed because `html2canvas` could not parse `oklch()` colors
- Faced rendering inconsistencies in exported chart visuals
- Had issues configuring proper export capture area with React refs
- Encountered problems with button event placement and JSX structure during export integration
- Needed to debug Supabase project configuration and API setup

**How I solved them:**  
- Replaced unsupported `oklch()` chart/export colors with HEX values
- Refactored PDF generation into a dedicated handler function
- Used `useRef()` to capture the report container correctly
- Fixed JSX structure and moved click handlers to proper button components
- Configured reusable Supabase client setup with environment variables

**Plan for tomorrow:**  
- Complete Supabase lead storage integration
- Add shareable public report functionality
- Improve report export styling and pagination
- Add toast notifications and loading states
- Finalize responsive dashboard polish
- Perform final testing and project optimization