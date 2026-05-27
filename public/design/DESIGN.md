---
name: Forge Cyber-Minimalism
colors:
  surface: '#1d100e'
  surface-dim: '#1d100e'
  surface-bright: '#473532'
  surface-container-lowest: '#180b09'
  surface-container-low: '#261816'
  surface-container: '#2b1c19'
  surface-container-high: '#362623'
  surface-container-highest: '#42312e'
  on-surface: '#f8dcd8'
  on-surface-variant: '#e3beb8'
  inverse-surface: '#f8dcd8'
  inverse-on-surface: '#3d2c2a'
  outline: '#aa8984'
  outline-variant: '#5a403c'
  surface-tint: '#ffb4a8'
  primary: '#ffb4a8'
  on-primary: '#690000'
  primary-container: '#8b0000'
  on-primary-container: '#ff907f'
  inverse-primary: '#b52619'
  secondary: '#ffb3b4'
  on-secondary: '#680016'
  secondary-container: '#ac012c'
  on-secondary-container: '#ffb7b8'
  tertiary: '#bcc3ff'
  on-tertiary: '#001a98'
  tertiary-container: '#0025c8'
  on-tertiary-container: '#9ea9ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad4'
  primary-fixed-dim: '#ffb4a8'
  on-primary-fixed: '#410000'
  on-primary-fixed-variant: '#920703'
  secondary-fixed: '#ffdad9'
  secondary-fixed-dim: '#ffb3b4'
  on-secondary-fixed: '#40000a'
  on-secondary-fixed-variant: '#920023'
  tertiary-fixed: '#dfe0ff'
  tertiary-fixed-dim: '#bcc3ff'
  on-tertiary-fixed: '#000d60'
  on-tertiary-fixed-variant: '#0d2ccc'
  background: '#1d100e'
  on-background: '#f8dcd8'
  surface-variant: '#42312e'
typography:
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-base:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
  code-snippet:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  sidebar-width: 260px
  gutter: 16px
---

## Brand & Style

The visual identity is rooted in the concept of high-intensity creation—the digital blacksmith's anvil. This design system targets developers who demand a focused, high-performance environment that feels less like a corporate tool and more like a high-end terminal interface. 

The aesthetic is **Futuristic Minimalist** with a "Polished Hacker" edge. It utilizes deep, dark surfaces to minimize eye strain during long sessions, contrasted with sharp, luminous accents that signify active states and data importance. The mood is serious, precise, and authoritative.

## Colors

The palette is dominated by "Deep Void" tones to create an immersive, focused workspace. 

- **Primary & Accent:** Dark Maroon and Crimson are used sparingly for critical actions, active states, and brand highlights. These colors represent the heat of the forge.
- **Neutrals:** The background is a near-black matte, while surfaces use subtle shifts in dark grey to create hierarchy.
- **Utility:** Success, warning, and error states should maintain the dark aesthetic, using desaturated greens or ambers to avoid breaking the high-contrast maroon theme.
- **Borders:** All borders utilize a semi-transparent maroon hairline, creating a "wired" look across the interface.

## Typography

This design system uses a dual-font strategy to balance legibility with a technical "hacker" aesthetic.

- **Geist:** Employed for all primary UI text, navigation, and body content. It provides a clean, modern, and neutral foundation that keeps the interface feeling professional.
- **JetBrains Mono:** Used for technical metadata, timestamps, ID strings, and status labels. This font should always be used for data that looks like it's coming directly from a system process.
- **Styling:** Headlines should be kept tight. Labels in Monospace should often be presented in uppercase with slight tracking (letter-spacing) to enhance the "instrument panel" feel.

## Layout & Spacing

The layout operates on a strict **4px grid system** to ensure mathematical precision across all components.

- **Structure:** A fixed sidebar navigation (260px) on the left, with a persistent top-bar for global search and breadcrumbs.
- **Content Area:** Uses a fluid container with a maximum width of 1440px for dashboard views to maintain readability.
- **Grids:** For data-heavy views, use a 12-column grid. For terminal-style views, use flex-columns with standard 16px gutters.
- **Mobile:** On small screens, the sidebar collapses into a bottom navigation bar or a hamburger menu, and internal card padding reduces from 24px (lg) to 16px (md).

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Luminescence** rather than traditional shadows.

- **Base:** The background layer is #0A0A0A.
- **Mid-Ground:** Cards and containers use #111111.
- **Foreground:** Modals, tooltips, and active popovers use #1A1A1A.
- **Glow Effects:** Instead of drop shadows, active elements or focused cards utilize a subtle maroon outer glow (`0 0 8px rgba(139,0,0,0.4)`). This creates the effect of a backlit console.
- **Borders:** All containers are defined by 1px hairline borders. Elements do not "float"; they are "etched" into the interface.

## Shapes

The shape language is angular and disciplined, favoring small radii that feel sharp but not aggressive.

- **Cards:** 6px radius for the softest edges in the system, reserved for content containers.
- **Buttons:** 4px radius for a utilitarian, tactile feel.
- **Inputs/Tags:** 2px radius to emphasize precision and mimic code editor block-selections.
- **Accent Detail:** Every primary card features a 2px vertical maroon border on the far-left edge to visually anchor the content.

## Components

- **Buttons:** Primary buttons are solid #8B0000 with white text. Ghost buttons use the 1px maroon border and show a subtle maroon fill on hover.
- **Status Badges:** Use JetBrains Mono text. These are small, 2px rounded blocks with high-contrast text against a desaturated version of the status color (e.g., desaturated dark green for "ONLINE").
- **Sidebar Navigation:** Icons are Lucide, set to 1.5px stroke width. Active states show the icon and text in #C41E3A with a vertical 2px line on the right edge of the nav item.
- **Input Fields:** Background is #0A0A0A (inset from the surface). On focus, the 1px border transitions from rgba(139,0,0,0.3) to solid #C41E3A with the 8px glow effect.
- **Cards:** Must contain the left-accent maroon bar. Header areas within cards should use the Monospace label font for titles.
- **Icons:** Use Lucide icons consistently. Keep them desaturated (muted grey) unless they represent an active or "hot" state.