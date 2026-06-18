---
name: Indigo Kitchen
colors:
  surface: '#FFFFFF'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#464554'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#777586'
  outline-variant: '#c7c4d7'
  surface-tint: '#5148d7'
  primary: '#2a14b4'
  on-primary: '#ffffff'
  primary-container: '#4338ca'
  on-primary-container: '#c1beff'
  inverse-primary: '#c3c0ff'
  secondary: '#5b598c'
  on-secondary: '#ffffff'
  secondary-container: '#c7c3fe'
  on-secondary-container: '#514f81'
  tertiary: '#1f1ab3'
  on-tertiary: '#ffffff'
  tertiary-container: '#3b3bc9'
  on-tertiary-container: '#bebfff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e3dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#100069'
  on-primary-fixed-variant: '#372abf'
  secondary-fixed: '#e3dfff'
  secondary-fixed-dim: '#c4c1fb'
  on-secondary-fixed: '#181445'
  on-secondary-fixed-variant: '#444173'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
  success: '#10B981'
  pending: '#F59E0B'
  destructive: '#EF4444'
  border: '#E5E7EB'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  price-lg:
    fontFamily: Space Mono
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
  price-sm:
    fontFamily: Space Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-caps:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  container-margin: 16px
  gutter: 12px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style

This design system is built for a high-end, modern restaurant environment where efficiency meets elegance. The brand personality is "Precision Hospitality"—cool, collected, and highly functional. The aesthetic draws from **Minimalism** and **Corporate Modern** movements, focusing on extreme legibility, high-quality food photography, and a reduced color palette that allows the vibrant colors of the dishes to remain the focal point. 

The interface evokes a sense of calm and order, even in a fast-paced ordering environment. By utilizing a "Mobile-First" philosophy, the design prioritizes thumb-reach zones and streamlined navigation to reduce cognitive load for diners.

## Colors

The palette is anchored by a deep **Navy (`#1E1B4B`)** for primary text and hierarchy, ensuring a crisp contrast against the **Off-White (`#F9FAFB`)** background. The **Indigo Accent (`#4338CA`)** is used sparingly for primary actions, selections, and focus states to guide the user's eye without overwhelming the senses.

Functional status colors are highly saturated for immediate recognition:
- **Success Green:** Used for "Served" or "Completed" states.
- **Amber:** Reserved for "Cooking" or "Pending" items to indicate active progress.
- **Red:** strictly for "Cancelled" orders or destructive cart actions.

Surfaces like cards use a pure white (`#FFFFFF`) to pop against the off-white background, creating subtle depth without relying on heavy shadows.

## Typography

This system utilizes a dual-font approach to balance sophisticated branding with technical utility. 

**Geist** is the primary typeface, chosen for its neutral, modernist architecture. It handles all headlines, body copy, and UI controls. **Space Mono** (as a high-quality alternative for price data) is used exclusively for prices, quantities, and order numbers. This distinction creates a clear mental model for the user: Geist is for "Information," while Space Mono is for "Transaction Data."

For mobile devices, headlines are scaled down slightly to prevent awkward line breaks, while body text remains at a legible 16px base to ensure comfort in a high-glare restaurant environment.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a mobile-first focus. On mobile devices, a 2-column or 1-column layout is used for menu items, while tablet and desktop expand to a 12-column grid.

A strict **4px baseline grid** governs all spatial relationships. 
- **Margins:** A consistent 16px safe area is maintained on the horizontal edges of all mobile screens.
- **Gutters:** 12px spacing between cards in a grid view ensures density without clutter.
- **Vertical Rhythm:** Elements are stacked using increments of 8px (stack-sm) or 16px (stack-md) to create a clear visual hierarchy.

## Elevation & Depth

To maintain a clean and "appetizing" feel, this design system avoids heavy shadows that can make a UI feel "dirty." Instead, it uses **Tonal Layers** and **Low-Contrast Outlines**:

- **Level 0 (Background):** Off-white (`#F9FAFB`) surface.
- **Level 1 (Cards/Items):** Pure white (`#FFFFFF`) with a subtle 1px border (`#E5E7EB`).
- **Level 2 (Active/Modals):** A soft, diffused indigo-tinted shadow (0px 4px 20px rgba(30, 27, 75, 0.05)) to indicate the element is floating above the main content.

Interactive elements like buttons use a slight scale-down effect (98%) on press rather than a change in elevation, providing tactile feedback without visual noise.

## Shapes

The shape language is defined by two distinct rules:
1. **Container Consistency:** All menu cards, input fields, and modals utilize a **12px (0.75rem)** corner radius. This creates a soft, approachable feel while remaining structured.
2. **Badge Distinction:** All statuses (Green/Amber/Red), category tags, and item count pills use **Full Rounding (Pill-shaped)**. This visual contrast immediately identifies these elements as "meta-information" or "interactive counters" rather than content containers.

Images within cards should also inherit the 12px radius on their top corners to align with the parent container.

## Components

### Buttons
- **Primary:** Solid Indigo background, white text. No shadow, 12px radius.
- **Secondary:** Navy outline (1px), Navy text, transparent background.
- **Ghost:** Navy text, no background or border, used for low-priority actions like "Cancel" in a modal.

### Cards
Menu item cards must feature a fixed-aspect ratio image (1:1 or 4:3) at the top. The bottom section contains the title (Headline-sm), a brief description (Body-sm), and the price (Price-lg) anchored to the bottom right.

### Badges & Pills
Badges for "Spicy," "Vegan," or "Popular" should be small, fully rounded, and use the Navy text color with a light Indigo tint background (`#EEF2FF`).

### Input Fields
Search bars and quantity selectors use the 12px radius with a 1px border. Focus states are indicated by an Indigo border and a soft Indigo glow (ring).

### Item Counter
A specific component for adding items to the cart: A horizontal pill with a minus icon, the count in **Space Mono**, and a plus icon. This should be anchored to the bottom of the item card once an item is selected.
