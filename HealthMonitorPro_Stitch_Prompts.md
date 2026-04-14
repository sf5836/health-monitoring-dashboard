# HealthMonitor Pro — Stitch Screen Design Prompts

> **How to use:** Open VS Code with the Stitch MCP server connected.
> For each screen below, copy the prompt into Stitch exactly as written.
> Each prompt includes the full design context so you can run them independently.

## DESIGN SYSTEM (Reference — include in every prompt if needed)

```
Color System:
- Primary 700 (Deep Forest Green): #0D5C45 — primary buttons, sidebar active, headers
- Primary 500 (Green): #1A9E72 — accents, badges, icons
- Primary 400 (Bright Green): #2DC48D — hover states, chart lines
- Primary 100 (Light Green): #CCF2E4 — notification badges, pills
- Primary 50 (Near-white Green): #E8F9F2 — card backgrounds, subtle fills
- Mint 500 (Teal): #14A0A0 — secondary accent, info states
- Mint 100 (Light Teal): #D0F4F4 — alternate card backgrounds
- Neutral 900: #111827 — primary text
- Neutral 600: #4B5563 — secondary text
- Neutral 200: #E5E7EB — borders, dividers
- Neutral 50: #F9FAFB — page background
- Danger 500: #EF4444 — HIGH risk, errors
- Warning 500: #F59E0B — MEDIUM risk, alerts
- Success 500: #22C55E — NORMAL ranges, success

Fonts:
- Headlines/Display: Sora (Google Font)
- Body/UI: DM Sans (Google Font)
- Numbers/Data: JetBrains Mono (for vital numbers, stats)

Style: Clean medical-professional with deep green identity.
Rounded cards (radius 12px), subtle shadows, green sidebar.
```

---

## SCREEN 01 — Public Home Page (Hero + Full Landing)

```
Design a full landing page for a health monitoring web app called "HealthMonitor Pro".

COLOR SCHEME:
- Page background: #F9FAFB (near-white)
- Primary accent: #0D5C45 (deep forest green)
- Secondary accent: #1A9E72 (medium green)
- Highlight/CTA: #2DC48D (bright mint green)
- Text primary: #111827, Text secondary: #4B5563
- Fonts: Sora for headlines, DM Sans for body

HEADER (sticky, full-width):
- Left: Logo "HealthMonitor Pro" with a small green pulse/heart icon
- Center nav links: Home | Doctors | Blogs | About | Contact
- Right: "Login" button (outlined, #0D5C45 border) + "Register" button (solid #0D5C45, white text)
- White background with very subtle bottom border on scroll

HERO SECTION (full viewport height):
- Left half: Large headline in Sora font: "Monitor Your Health. Connect with Experts."
- Sub-headline: "Log daily vitals, track trends, and get real-time guidance from certified doctors — all in one secure platform."
- Two CTA buttons: "Get Started Free" (solid #0D5C45) and "Find a Doctor" (outlined)
- Small trust badges below buttons: "256-bit Encrypted" | "HIPAA Aligned" | "Verified Doctors"
- Right half: A modern dashboard mockup illustration showing health charts, vital stats cards in green tones

FEATURED DOCTORS SECTION:
- Section title: "Our Verified Specialists"
- Subtitle: "Connect with certified doctors across multiple specializations"
- 3 doctor cards in a row (show 3, "View All" button):
  - Circular photo placeholder, Doctor name in Sora, Specialization tag (green pill badge)
  - Star rating (gold stars), Experience "12 years", Fee "PKR 1,500/consult"
  - "View Profile" button (outlined green)
- Cards: white background, 12px radius, subtle shadow

HOW IT WORKS SECTION:
- Light green background (#E8F9F2)
- Title: "How It Works"
- 3 steps in a horizontal row with numbered circles (#0D5C45):
  Step 1: "Create Your Account" — register as patient or doctor
  Step 2: "Log Your Daily Vitals" — blood pressure, glucose, heart rate and more
  Step 3: "Get Expert Care" — doctors monitor, advise, and prescribe
- Each step has a simple line illustration above the text

STATS SECTION (dark green background #0D5C45, white text):
- 4 stat blocks in a row:
  "10,000+ Patients" | "500+ Doctors" | "50,000+ Consultations" | "2,000+ Articles"
- Large numbers in Sora 48px bold, labels in DM Sans

FEATURED BLOGS SECTION:
- 3 blog cards in a row:
  - Cover image placeholder (teal gradient), Category badge (mint green pill)
  - Blog title in Sora, Author: "Dr. [Name] — Cardiologist", Date, Excerpt 2 lines
  - Read time badge "5 min read"
- "View All Articles" button (outlined green, centered)

TESTIMONIALS SECTION:
- Light background #F0FDF7
- 3 testimonial cards:
  - Patient avatar, Name, 5 gold stars, Quote text in italics
  - Green quotation mark decorative element

FOOTER:
- Dark background #0A4229
- 4 columns: About HealthMonitor Pro | Quick Links | Specializations | Contact
- Newsletter: "Stay Healthy — Subscribe for health tips" + email input + green button
- Bottom bar: Copyright | Privacy Policy | Terms of Service
- Social icons in white

Make it pixel-perfect, modern, and professional. Use real spacing and visual hierarchy.
```

---

## SCREEN 02 — Doctors Listing Page

```
Design a doctors listing/search page for "HealthMonitor Pro" health platform.

COLORS: Primary #0D5C45, Accent #1A9E72, Background #F9FAFB, Cards white.
FONTS: Sora for titles, DM Sans for body.

HEADER: Same sticky header as home page (Logo + Nav + Login/Register buttons).

PAGE LAYOUT: Two-column layout — narrow filter sidebar left, results grid right.

PAGE TITLE (below header):
- Breadcrumb: Home > Doctors
- Title: "Find Your Doctor" in Sora 30px
- Subtitle: "Search from 500+ verified specialists across all fields"
- Full-width search bar: placeholder "Search by name or specialization..." with green search icon

LEFT SIDEBAR — FILTERS (280px wide):
- "Filters" heading with a reset "Clear All" link
Filter sections (each collapsible with chevron):
1. Specialization (checkboxes):
   Cardiologist | Neurologist | Diabetologist | Orthopedic | Eye Specialist | General Physician
2. Minimum Rating: Star rating selector (1–5 stars, click to select)
3. Consultation Fee: Range slider (PKR 500 — PKR 5000)
4. Availability Day: Day pill buttons (Mon Tue Wed Thu Fri Sat Sun — toggle select, green when active)
- "Apply Filters" button (solid green, full width)

RIGHT RESULTS AREA:
- Top bar: "Showing 48 doctors" | Sort by dropdown (Rating | Experience | Fee: Low to High | Fee: High to Low)
- Doctor cards grid (2 columns on desktop):
  Each card (white, rounded-xl, shadow-md):
    - Left: Circular photo (80px), Online indicator dot (green)
    - Right top: Doctor name (Sora semi-bold), Specialization (green pill badge)
    - Hospital name in gray, Experience "8 years"
    - Star rating row + "(124 reviews)"
    - Fee: "PKR 1,500 / consultation"
    - Two buttons: "View Profile" (outlined green) | "Connect" (solid green)
- Pagination: Previous | 1 2 3 ... 8 | Next (green active page)

Empty state: Green stethoscope illustration + "No doctors found. Try adjusting your filters."

Make it clean, filterable, and professional. Show visual hierarchy clearly.
```

---

## SCREEN 03 — Doctor Public Profile Page

```
Design a doctor public profile page for "HealthMonitor Pro".

COLORS: Primary #0D5C45, Accent green tones, Background #F9FAFB, Cards white.
FONTS: Sora headlines, DM Sans body, JetBrains Mono for numbers.

HEADER: Same sticky nav header.

HERO CARD (full width, white background, prominent):
- Left side: Large circular doctor photo (120px), green "Verified" badge below photo
- Right side:
  - Doctor name: "Dr. Sarah Ahmed" (Sora 28px bold)
  - Specialization pill: "Cardiologist" (green background)
  - Hospital: "Shaukat Khanum Memorial Hospital, Lahore"
  - Stats row: ★ 4.8 (124 reviews) | 12 years experience | PKR 2,000/consult
  - Availability badge: green dot "Available Today"
  - Two CTA buttons: "Connect as Patient" (solid #0D5C45) | "Book Appointment" (outlined green)
- Bottom strip: Tags — Heart Disease | Hypertension | Cardiac Rehab

TABS below hero: About | Qualifications | Reviews | Availability | Blogs

ABOUT TAB (active):
- Two-column layout:
  Left (wider): 
    - "About Dr. Sarah Ahmed" section heading
    - Bio paragraph (3–4 lines)
    - Languages: English, Urdu, Punjabi (flag/pill badges)
    - "Areas of Expertise" grid: 6 pill badges in green tones
  Right (narrower — sticky sidebar):
    - "Quick Info" card: phone, email placeholder, response time "Usually within 2 hours"
    - "Book a Consultation" card (green background):
      - Type: ○ In-person  ○ Teleconsult
      - Date picker (compact)
      - "Check Availability" button
    - "Connect as Patient" card: brief explanation + green button

QUALIFICATIONS SECTION (below):
- Timeline style: each degree as a row
  - Degree name (Sora semi-bold), Institution, Year
  - Green dot on left with vertical line

REVIEWS SECTION:
- Average rating: large "4.8" with star breakdown bars (like Amazon)
- 3 review cards: patient avatar, name (anonymized), date, stars, comment

Make it professional, trustworthy, and medically appropriate.
```

---

## SCREEN 04 — Register Page (Patient + Doctor)

```
Design a multi-step registration page for "HealthMonitor Pro".

COLORS: Primary #0D5C45, Background: split — left panel #0D5C45 (dark green), right panel white.
FONTS: Sora headlines, DM Sans body.

LAYOUT: Two-panel full-viewport
- LEFT PANEL (40% width, #0D5C45 background):
  - HealthMonitor Pro logo (white)
  - Large headline: "Join HealthMonitor Pro" (Sora, white)
  - Subtitle: "Monitor your health, connect with experts"
  - Illustrated health dashboard mockup (white/mint line art)
  - 3 bullet points with checkmark icons:
    ✓ Secure & encrypted health data
    ✓ 500+ verified specialist doctors
    ✓ Real-time health monitoring
- RIGHT PANEL (60% width, white):
  - Progress indicator at top: 3 steps with green active state
    Step 1: Personal Info | Step 2: Medical Info | Step 3: Emergency Contact
  - "Create your account" heading
  - Role selector at very top (before step 1):
    Two large toggle cards:
    [🧑‍⚕️ I'm a Patient] [👨‍⚕️ I'm a Doctor]
    — Active role gets #0D5C45 border + light green background
  
  STEP 1 (PATIENT — Personal Info):
  - First Name + Last Name (side by side)
  - Email address (full width) with real-time availability check
  - Phone Number
  - Date of Birth + Gender (side by side): radio buttons Male/Female/Other styled as pill selectors
  - Password with strength indicator bar (red→orange→green)
  - Confirm Password
  - "Next Step →" button (solid #0D5C45, full width)
  
  STEP 2 (PATIENT — Medical Info):
  "← Back" link on top
  - Blood Group dropdown
  - Height (cm) + Weight (kg) side by side
  - Allergies: tag input field (type and press Enter to add green tags, × to remove)
  - Current Medications: same tag input style
  - Medical History: textarea with char counter
  - "Next Step →" button

  STEP 3 (PATIENT — Emergency Contact):
  "← Back" link
  - Emergency Contact Name
  - Relationship (dropdown: Parent/Spouse/Sibling/Friend/Other)
  - Contact Phone Number
  - Checkbox: "I agree to the Terms of Service and Privacy Policy"
  - "Create My Account" button (large, solid #0D5C45)

  DOCTOR registration Step 2 would show: Specialization, License number, Qualifications rows, Experience, Hospital, Fee, Bio, file uploads.

  DOCTOR Step 3: Weekly availability grid (days as column headers, time slots as rows — checkboxes).

Bottom: "Already have an account? Login" link

Clean, spacious form design with clear labels, green focus rings on inputs, smooth step transitions.
```

---

## SCREEN 05 — Login Page

```
Design a login page for "HealthMonitor Pro" health platform.

COLORS: Left panel #0D5C45 (deep green), Right panel white. Accent #1A9E72.
FONTS: Sora headlines, DM Sans body.

SAME two-panel layout as register page.

LEFT PANEL (#0D5C45):
- Logo + "HealthMonitor Pro"
- Headline: "Welcome Back"
- Subtext: "Continue monitoring your health journey"
- Animated health stats illustration (ECG line, vital cards in white/mint)
- Three mini stat cards floating: "BP: 120/80 Normal" | "HR: 72 bpm" | "SpO2: 98%"

RIGHT PANEL (white, centered):
- Back to home link (small, top-left)
- "Sign in to your account" heading (Sora 28px)
- Email Address input with envelope icon
- Password input with lock icon + show/hide toggle eye
- "Forgot password?" link (right-aligned, green)
- "Sign In" button (full width, solid #0D5C45, rounded-lg)
- Divider: "— or —"
- Note: "Signing in as Admin? Use the admin portal" (small gray text with link)
- Bottom: "Don't have an account? Register here" (green link)

FORGOT PASSWORD FLOW (shown as a state/step):
- "Reset Your Password" heading
- "Enter your email address and we'll send you an OTP" subtext
- Email input + "Send OTP" button
- Then: 6-box OTP input (large, center-aligned, green focus)
- Then: New Password + Confirm Password + "Reset Password" button
- "Back to Login" link at bottom

Make it minimal, fast, and professional. Green color story consistent.
```

---

## SCREEN 06 — Patient Dashboard Home

```
Design the main dashboard home screen for a PATIENT user in "HealthMonitor Pro".

COLORS: Sidebar #0A4229 (very dark green), Sidebar active item #0D5C45, Page bg #F9FAFB, Cards white.
FONTS: Sora for headings, DM Sans body, JetBrains Mono for vital numbers.

LAYOUT: Fixed left sidebar + top bar + main content area.

LEFT SIDEBAR (64px collapsed / 240px expanded, dark green #0A4229):
- Top: Logo "HM Pro" + hamburger
- Nav items with icons (white icons, left-aligned):
  [🏠] Dashboard (active — #0D5C45 background highlight, white text)
  [📊] My Vitals
  [📈] Health Trends
  [👨‍⚕️] My Doctors
  [📅] Appointments
  [💊] Prescriptions
  [💬] Messages  (unread badge "3" in red)
  [🔔] Notifications
- Bottom: Patient avatar + "Ahmed Khan" + "View Profile" link (white text)

TOP BAR (white, with bottom shadow):
- Left: "Dashboard" breadcrumb
- Center: "Good morning, Ahmed 👋" greeting
- Right: Notification bell (badge "5") + Profile dropdown avatar

MAIN CONTENT:

WELCOME BANNER:
- Light green gradient card: "Good Morning, Ahmed Khan"
- Date: "Thursday, April 10, 2025"
- Profile completeness: "Profile 80% complete" with green progress bar
- "Complete Profile" link in white

QUICK STATS ROW (4 cards, each with a colored left border):
Card 1 — Blood Pressure:
  - Icon: 💗, Label: "Blood Pressure"
  - Value: "118 / 76" in JetBrains Mono 24px bold, unit "mmHg" small
  - Badge: "Normal" (green pill)
  - Delta: "↓ 3 from yesterday" in green
Card 2 — Heart Rate:
  - Value: "72" BPM — "Normal" badge
Card 3 — Blood Glucose:
  - Value: "104" mg/dL — "Normal" badge
Card 4 — Oxygen (SpO2):
  - Value: "98" % — "Normal" badge

7-DAY SPARKLINE ROW (below stats):
- 4 mini chart cards (compact line sparklines in green, one per vital)
- Each: vital name, tiny chart (green line), latest value

TWO-COLUMN LAYOUT below:

LEFT COLUMN (wider):
VITALS ACTIVITY (card):
- "Recent Vital Entries" heading
- List of last 5 entries: date, vitals summary, risk badge
- "Log New Vitals" button (solid green, top right of card)

RIGHT COLUMN:
UPCOMING APPOINTMENTS card:
- 2–3 upcoming appointment rows:
  - Doctor photo (small), Name, Specialization
  - Date + time, Type badge (In-person/Teleconsult)
  - "View" link

CONNECTED DOCTORS card:
- 2–3 doctor mini-cards: photo, name, specialty, "Message" button

ACTIVE PRESCRIPTIONS card:
- "2 active prescriptions" with latest prescription summary

QUICK ACTIONS row (bottom):
3 large action buttons:
[📝 Log Vitals] [👨‍⚕️ Find Doctor] [📅 Book Appointment]
Solid green, icon above text, rounded-xl, full equal-width cards.

Make it data-rich but clean. Medical dashboard feel. Vital numbers should stand out.
```

---

## SCREEN 07 — Patient Vitals Log Page

```
Design the Vitals Log page for a PATIENT in "HealthMonitor Pro".

SAME sidebar + top bar layout as patient dashboard.
COLORS: Same design system. Primary #0D5C45.
FONTS: Sora headings, DM Sans body, JetBrains Mono for numbers.

PAGE HEADER:
- Title: "Log Your Vitals" (Sora 24px)
- Subtitle: "Track your daily health metrics"
- Right: "Export as PDF" button (outlined green) + "Filter by Date" date range picker

LOG NEW VITALS FORM (white card, top of page):
- Card header: "New Entry" + today's date auto-filled
  
  ROW 1: Date & Time selector (datetime-local input, default now)
  
  ROW 2 — Two columns:
  LEFT: Blood Pressure
    - Label: "Blood Pressure" with blood pressure icon
    - Two inputs side by side: [Systolic mmHg] / [Diastolic mmHg]
    - Hint below: "Normal: 90–120 / 60–80 mmHg" in gray small text
  RIGHT: Heart Rate
    - Input: [Heart Rate] bpm
    - Hint: "Normal: 60–100 bpm"
  
  ROW 3 — Two columns:
  LEFT: Oxygen Level (SpO2 %)
    - Input with % suffix, "Normal: 95–100%"
  RIGHT: Temperature (°C)
    - Input, "Normal: 36.1–37.2°C"
  
  ROW 4 — Two columns:
  LEFT: Blood Glucose (mg/dL)
    - Number input
    - Toggle below: ● Fasting  ○ Post-meal  ○ Random (pill selectors, green active)
    - Hint: changes based on toggle selection
  RIGHT: Weight (kg)
    - Number input
  
  ROW 5: Notes (full width textarea, optional)
  
  Submit button: "Save Vital Entry" (solid #0D5C45, full width)

VITALS HISTORY TABLE (white card, below form):
- Card header: "History" + record count "48 entries"
- Table columns:
  Date & Time | Blood Pressure | Heart Rate | SpO2 | Glucose | Weight | Temp | Risk | Actions
  
  Row example:
  Apr 9, 2025 8:30 AM | 118/76 mmHg | 72 bpm | 98% | 104 mg/dL | 70 kg | 36.8°C | [Normal ✓] | [✏️] [🗑️]
  
  Row with risk flag:
  Apr 8, 2025 | 145/95 mmHg | 98 bpm | ... | ... | [HIGH ⚠️ red badge] | [✏️] [🗑️]
  
- Risk badge styling:
  Normal: green pill badge
  Medium: amber/yellow pill badge
  High: red pill badge (with warning icon)
  
- Pagination: 15 per page, page controls at bottom
- Column headers sortable (sort icon on hover)

Make the form intuitive with clear field groupings. Table should handle many rows cleanly.
```

---

## SCREEN 08 — Patient Health Trends Page

```
Design the Health Trends visualization page for a PATIENT in "HealthMonitor Pro".

SAME sidebar + top bar layout.
COLORS: Primary #0D5C45, chart lines in greens and teals.

PAGE HEADER:
- Title: "Health Trends" (Sora 24px)
- Subtitle: "Visualize your health patterns over time"

VITAL SELECTOR TABS (pill-style tab bar):
[Blood Pressure] [Heart Rate] [Blood Glucose] [Weight] [SpO2] [Temperature]
Active tab: solid #0D5C45 background, white text. Inactive: outlined, green text.

DATE RANGE QUICK BUTTONS (right side of tab row):
[7 Days] [30 Days] [3 Months] [Custom]
Active: green background. Inactive: gray outlined.

MAIN CHART CARD (white, large, prominent):
- Card heading: "Blood Pressure — Last 30 Days" (matches selected tab + range)
- Area chart (Recharts-style illustration):
  - X axis: dates
  - Y axis: values (mmHg for BP, bpm for HR, etc.)
  - TWO lines for BP: systolic (solid green #1A9E72) + diastolic (teal #14A0A0)
  - Shaded area between lines (very light green fill)
  - GREEN shaded band = "Normal Range" (subtle green rectangle overlay)
  - Red dots on data points that are flagged/out of range
  - Tooltip on hover: date, exact values, status badge
- Chart should be tall (350–400px) and clearly readable

SUMMARY STATS ROW (4 cards below chart):
- Minimum: "108/68 mmHg" (Sora + JetBrains Mono for value)
- Maximum: "145/95 mmHg" (red text if outside normal)
- Average: "121/79 mmHg"
- Out of Range: "3 readings" (amber if > 0)

FLAGGED READINGS CARD (below stats, only shows if there are flags):
- Title: "⚠️ 3 Flagged Readings"
- List of flagged dates with values and reason
- "View in Vitals History" link

Export button (floating bottom right or in card header): "Export Chart as PDF"

Design should feel like a premium health analytics tool. Charts must be the hero element.
```

---

## SCREEN 09 — Patient My Doctors Page

```
Design the "My Doctors" page for a PATIENT in "HealthMonitor Pro".

SAME sidebar + top bar layout.
COLORS: Primary #0D5C45.

PAGE HEADER:
- Title: "My Doctors" (Sora 24px)
- Subtitle: "Manage your healthcare team"
- Right: "Find & Connect New Doctor" button (solid #0D5C45)

CONNECTED DOCTORS SECTION:
- "Connected Doctors (3)" sub-heading

Doctor cards (horizontal list, wider cards):
Each card (white, rounded-xl, shadow-sm, full-width row):
- Left: Doctor photo (72px circle) with green "Active" dot
- Middle:
  - Name: "Dr. Sarah Ahmed" (Sora semi-bold 16px)
  - Specialization badge: green pill "Cardiologist"
  - Hospital: gray text
  - "Connected since: March 2025"
  - "Last interaction: 2 days ago"
- Right:
  - "Message" button (outlined green, icon + text)
  - "Book Appointment" button (outlined green)
  - "Disconnect" button (small, gray/red outlined) with tooltip warning

EMPTY STATE (if no doctors):
- Illustration: two people shaking hands in mint/green
- "No doctors connected yet"
- Subtext: "Connect with a verified specialist to start getting personalized care"
- "Find a Doctor" CTA button (solid green, centered)

FIND DOCTOR MODAL (triggered by "Find & Connect" button):
Full-screen overlay modal:
- Header: "Find Your Doctor" + close button (×)
- Search bar (full width): "Search by name or specialization"
- Filter row (horizontal pills): All | Cardiologist | Neurologist | Diabetologist | Eye | General
- Doctor cards grid (3 per row in modal):
  - Photo, name, specialization, rating, fee, "Connect" button (solid green)
  - If already connected: button becomes "Connected ✓" (disabled, gray)
- Pagination at bottom of modal
- Cancel button at bottom

Make it clean. The empty state should motivate action. Modal should feel layered but not overwhelming.
```

---

## SCREEN 10 — Patient Appointments Page

```
Design the Appointments page for a PATIENT in "HealthMonitor Pro".

SAME sidebar + top bar layout.
COLORS: Primary #0D5C45, status badges in semantic colors.

PAGE HEADER:
- Title: "Appointments" (Sora 24px)
- Right: "Book Appointment" button (solid #0D5C45)

STATUS TABS: [Upcoming (3)] [Past (12)] [Cancelled (1)]
(Tabs with count badge, active tab has green underline)

UPCOMING APPOINTMENTS LIST:
Each appointment card (white, rounded-xl, left border color by type):
- In-person: left border green #0D5C45
- Teleconsult: left border teal #14A0A0

Card content:
- Top row: Date + Time (bold, Sora) | Type badge (pill: In-person/Teleconsult) | Status badge (Confirmed/Pending)
- Doctor row: photo (48px), "Dr. Sarah Ahmed", "Cardiologist", Hospital name
- Notes (if any): light gray quote-style
- Bottom action row:
  - "Cancel Appointment" (red outlined, small)
  - "Reschedule" (gray outlined, small)
  - For teleconsult (if within 1hr): "Join Call" (solid green with video icon — prominent)

PAST APPOINTMENTS LIST (different tab):
- Grayed-out cards (reduced opacity)
- Status: "Completed" (green badge) or "Cancelled" (red badge)
- "View Summary" link to see doctor notes

BOOK APPOINTMENT MODAL:
Step 1 form:
- "Book New Appointment" modal heading
- Doctor selector (dropdown with search — only connected doctors):
  Shows photo + name + specialization in options
- Appointment Type: [○ In-person] [○ Teleconsult] — styled as toggle cards
- Date picker: calendar UI showing available dates in green, unavailable grayed out
- Time slot grid: available slots as green buttons (09:00 | 09:30 | 10:00 etc.)
  Selected slot: solid green. Unavailable: gray with strikethrough.
- Notes: optional textarea
- "Confirm Booking" button (solid green, full width)
- "Cancel" link

Make appointment cards visually distinct. "Join Call" button should be very prominent when available.
```

---

## SCREEN 11 — Patient Messages / Chat Page

```
Design the real-time chat/messages page for a PATIENT in "HealthMonitor Pro".

SAME sidebar + top bar layout.
COLORS: Primary #0D5C45, chat bubbles in green tones.

LAYOUT: Two-panel chat interface (full height, fills remaining viewport)

LEFT PANEL — Conversations List (300px, white, border-right):
- Header: "Messages" (Sora 18px semi-bold)
- Search bar: "Search conversations..."
- Conversation list items (each row):
  - Doctor avatar (40px circle) with online dot
  - Doctor name (bold), Specialization (gray small)
  - Last message preview (1 line truncated, gray)
  - Timestamp (right-aligned, small gray)
  - Unread count badge (red pill, right-aligned) — shown only if unread
  - Active conversation: light green background (#E8F9F2)

RIGHT PANEL — Chat Window:
- Chat header (white, border-bottom):
  - Doctor avatar + name + specialization + Online status indicator
  - "View Profile" link (right side)
  - Video call icon button (for teleconsult)

- Messages area (scrollable, light gray/white alternating bg):
  RECEIVED messages (doctor, left-aligned):
    - Avatar (small, 32px) + message bubble (white, border, rounded-2xl except bottom-left corner)
    - Sender name above first message in a group
    - Timestamp below bubble (gray, small)
  
  SENT messages (patient, right-aligned):
    - Message bubble (solid #0D5C45 background, white text, rounded-2xl except bottom-right)
    - Timestamp below + "Read" checkmark icon (green double-tick)
  
  DATE SEPARATOR: centered gray pill "Today" / "Yesterday" / "Apr 9"
  
  TYPING INDICATOR (when doctor is typing):
    - Avatar + animated 3-dot bounce animation in a white bubble
  
  FILE MESSAGE:
    - Paper clip icon + file name + download button (inside bubble)
  
  PRESCRIPTION MESSAGE:
    - Special card bubble: prescription icon, "Prescription from Dr. Sarah Ahmed" heading, 
      medication summary, "Download PDF" green button

- Input bar (fixed bottom, white, border-top):
  - Attach file icon (paperclip, gray)
  - Text input field: "Type a message..." (full width, rounded-full)
  - Send button: solid green circle with arrow icon
  - All on same horizontal line

Make the chat feel modern and clean. Green color story for sent messages is distinctive.
```

---

## SCREEN 12 — Doctor Dashboard Home

```
Design the DOCTOR dashboard home for "HealthMonitor Pro".

SAME sidebar + top bar structure as patient but different nav items.
COLORS: Sidebar #0A4229, Active #0D5C45, Page bg #F9FAFB.

SIDEBAR NAV ITEMS:
[📊] Dashboard (active)
[👥] My Patients
[💊] Prescriptions
[📅] Appointments
[📝] My Blogs
[💬] Messages
[👤] Profile

TOP BAR RIGHT: "Dr. Sarah Ahmed" | "Cardiologist" specialization tag | Notification bell | Avatar dropdown

MAIN CONTENT:

DOCTOR WELCOME BANNER (white card with green left accent border):
- "Welcome back, Dr. Sarah Ahmed"
- "Cardiologist · Shaukat Khanum Hospital"
- "Verified Doctor" badge (green with checkmark icon) + "Approved" status
- Today's date

STATS ROW (4 cards):
1. Total Patients: "32" | icon: group of people
2. Pending Appointments: "5" | icon: calendar with dot | amber color if >0
3. Unread Messages: "8" | icon: chat | badge styling
4. Published Blogs: "12" | icon: document
Each card: white, shadow, green icon, value in Sora bold 28px JetBrains Mono

PATIENTS AT RISK CARD (prominent, warning styling):
- Header: "⚠️ Patients Requiring Attention" (amber heading)
- Top 4 at-risk patients in a list:
  Patient row: Photo (40px) | Name | Risk badge (HIGH=red, MEDIUM=amber) | Flagged vital: "BP: 155/98 mmHg" | "View Record" link (green)
- "View All Patients" link at bottom

TODAY'S SCHEDULE CARD:
- "Today's Appointments" heading + count badge
- Timeline list:
  09:00 AM — Ahmed Khan — In-person — Confirmed (green dot)
  10:30 AM — Fatima Ali — Teleconsult — Confirmed (teal dot)
  2:00 PM  — Slot available (gray dashed)
- "View Full Calendar" link

TWO-COLUMN LOWER SECTION:
LEFT — RECENT PATIENT ACTIVITY:
- Feed of recent vital submissions:
  "Ahmed Khan logged vitals · 2 hours ago · [Normal ✓]"
  "Fatima Ali logged vitals · 5 hours ago · [HIGH ⚠️]" (red row highlight)
  "Umar Sheikh logged vitals · 1 day ago · [Normal ✓]"

RIGHT — QUICK ACTIONS:
Three large action buttons stacked:
[👥 View All Patients] — outlined green
[💊 New Prescription] — solid green
[📝 Write a Blog] — outlined teal

Make it feel like a professional medical command center. Risk section should demand attention.
```

---

## SCREEN 13 — Doctor Patient List Page

```
Design the "My Patients" list page for a DOCTOR in "HealthMonitor Pro".

SAME sidebar + top bar. COLORS: Primary #0D5C45.

PAGE HEADER:
- Title: "My Patients" (Sora 24px)
- Subtitle: "32 patients assigned to you"
- Right side: Search bar (inline) + Filter dropdown

FILTER BAR:
- Search: "Search by patient name..."
- Filter pills: [All Patients] [HIGH Risk] [MEDIUM Risk] [Normal]
  Active: solid green. Inactive: outlined green.
- Sort: "Last Updated" dropdown

PATIENTS TABLE (white card):
Table headers: Photo | Patient | Age | Primary Concern | Last Vital | Risk | Actions

Table rows:
Row 1 (HIGH risk — very subtle red left border):
  - Photo (40px circle)
  - Name: "Fatima Ali" (bold) / Email: "fatima@email.com" (gray small)
  - Age: "45"
  - Primary Concern: "Hypertension" (gray)
  - Last Vital: "Today, 2:30 PM" (small, gray)
  - Risk: [HIGH ⚠️] — red pill badge
  - Actions: "View Record" (green outlined btn) + "Message" (icon btn)

Row 2 (MEDIUM risk — subtle amber left border):
  - Similar structure but [MEDIUM] amber badge

Row 3 (Normal):
  - [Normal ✓] green badge

- Hovering row: light green background tint
- Pagination: 15 per page

PATIENT QUICK VIEW (on row click, optional slide-in panel from right, 400px):
- Patient name + photo header
- Quick vital summary: last 3 vital readings
- Risk level
- Two CTA buttons: "Full Record" and "Send Message"

Make the table scannable. Risk badges should be immediately visible. Row actions clear and fast.
```

---

## SCREEN 14 — Doctor Patient Detail Page

```
Design the full Patient Detail page for a DOCTOR viewing a patient in "HealthMonitor Pro".

SAME sidebar + top bar. COLORS: Primary #0D5C45.

BREADCRUMB: Dashboard > My Patients > Fatima Ali

PATIENT HEADER CARD (white, prominent):
- Large: Patient photo (80px), Name "Fatima Ali" (Sora 24px), "Female · 45 years"
- Tags row: Blood Group "O+" | Allergies "Penicillin, Aspirin" (red pill tags)
- Stats: "Connected since: Mar 2025" | "Last vital: Today 2:30 PM" | "Risk: HIGH" badge
- Action bar: [Send Message] [New Prescription] [Schedule Appointment] [Add Note]
  All buttons in a row, primary and outlined styles mixed.

VITAL OVERVIEW ROW (4 cards — same as patient dashboard but read-only, doctor view):
Latest: BP (155/98 — red, flagged) | HR (88 bpm — normal) | Glucose (168 mg/dL — amber) | SpO2 (97%)

RISK ALERTS CARD (only shows if flagged records exist, amber/red toned):
- "⚠️ 2 Active Alerts"
- Alert rows:
  [HIGH] Blood Pressure: 155/98 mmHg · Apr 9, 2025 — "Hypertensive range — immediate attention recommended"
  [MEDIUM] Post-meal Glucose: 168 mg/dL · Apr 8, 2025

TABS: Vitals History | Trends | Prescriptions | Appointments | My Notes

VITALS HISTORY TAB (active):
- Same table as patient's vitals page but read-only (no edit/delete actions for doctor)
- Doctor CAN add a note/comment per record (small "Add Note" link)

TRENDS TAB:
- Same chart component as patient trends
- Doctor view label: "Viewing Fatima Ali's Health Trends"

PRESCRIPTIONS TAB:
- All prescriptions this doctor sent to this patient
- Each as a card with date, diagnosis, medications list, download PDF

MY NOTES TAB (private doctor notes):
- Textarea for doctor's private notes on this patient
- "Only you can see these notes" disclaimer
- "Save Notes" button
- Notes history (timestamped entries below)

Make it comprehensive but organized. Doctor should have all context at a glance to make decisions.
```

---

## SCREEN 15 — Doctor Blog Editor Page

```
Design the Blog Editor / Create Blog page for a DOCTOR in "HealthMonitor Pro".

SAME sidebar + top bar. COLORS: Primary #0D5C45.

PAGE HEADER:
- Breadcrumb: Dashboard > My Blogs > New Blog
- Title: "Write a Health Article" (Sora 24px)
- Right: [Save Draft] (outlined gray) + [Submit for Review] (solid #0D5C45)

EDITOR LAYOUT (two-column: 70% editor left, 30% settings sidebar right):

LEFT — MAIN EDITOR (white card):
- Title field (full width, large placeholder: "Article title..." in Sora 28px, no border — clean)
- Divider line
- Excerpt field (smaller, "Brief description of your article — shown in listing pages...")
- Cover image upload zone:
  Dashed border rectangle, "Drop cover image here or click to upload"
  After upload: shows image preview with "Change" / "Remove" buttons
- TipTap Rich Text Toolbar:
  [H2] [H3] [B] [I] [U] | [Link] [Image] | [Ordered List] [Bullet List] | [Quote] [Code] | [Divider]
  Toolbar styled in white with green active states
- Rich text content area (large, min 500px height)
  Placeholder: "Start writing your article... Share your medical expertise with patients."
  Typography: DM Sans, good line height, comfortable reading width

RIGHT SIDEBAR (sticky):
- PUBLISH SETTINGS card:
  - Category dropdown: "Select category..." (Cardiology, Neurology, Diabetes, etc.)
  - Tags: multi-input (type + Enter, green pill tags appear)
  - Estimated read time: auto-calculated "~5 min read"
  
- STATUS card:
  - Current status: "Draft" (gray badge)
  - "Submit for Review" explanation: "Your article will be reviewed by admin before going live."
  
- AUTHOR card:
  - Doctor photo + name + specialization (auto-filled, read-only)
  - "This article will be published under your name"

BOTTOM ACTION BAR (sticky footer, white, border-top):
[← Cancel] (left, gray link) ... [Save Draft] [Preview] [Submit for Review →] (right, green solid)

BLOG LIST PAGE (separate but related — show as blog management list):
Tabs: [Draft (2)] [Pending Review (1)] [Published (12)] [Rejected (0)]

Blog row: Cover thumbnail | Title | Category | Status badge | Date | Views | Edit/Delete actions

Status badges:
- Draft: gray
- Pending: amber "Under Review"
- Published: green "Live"
- Rejected: red "Rejected" with "See feedback" link

Make the editor feel like a professional writing tool (Medium/Notion inspired) in a medical app context.
```

---

## SCREEN 16 — Admin Login Page

```
Design the ADMIN login page for "HealthMonitor Pro". This is a private, separate portal.

COLORS: Dark theme — Background #0A1A12 (very dark green-black), card #111F17, accents #0D5C45, #1A9E72.
FONTS: Sora headlines, DM Sans body.

FULL-SCREEN DARK LAYOUT (no public header/footer, standalone page):

CENTER CARD (dark green card, centered, 420px wide, rounded-2xl, border: 1px #1A3D2A):
- Top: "HealthMonitor Pro" logo in green + admin shield icon
- Heading: "Admin Portal" (Sora 24px, white)
- Subtext: "Restricted access — authorized personnel only" (red/amber small text)
- Divider

- Email field (dark input, green focus ring, white text)
  Label: "Administrator Email"
- Password field (dark input, show/hide toggle)
  Label: "Password"
- "Sign In to Admin Portal" button (solid #0D5C45, full width, rounded-lg)

- Security note at bottom: "🔒 This portal is monitored. All actions are logged."
- "Return to main site" small link at very bottom (gray, subtle)

RATE LIMIT WARNING STATE (shows after 3 failed attempts):
- Amber alert box: "3 failed attempts. 2 attempts remaining before 15-minute lockout."

LOCKED STATE (shows after 5 failed):
- Red alert: "Too many failed attempts. Please try again in 15 minutes."
- Countdown timer showing remaining lockout time

Background: Dark with subtle green geometric pattern or medical cross pattern at very low opacity.
No Register button, no Forgot Password prominently — keep it minimal and secure-feeling.

This should feel like a high-security enterprise portal, not a consumer app.
```

---

## SCREEN 17 — Admin Dashboard

```
Design the ADMIN dashboard for "HealthMonitor Pro".

COLORS: Sidebar #052E1C (deepest green), Active #0D5C45, Page bg #F0F4F3, Cards white.
FONTS: Sora headings, DM Sans body, JetBrains Mono for numbers.

ADMIN SIDEBAR (wider than patient sidebar, 260px):
- "Admin Portal" heading (white, small, uppercase tracking)
- Admin avatar + "Super Admin" role tag (amber badge)
Nav sections:
OVERVIEW:  [📊] Dashboard
MANAGEMENT: [👨‍⚕️] Doctors  (pending badge: 4)
            [🧑] Patients
            [📝] Blogs  (pending badge: 2)
            [📅] Appointments
ANALYTICS:  [📈] Analytics
            [🔔] Notifications
SYSTEM:     [⚙️] Settings
            [🚪] Logout

TOP BAR (white):
- "Admin Dashboard" title
- Right: Admin name + avatar + "Last login: Today 9:15 AM"

MAIN CONTENT:

KPI ROW (6 cards, 3+3 grid):
1. Total Users: "10,542" (green icon: people)
2. Active Doctors: "487" (teal icon: stethoscope)
3. Active Patients: "10,055" (blue-green icon)
4. Pending Approvals: "4" (AMBER background — urgent!) | icon: clock
5. Blogs Published: "2,341" (green icon)
6. Appointments Today: "128" (green icon: calendar)
Card #4 should be visually distinct (amber/warning tone) to demand attention.

PENDING APPROVALS WIDGET (prominent, amber left border):
- Heading: "🕐 Pending Doctor Approvals (4)"
- List of 4 pending doctors:
  Photo | "Dr. Ahmed Raza" | "Orthopedic Surgeon" | "Applied: 2 days ago" | [Review] button (green)
- "View All Pending" link at bottom

PENDING BLOG REVIEWS WIDGET (similar styling):
- "📝 Blogs Awaiting Review (2)"
- List: Author photo | Blog title | Category | "2 days ago" | [Review] button

USER GROWTH CHART (white card, large):
- "Platform Growth — Last 30 Days" heading
- Line chart: two lines — Patients (green) vs Doctors (teal)
- X: dates, Y: cumulative count
- Subtle grid lines, clean chart

RECENT ACTIVITY FEED (right column):
- "Recent Activity" (last 10 events)
- Feed items with icons:
  ✅ "Dr. Raza approved" · 1 hr ago
  🧑+ "New patient registered" · 2 hrs ago
  📝 "Blog submitted by Dr. Ahmed" · 3 hrs ago
  ❌ "Dr. XYZ rejected" · Yesterday

Make it feel like a command center. Pending approvals should feel urgent. Data should be dense but readable.
```

---

## SCREEN 18 — Admin Doctor Management Page

```
Design the Doctor Management page for ADMIN in "HealthMonitor Pro".

SAME admin sidebar + top bar. COLORS: Admin green system.

PAGE HEADER:
- Title: "Doctor Management" (Sora 24px)
- Stats: "487 approved | 4 pending | 3 suspended"
- Right: "Export CSV" button (outlined)

TABS: [Pending Approval (4)] [All Doctors (487)] [Suspended (3)]

PENDING APPROVAL TAB (active, urgent):
- Amber info banner: "4 doctor applications require your review"
- Cards for each pending doctor (not table — card style for review):
  Card (white, rounded-xl, left border amber):
    - Left: Doctor photo (64px)
    - Center:
      Name (bold Sora) + Specialization badge
      License # (partially obscured: "PMDC-****-2891")
      Hospital + City
      Applied: "2 days ago"
    - Right:
      [Review Application] button (solid green)
      [Quick Reject] button (outlined red, small)

REVIEW MODAL (full screen overlay when "Review Application" clicked):
- Two-column layout:
  LEFT: All doctor profile info vertically:
    Photo (large), Name, Specialization, License #, Hospital, Bio, Qualifications list, Experience, Fee, Availability schedule
  RIGHT:
    License Document viewer (PDF embed or image preview)
    Document download button
  
  BOTTOM ACTION BAR (fixed):
    [✗ Reject] (outlined red) ... [✓ Approve Doctor] (solid green, large)
  
  On Reject: inline textarea appears: "Reason for rejection..." + [Send Rejection] button

ALL DOCTORS TAB:
- Search + filter bar
- Data table:
  Photo | Name | Specialization | Patients | Status | Joined | Actions
  Actions: [View] [Edit] [Suspend] [Delete] — icon buttons with tooltips
  Suspended doctors: grayed row with "Suspended" amber badge
- Bulk select checkboxes + bulk actions (Suspend selected / Delete selected)

Make the pending review experience the priority. Approval flow should be 2 clicks max.
```

---

## SCREEN 19 — Admin Blog Management Page

```
Design the Blog Management page for ADMIN in "HealthMonitor Pro".

SAME admin sidebar + top bar.

PAGE HEADER:
- Title: "Blog Management"
- Stats: "2,341 published | 2 pending | 45 rejected"
- Right: [Write Blog] button (admin can publish directly without review) + [Export]

TABS: [Pending Review (2)] [All Blogs] [Rejected]

PENDING REVIEW TAB:
- "2 articles require review" info bar (amber)
- Blog review cards:
  Card (white, rounded-xl):
    - Left: Cover image thumbnail (100px × 70px, rounded)
    - Center:
      Title (Sora semi-bold)
      "By Dr. Sarah Ahmed · Cardiologist"
      Category badge (mint green) + Tags (small pills)
      Excerpt (2 lines, gray)
      Submitted: "3 days ago" | Estimated read: "6 min"
    - Right:
      [Preview Article] button (outlined teal)
      [Publish] button (solid green)
      [Reject] button (outlined red)

ARTICLE PREVIEW MODAL (when "Preview Article" clicked):
- Full-screen modal with the complete rendered blog content
- Header: "Preview: [Article Title]"
- Full rich text rendered content (as it would appear on public site)
- Side panel (sticky right, 280px): Author info + category + tags + submission date
- Bottom action bar: [Reject with Feedback] [Publish Article →]
- Reject drawer: "Reason for rejection" textarea + [Send Feedback] button

ALL BLOGS TAB:
- Filter bar: Status pills [All] [Published] [Rejected] [Pending]
- Table: Thumbnail | Title | Author | Category | Status | Views | Published Date | Actions
- Actions: [View] [Edit] [Unpublish] [Delete]
- Status filter toggles which actions are available

ADMIN WRITE BLOG (modal or page):
- Same TipTap editor as doctor blog editor but simpler (no approval step)
- Status goes directly to "published" when admin clicks "Publish"

Clean, functional. Review flow should be the most prominent feature of this page.
```

---

## SCREEN 20 — Admin Analytics Page

```
Design the Analytics page for ADMIN in "HealthMonitor Pro".

SAME admin sidebar + top bar. COLORS: Rich data visualization.

PAGE HEADER:
- Title: "Platform Analytics"
- Date range picker: [Last 30 Days ▼] (dropdown: 7D / 30D / 90D / This Year / Custom)
- Right: [Export Full Report PDF] button (solid #0D5C45)

ANALYTICS GRID LAYOUT:

ROW 1 — Headline KPIs (5 mini stat cards):
New Patients (this month) | New Doctors | Total Vitals Logged | Appointments Completed | Blogs Published
Each: value (large Sora + JetBrains Mono), % change vs last period (green up arrow or red down)

ROW 2 — Two charts side by side:
LEFT — User Growth Chart (white card, line chart):
  "New Registrations Over Time"
  Two lines: Patients (green) + Doctors (teal mint)
  X: months, Y: count
  Chart legend bottom

RIGHT — Vitals Volume Chart (white card, area chart):
  "Daily Vitals Submissions"
  Filled area in green gradient
  X: dates, Y: submissions per day

ROW 3 — Two sections side by side:
LEFT — Top Doctors Table (white card):
  "Most Active Doctors"
  Rank | Photo | Doctor | Specialty | Patients | Prescriptions | Appointments | Rating
  Top 5 rows, sortable columns
  "View All" link at bottom

RIGHT — Appointment Funnel (white card):
  "Appointment Conversion"
  Horizontal bar chart or funnel:
  Requested (100%) → Confirmed (82%) → Completed (71%) → Cancelled (12%)
  Bars in green shades, labels + percentages

ROW 4 — Blog Engagement Table (white card, full width):
  "Blog Performance"
  Rank | Cover | Title | Author | Views | Likes | Category | Published Date
  Sortable. Top 10 blogs.

ROW 5 — Risk Distribution (white card, half width):
  "Patient Risk Distribution (Today)"
  Donut/pie chart: Normal (green, 72%) | Medium (amber, 20%) | High (red, 8%)
  Legend with counts below

Footer export banner: "Download complete analytics report as PDF"

This page should feel like a premium analytics dashboard. Charts should be the hero.
```

---

## SCREEN 21 — Patient Prescriptions Page

```
Design the Prescriptions page for a PATIENT in "HealthMonitor Pro".

SAME patient sidebar + top bar. COLORS: Primary #0D5C45.

PAGE HEADER:
- Title: "My Prescriptions"
- Subtitle: "View and download prescriptions from your doctors"

PRESCRIPTIONS LIST:
Each prescription card (white, rounded-xl, shadow-sm):

CARD HEADER (light green bg #E8F9F2, rounded top):
- Left: Doctor photo (40px) + "Dr. Sarah Ahmed" + "Cardiologist"
- Right: Date "April 8, 2025" + "Download PDF" button (outlined green, small, with download icon)

CARD BODY:
- Diagnosis row: 💊 "Diagnosis: Hypertension — Grade 1"
- Follow-up: 📅 "Follow-up: April 22, 2025" (green badge if upcoming)

Medications table (collapsed by default, expand on click):
Expand trigger: "3 medications · Click to view" (with chevron down icon)

Expanded medications table:
| Medication | Dosage | Frequency | Duration |
| Amlodipine | 5mg | Once daily | 30 days |
| Metoprolol | 25mg | Twice daily | 30 days |
| Aspirin | 75mg | Once daily | 30 days |

Table styling: alternating light green/white rows, small clean typography

- Instructions (below table): "Take with water. Avoid grapefruit juice. Monitor BP daily."

CARD FOOTER:
- "Prescribed by Dr. Sarah Ahmed · Apr 8, 2025"

EMPTY STATE:
- Green medicine bag illustration
- "No prescriptions yet"
- "Your doctor's prescriptions will appear here"

Sort control: "Latest First" dropdown (top right of list)

Make cards clean and professional. Medications table should expand smoothly. PDF download prominent.
```

---

## SCREEN 22 — Pending Approval Screen (Doctor waiting)

```
Design the "Pending Approval" holding screen shown to a doctor whose account is awaiting admin review in "HealthMonitor Pro".

FULL-PAGE LAYOUT (no sidebar, standalone page with minimal header):
- Header: Logo only + "HealthMonitor Pro" text + Logout link (top right)
- Center-aligned card (max 560px, white, rounded-2xl, shadow-xl)

CARD CONTENT:

Illustration (top center): Abstract illustration of a document being reviewed (clock + checkmark theme) in green tones

Status badge (large, centered): 
  🕐 "Under Review" — amber/yellow pill badge, larger than normal

Main heading: "Your Application is Being Reviewed"
(Sora 24px, #0D5C45)

Subtext:
"Thank you for registering as a doctor on HealthMonitor Pro. Our admin team is reviewing your credentials and documents. You'll receive an email notification once your account is approved."

STATUS TIMELINE (vertical, centered):
✅ "Application Submitted" — green checkmark, "April 8, 2025"
⏳ "Under Admin Review" — amber animated spinner — "In progress"
○  "Account Approved" — gray dot, "Pending"
○  "Access Granted" — gray dot, "Pending"

INFO BOXES (two side by side):
Left box (light green bg): 
  "📧 Check Your Email"
  "We'll send an approval notification to: doctor@email.com"

Right box (light mint bg):
  "⏱️ Review Timeline"
  "Most applications are reviewed within 24–48 hours"

WHAT TO DO IN THE MEANTIME section:
- "While you wait, you can:" 
  ✓ Complete your profile (link)
  ✓ Review our doctor guidelines (link)
  ✓ Browse the platform

"Contact Support" link at bottom (small, gray)

This should feel reassuring and professional, not frustrating. The waiting state should communicate trust.
```

---

*End of Stitch Screen Prompts — HealthMonitor Pro v1.0*
*Total screens: 22 | Color system: Deep Forest Green + Clinical Mint | Fonts: Sora + DM Sans + JetBrains Mono*
