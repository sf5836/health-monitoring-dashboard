# HealthMonitor Pro Global Design System

This file is the single source of truth for all Stitch screen generation prompts in this project.
Unless a screen explicitly overrides tokens, use this scheme as default.

## Color System

- Primary 700 (Deep Forest Green): `#0D5C45` for primary buttons, sidebar active states, and headers
- Primary 500 (Green): `#1A9E72` for accents, badges, and icons
- Primary 400 (Bright Green): `#2DC48D` for hover states and chart lines
- Primary 100 (Light Green): `#CCF2E4` for notification badges and pills
- Primary 50 (Near-white Green): `#E8F9F2` for card backgrounds and subtle fills
- Mint 500 (Teal): `#14A0A0` for secondary accent and info states
- Mint 100 (Light Teal): `#D0F4F4` for alternate card backgrounds
- Neutral 900: `#111827` for primary text
- Neutral 600: `#4B5563` for secondary text
- Neutral 200: `#E5E7EB` for borders and dividers
- Neutral 50: `#F9FAFB` for page background
- Danger 500: `#EF4444` for high risk and errors
- Warning 500: `#F59E0B` for medium risk and alerts
- Success 500: `#22C55E` for normal ranges and success

## Typography

- Headlines and display: Sora (Google Font)
- Body and UI: DM Sans (Google Font)
- Numbers and data: JetBrains Mono

## Visual Style

- Clean medical-professional with deep green identity
- Rounded cards with `12px` radius
- Subtle shadows
- Green sidebar for authenticated app areas

## Global Implementation Rules

- Build mobile-first and scale to tablet, laptop, and desktop
- Keep strong hierarchy: title, context, action, content
- Every completed screen should include loading, empty, and error states
- Keep navigation consistent across screens within the same role area
