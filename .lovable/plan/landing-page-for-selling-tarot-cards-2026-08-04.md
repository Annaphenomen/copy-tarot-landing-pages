# Landing Page for Selling Tarot Cards

## Overview
Build a visually compelling, conversion-focused landing page for selling tarot card decks. The page will integrate with Shopify for product catalog, cart, and checkout.

## Assumptions
- **Shopify**: Create a new Shopify development store (since no existing store was indicated).
- **Audience**: Spiritual/wellness seekers, gift buyers, and tarot enthusiasts.
- **Product**: A single hero tarot deck or a small curated collection (Shopify products).
- **Design direction**: Mystical/artisanal aesthetic — deep, dark palette with gold or copper accents, elegant serif headings, and tarot-illustration imagery. Responsive, single-page landing experience with clear CTAs.

## Plan

### 1. Enable Shopify store
- Create a new Shopify development store via Lovable's Shopify integration.
- After creation, offer to claim the store so it stays active beyond the 30-day unclaimed window.

### 2. Design the landing page
- Structure: Hero section (deck + headline + CTA), Features/Benefits, Deck preview/gallery, Testimonials/social proof, Pricing/shop section, FAQ, Footer.
- Visual style: Dark, celestial/mystical feel with gold/amber accent, serif display type, subtle textures/gradients, tarot card imagery.
- Mobile-first responsive layout.

### 3. Implement Shopify connection
- Pull product data from Shopify for the tarot deck(s).
- Add "Add to cart" and checkout buttons tied to Shopify.
- Ensure cart state integrates with Shopify checkout flow.

### 4. Build & deploy
- Replace the placeholder `src/routes/index.tsx` with the landing page.
- Add route-specific SEO metadata (title, description, OG tags).
- Ensure build passes and preview looks correct.
- Offer to publish when ready.

## Technical notes
- Framework: TanStack Start (existing project).
- Styling: Tailwind CSS v4 with semantic design tokens; add custom mystical color tokens to `src/styles.css`.
- E-commerce: Shopify integration (Lovable custom).
- Images: Generate or request hero tarot card imagery.
