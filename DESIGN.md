# Design System: Luminous Minimalist

## Core Philosophy
A premium, "Apple-inspired" aesthetic that prioritizes clarity, content, and contextual relevance. The design uses soft shadows, generous whitespace, and "frosted glass" (glassmorphism) effects to create a layered, modern feel.

---

## Visual Tokens

### Colors
- **Surface:** `#F9F9FF` (Soft off-white with a hint of blue)
- **Surface Container:** `#FFFFFF` (Pure white for cards and modules)
- **Primary (Accent):** `#0066CC` (Deep, vibrant blue)
- **Secondary:** `#5C5E70` (Muted slate for secondary text)
- **Error:** `#BA1A1A`
- **Success:** `#2D6A4F`
- **Glassmorphism:** `rgba(255, 255, 255, 0.7)` with `backdrop-filter: blur(20px)`

### Typography
- **Primary Font:** `Manrope` (or San Francisco/Inter as alternatives)
- **Headlines:** `font-bold`, `tracking-tight`
- **Body:** `font-medium`, `leading-relaxed`
- **System Labels:** `font-semibold`, `uppercase`, `tracking-widest`, `text-[10px]`

### Geometry & Spacing
- **Corner Radius:**
  - **Standard Cards:** `24px` (Large, friendly rounds)
  - **Buttons:** `12px` or `full`
  - **Small Elements:** `8px`
- **Padding:**
  - **Screen Gutter:** `20px`
  - **Card Interior:** `16px` to `20px`
- **Shadows:**
  - **Soft Elevation:** `0 4px 24px rgba(0, 0, 0, 0.04)`
  - **Deep Floating:** `0 10px 40px rgba(0, 0, 0, 0.08)`

---

## Component Guidelines

### 1. Top App Bar
- **Style:** Transparent or blurred background (`backdrop-blur`).
- **Elements:** Large profile avatar (left), bold centered title, icon-only notifications (right).
- **Separation:** No border; use elevation or subtle shadow on scroll.

### 2. Bottom Navigation
- **Style:** Rounded top corners (`24px`), pure white or blurred background.
- **Icons:** Minimalist outline icons, shifting to solid when active.
- **Labels:** Tiny, centered under icons.

### 3. Contextual Offer Cards
- **Structure:**
  - Full-width high-quality photography with `15%` aspect ratio.
  - White content area with generous vertical padding.
  - Clear "Call to Action" button using the Primary accent color.
- **Glass Overlays:** Use semi-transparent tags (e.g., "% 15% OFF") in the top-left corner of images.

### 4. Progress Bars
- **Style:** Thick tracks (`8px`), rounded ends.
- **Color:** Primary accent for the progress, light grey for the track.

---

## Interaction States
- **Hover/Tap:** Subtle scale down (`active:scale-95`) and opacity shift.
- **Transitions:** Smooth `300ms` eases for all state changes.
- **Empty States:** Use light grey minimalist icons and centered, descriptive text.

---

## Iconography
- **Set:** Material Symbols (Rounded) or SF Symbols.
- **Weight:** Regular or Medium.
- **Color:** `#1D1B20` for active, `#938F99` for inactive.