---
name: Pitch Monochrome Glass
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1b'
  surface-container: '#1f1f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#c7c6c6'
  on-secondary: '#2f3131'
  secondary-container: '#484949'
  on-secondary-container: '#b8b8b8'
  tertiary: '#ffffff'
  on-tertiary: '#003824'
  tertiary-container: '#6ffbbe'
  on-tertiary-container: '#00734e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e3e2e2'
  secondary-fixed-dim: '#c7c6c6'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#464747'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
  canvas-black: '#000000'
  surface-glass-subtle: rgba(255, 255, 255, 0.04)
  surface-glass-medium: rgba(255, 255, 255, 0.08)
  surface-glass-elevated: rgba(255, 255, 255, 0.15)
  border-glass-hairline: rgba(255, 255, 255, 0.15)
  border-glass-active: rgba(255, 255, 255, 0.3)
  border-glass-focus: rgba(255, 255, 255, 0.5)
  feedback-success: '#10b981'
  feedback-success-glass: rgba(16, 185, 129, 0.18)
  feedback-error: '#ef4444'
  feedback-error-glass: rgba(239, 68, 68, 0.2)
  text-dim: '#737373'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 2.4rem
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.04em
  headline-xl-mobile:
    fontFamily: Geist
    fontSize: 1.75rem
    fontWeight: '800'
    lineHeight: '1.25'
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Geist
    fontSize: 1.5rem
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Geist
    fontSize: 1.15rem
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  body-reading:
    fontFamily: Geist
    fontSize: 1.0625rem
    fontWeight: '400'
    lineHeight: '2.2'
    letterSpacing: 0.01em
  body-reading-mobile:
    fontFamily: Geist
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: '2.0'
    letterSpacing: 0.01em
  body-default:
    fontFamily: Geist
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  interactive-blank:
    fontFamily: Geist
    fontSize: 1rem
    fontWeight: '600'
    lineHeight: '1.5'
    letterSpacing: 0.05em
  label-md:
    fontFamily: Geist
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Geist
    fontSize: 0.8125rem
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: 0.03em
  caption:
    fontFamily: Geist
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.04em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

### Brand Personality & Visual Intent
This design system crafts an austere, razor-sharp educational environment built around absolute focus. Rooted in deep cosmic darkness, it eliminates visual clutter, ambient cartoonish elements, playful illustrations, and emojis in favor of an exacting, high-end scientific aesthetic. The user experience is tailored for deep cognitive flow: language learners, students, and educators engaging with structured reading and dynamic blank-completion exercises without distraction.

The interface evokes technical precision, calm gravitas, and modern computational elegance. Interactions feel weighted, fluid, and luminescent against total void.

### Design Style: Dark Monochrome Glassmorphism
The aesthetic operates on deep pitch-black (`#000000`) canvases populated by multi-tiered translucent glass containers (`rgba(255, 255, 255, 0.04)` to `rgba(255, 255, 255, 0.15)`), backed by heavy hardware-accelerated diffusion (`backdrop-filter: blur(16px to 24px)`). 

Visual boundaries rely strictly on hairline frosted borders (`rgba(255, 255, 255, 0.12)` to `0.30`) and focused white-glow highlights. Chroma is strictly functional: glowing emerald green (`#10b981`) indicates mastery and validation, while pure crimson red (`#ef4444`) isolates syntax or semantic errors. Iconography strictly avoids Unicode emoji glyphs in favor of minimal, geometric vector glyphs and pristine typographical dividers.

## Colors

### Palette Architecture
The foundation of the design system is binary monochrome anchored by pure black (`#000000`) and pure white (`#ffffff`). Surface separation is achieved not by opaque gray fills, but through translucent white tints layered over the canvas.

- **Primary (`#ffffff`)**: Serves as active interactive states, primary typography, high-priority CTA fills, focused strokes, and blank completion targets.
- **Secondary (`#a3a3a3`)**: Used for supportive copy, instructional labels, passive input hints, and inactive chip borders.
- **Tertiary (`#10b981`)**: Semantic validation indicator, utilized for correct word selection, reveal solutions, and positive toasts.
- **Neutral (`#000000`)**: Absolute base background. Renders zero luminance to maximize OLED contrast and frosted glass diffusion.

### Dynamic Glass & State Tokens
- **`surface-glass-subtle`**: Standard background for unselected chips, exercise reading panels, and structural cards.
- **`surface-glass-medium`**: Hover states, interactive blanks before selection, and secondary action triggers.
- **`surface-glass-elevated`**: Active tabs, selected choices, and sticky control panels.
- **`feedback-success-glass` & `feedback-error-glass`**: Colored atmospheric backdrops for exercise validation tags, wrong answers, and destructive triggers.

## Typography

### Structural Approach
Typography is driven entirely by **Geist**, a geometric yet human-crafted typeface engineered for technical interfaces, high legibility, and developer-grade precision. 

### Exercise Ergonomics & Expanded Line Heights
A critical requirement of the system is accommodating dynamic interactive components directly within paragraphs. Standard reading heights (`1.5`–`1.6`) cause visual collision when inline pill blanks, answer feedback chips, and reveal translation tags are inserted into text. 

The `body-reading` token mandates an expansive line height of `2.2` (reduced to `2.0` on mobile viewports). This guarantees that blank slots (`.blank`), spelling input wrappers, and interactive hover outlines have vertical breathing room without altering paragraph rhythm or overlapping neighboring lines.

### Micro-Typography
Labels and microcopy utilize increased letter-spacing (`0.02em` to `0.04em`) paired with medium weights (`500`) to maintain crisp optical separation against low-opacity dark glass backgrounds.

## Layout & Spacing

### Dashboard Grid Philosophy
The layout system enforces a desktop-first centered single-column spine with a strict maximum container width of `1000px`. Spatially, this prevents interactive vocabulary exercises from spanning across wide monitors, preserving human optical tracking during reading sessions.

### Layout Specs & Responsive Matrix
- **Global Canvas**: Base background is locked to `#000000`, vertically padded by `30px` to `60px` depending on viewport height.
- **Max Width**: `1000px` centered via `margin-inline: auto`.
- **Desktop (>= 1024px)**:
  - Margins: `2rem` (`32px`)
  - Gutters: `1.5rem` (`24px`)
  - Floating top toolbars and sticky option docks anchor to the `1000px` container with `z-index: 90`.
- **Tablet (641px - 1023px)**:
  - Margins: `1.5rem` (`24px`)
  - Gutters: `1rem` (`16px`)
  - Side-by-side action toolbars collapse to responsive flex groupings with wrap behaviors.
- **Mobile (<= 640px)**:
  - Margins: `1rem` (`16px`)
  - Gutters: `0.75rem` (`12px`)
  - Exercise cards shed desktop padding, dropping from `24px` down to `16px`. Sticky toolbars dock firmly to the bottom viewport edge for thumb ergonomics.

### Rhythmic Scale
Spacing uses a strict 4px/8px modular scale. Element grouping within cards uses `space-sm` (`8px`) for tight pill clusters and `space-md` (`16px`) for form field groupings.

## Elevation & Depth

### Frosted Glassmorphism Stack
Elevation is established not through deep black drop shadows, but through backdrop translucency, blur filters, and illuminated frosted boundaries. All components float above the absolute black void.

```
Void Canvas (#000000)
  └── Base Glass Surface (fill: rgba(255, 255, 255, 0.04), blur: 16px, border: 1px rgba(255, 255, 255, 0.15))
        └── Elevated Floating Bars (fill: rgba(255, 255, 255, 0.08), blur: 20px, border: 1px rgba(255, 255, 255, 0.20))
              └── Active Element / Modal Surface (fill: rgba(255, 255, 255, 0.12), blur: 24px, border: 1px rgba(255, 255, 255, 0.30))
```

### Edge Illumination & Glowing States
1. **Resting State**: Hairline borders with `rgba(255, 255, 255, 0.15)` define clear visual edges against the void.
2. **Hover State**: Border shifts to `rgba(255, 255, 255, 0.30)` accompanied by a subtle ambient backlight shadow: `0 8px 32px rgba(0, 0, 0, 0.5)`.
3. **Active & Focus Glow**: Form inputs, focused blanks, and active chips trigger a localized luminous halo:
   - Neutral Focus: `box-shadow: 0 0 16px rgba(255, 255, 255, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.5)`.
   - Correct Feedback: `box-shadow: 0 0 20px rgba(16, 185, 129, 0.3), inset 0 0 0 1px #10b981`.
   - Error Feedback: `box-shadow: 0 0 20px rgba(239, 68, 68, 0.3), inset 0 0 0 1px #ef4444`.

### Layer Index System
- Base Background Canvas: `z-index: 0`
- Main Interactive Workspace: `z-index: 10`
- Sticky Navigation & Floating Pill Toolbars: `z-index: 100`
- Modal Backdrop Dialogues: `z-index: 200`
- Critical Notifications & Feedback Toasts: `z-index: 300`

## Shapes

### Pill-Centric Shape Language
The design system embraces a high-curvature shape language (Level `3` - Pill-shaped), providing an organic, tactile contrast to the ultra-minimalist dark backdrop.

- **Pills (`border-radius: 9999px` / `1rem` - `2rem`)**: Applied universally to interactive word bank chips, vocabulary options, filter badges, and primary action CTAs.
- **Large Container Surfaces (`border-radius: 1.5rem` / `24px`)**: Structural panels, dashboard exercise shells, reading passage wrappers, and modal windows.
- **Controls & Form Elements (`border-radius: 1rem` / `16px`)**: Textareas, difficulty choice cards, and authentication input fields.
- **Interactive Blanks (`border-radius: 9999px`)**: Inline blanks embedded inside paragraphs render as soft capsules with interior horizontal padding (`padding: 2px 14px`), distinct from ordinary text.

## Components

### 1. Buttons
- **Primary CTA**: Pill capsule shape (`border-radius: 9999px`). Background: `#ffffff`, text: `#000000`, font-weight: `600`. Hover state triggers an intense edge halo (`box-shadow: 0 0 24px rgba(255, 255, 255, 0.35)`) and lifts by `translateY(-1px)`.
- **Secondary Glass Action**: Translucent fill (`rgba(255, 255, 255, 0.05)`), border: `1px solid rgba(255, 255, 255, 0.18)`, text: `#ffffff`. Hover: `rgba(255, 255, 255, 0.12)` fill with `rgba(255, 255, 255, 0.35)` border.
- **Destructive Action**: Translucent red fill (`rgba(239, 68, 68, 0.15)`), border: `1px solid rgba(239, 68, 68, 0.3)`, text: `#ef4444`. Hover: `rgba(239, 68, 68, 0.25)` fill with glowing red shadow (`0 0 16px rgba(239, 68, 68, 0.3)`).

### 2. Word Chips & Options
- **Word Bank Chip**: Capsule pill (`padding: 8px 18px`), font size: `0.875rem`, weight: `500`. Background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(255, 255, 255, 0.15)`, text: `#d4d4d4`.
- **Selected State**: Background: `rgba(255, 255, 255, 0.20)`, border: `1px solid #ffffff`, text: `#ffffff`, `box-shadow: 0 0 16px rgba(255, 255, 255, 0.25)`.
- **Used / Exhausted State**: Opacity reduced to `0.3`, `pointer-events: none`, dashed hairline border.

### 3. Inline Interactive Blanks
- Embedded within reading paragraphs. Default state: Pill border `1px solid rgba(255, 255, 255, 0.25)`, background `rgba(255, 255, 255, 0.04)`, min-width `64px`, text color `#ffffff`.
- **Active Focused Blank**: Border: `1px solid #ffffff`, glowing white halo (`0 0 14px rgba(255, 255, 255, 0.35)`).
- **Correct State**: Border: `1px solid #10b981`, fill: `rgba(16, 185, 129, 0.18)`, text: `#10b981`, `box-shadow: 0 0 16px rgba(16, 185, 129, 0.25)`.
- **Incorrect State**: Border: `1px solid #ef4444`, fill: `rgba(239, 68, 68, 0.18)`, text: `#ef4444`, `box-shadow: 0 0 16px rgba(239, 68, 68, 0.25)`.

### 4. Input Fields & Textareas
- Glass trough styling: `background: rgba(255, 255, 255, 0.04)`, `backdrop-filter: blur(16px)`. Border: `1px solid rgba(255, 255, 255, 0.15)`. Radius: `16px`.
- Typography: Color `#ffffff`, placeholder text `#737373`.
- Focus State: Outline: none, border: `1px solid rgba(255, 255, 255, 0.45)`, `box-shadow: 0 0 20px rgba(255, 255, 255, 0.15)`.

### 5. Cards & Containers
- Frosted dark panels: `background: rgba(255, 255, 255, 0.04)`, `backdrop-filter: blur(20px)`, `border: 1px solid rgba(255, 255, 255, 0.15)`, `border-radius: 20px`, `padding: 24px`.
- Dividers: `1px solid rgba(255, 255, 255, 0.10)`.

### 6. Sticky Option Bar
- Floats dynamically above or below the content spine: `max-width: 1000px`, `background: rgba(0, 0, 0, 0.75)`, `backdrop-filter: blur(24px)`, `border: 1px solid rgba(255, 255, 255, 0.20)`, `border-radius: 9999px`, `padding: 10px 20px`. Holds word selections with horizontal overflow scrolling (`scrollbar-width: none`).

### 7. Feedback & Status (Toast)
- Positioned fixed top/center. Minimalist pill: `background: rgba(13, 13, 13, 0.85)`, `backdrop-filter: blur(24px)`, `border: 1px solid rgba(255, 255, 255, 0.20)`, `border-radius: 9999px`, `padding: 10px 24px`.
- Success Variant: Border `1px solid #10b981`, text `#10b981`, `box-shadow: 0 0 20px rgba(16, 185, 129, 0.2)`.
- Error Variant: Border `1px solid #ef4444`, text `#ef4444`, `box-shadow: 0 0 20px rgba(239, 68, 68, 0.2)`.