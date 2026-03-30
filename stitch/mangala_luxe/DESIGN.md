```markdown
# Design System Strategy: The Curated Gallery

## 1. Overview & Creative North Star

**Creative North Star: "The Curated Gallery"**
This design system is built to transform a digital showroom into a high-end editorial experience. We are not building a generic e-commerce site; we are designing a digital gallery where furniture and electronics are treated as artifacts. 

The system breaks away from the "template" look by prioritizing **visual silence**—the intentional use of expansive whitespace (using our `20` and `24` spacing tokens) and a strict 4-column grid that allows product imagery to breathe. By utilizing glassmorphism and tonal layering instead of rigid borders, we create a fluid, premium environment that feels expensive, intentional, and modern.

---

## 2. Colors

Our palette is rooted in a sophisticated interpretation of the brand’s organic heritage. While the logo introduces vibrant greens and yellows, the UI applies these as surgical accents against a high-end "Gallery White" (`surface`) and "Architectural Gray" (`surface-container-low`).

*   **The "No-Line" Rule:** To maintain a premium feel, 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined solely through background shifts. For example, a product description section using `surface-container-low` should sit adjacent to a `surface` hero area without a stroke between them.
*   **Surface Hierarchy & Nesting:** We treat the UI as physical layers.
    *   **Base:** `surface` (#fbf9f8)
    *   **Secondary Content:** `surface-container-low` (#f5f3f3)
    *   **Interactive/Elevated Elements:** `surface-container-lowest` (#ffffff)
*   **The "Glass & Gradient" Rule:** The header must utilize a frosted-glass effect (Glassmorphism). Use `surface` at 70% opacity with a `20px` backdrop-blur to allow product imagery to bleed through subtly as the user scrolls. 
*   **Signature Textures:** For high-conversion elements like primary CTAs, use a subtle linear gradient from `primary` (#005a07) to `primary_container` (#1d741b) at a 135-degree angle. This adds a "jewel-tone" depth that flat color cannot replicate.

---

## 3. Typography

The typography strategy pairs the geometric precision of **Plus Jakarta Sans** for high-impact editorial moments with the pragmatic clarity of **Inter** for transactional data.

*   **Display & Headlines (Plus Jakarta Sans):** These are our "Voice." Large scales (`display-lg` at 3.5rem) should be used with generous leading to create an authoritative, architectural feel.
*   **Body & Titles (Inter):** These are our "Information." By using Inter for the `body-md` and `title-sm` levels, we ensure that technical specifications for electronics remain hyper-legible and professional.
*   **The Narrative Scale:** Use `headline-sm` for product names to give them a "titling" quality, elevating a sofa or a television from a "product" to a "piece."

---

## 4. Elevation & Depth

We move away from traditional Material Design shadows in favor of **Tonal Layering** and **Ambient Light**.

*   **The Layering Principle:** Instead of shadows, create depth by stacking. A card using `surface-container-lowest` (pure white) placed on a `surface-container` background creates a "soft lift" that feels architectural rather than digital.
*   **Ambient Shadows:** Where floating elements (like a Quick Buy modal) are required, use extra-diffused shadows. 
    *   **Token:** `blur: 40px`, `spread: -4px`.
    *   **Color:** Use the `on-surface` color at 5% opacity, slightly tinted with a hint of `primary` to mimic natural light reflecting off the showroom floor.
*   **The "Ghost Border" Fallback:** If a container requires definition against a similar background, use a "Ghost Border": the `outline-variant` token at 15% opacity. Never use a 100% opaque border.
*   **Glassmorphism:** Reserved for the global header and floating filter chips. It bridges the gap between the UI and the high-resolution photography behind it.

---

## 5. Components

### Buttons
*   **Primary:** High-gloss. Uses the `primary` gradient with `on-primary` text. `0.25rem` (sm) roundedness for a sharp, modern edge.
*   **Secondary:** The "Ghost Button." `outline-variant` (at 20% opacity) with `primary` text.
*   **Tertiary:** Text-only with an underline that appears on hover, utilizing the `secondary` (yellow) token for the underline to provide a "spark" of brand color.

### Product Cards
*   **Layout:** 4-column strict.
*   **Style:** No borders. Use `surface-container-lowest` as the card base. 
*   **Elevation:** Apply a very soft `8%` opacity shadow only on hover to simulate the "picking up" of an object.

### Vertical Milestone Steppers
*   Used for delivery tracking or "The Mangala Process." 
*   **Visuals:** A thin `1px` vertical line using `outline-variant` at 30% opacity. Completed steps use the `primary` green dot; upcoming steps use a hollow `outline` circle.

### Input Fields
*   **Style:** Minimalist underline or soft-filled. Forgo the "box" look. Use `surface-container-high` for the input background to contrast against the `surface` page background.

### Cards & Lists
*   **Prohibition:** Dividers are banned. 
*   **Separation:** Use the `spacing-8` (2.75rem) scale to separate list items. Whitespace is our primary organizational tool.

---

## 6. Do's and Don'ts

### Do
*   **Do** use the 4-column grid religiously. High-end retail is about order and rhythm.
*   **Do** allow images to occupy 60% of the viewport. The furniture should do the talking.
*   **Do** use `secondary_container` (yellow) sparingly for "New Arrival" or "Exclusive" badges to create a high-contrast focal point.

### Don't
*   **Don't** use pure black (#000000) for text. Use `on-surface` (#1b1c1c) for a softer, more luxurious read.
*   **Don't** use heavy "drop shadows." If it looks like a 2010 app, it's too heavy. Think "ambient glow," not "shadow."
*   **Don't** crowd the footer. Even the legal links should have breathing room (using `body-sm` and `spacing-4`).
*   **Don't** use the `Lobster` font for functional UI. It is a brand flourish only; keep it away from buttons and labels.

---

**Director's Closing Note:** This design system is about the "space between." By mastering the spacing scale and the subtle shifts between surface tiers, you will create an interface that feels as premium as a marble-floored showroom. Respect the whitespace.```