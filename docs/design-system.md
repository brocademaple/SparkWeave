# SparkWeave Design System Notes

## Visual Tone

SparkWeave should feel like a premium thinking studio:

- calm enough to open every day
- precise enough for repeated productivity work
- artful enough to make relationship discovery feel special

The default surface is light and paper-like. The Weave and Focus surfaces may introduce a subtle graphite or luminous layer, but the product should not become a heavy sci-fi dashboard.

## Typography

Use a Chinese serif for display text:

- preferred on iOS: `Songti SC`
- future bundled option: `Source Han Serif SC` or `Noto Serif CJK SC`

Use a clean Chinese sans-serif for body and controls:

- preferred on iOS: `PingFang SC`
- future bundled option: `Source Han Sans SC` or `Noto Sans CJK SC`

Avoid Kai-style, handwritten, cute, bubbly, or overly casual typography. The target is Songti/Mingcho editorial elegance: high contrast, mature, steady, and close to a high-end knowledge product.

## Palette

Default light mode:

- porcelain white: `#fffdf8`
- paper background: `#f8f6f1`
- graphite ink: `#171512`
- mist gray: `#736c62`
- sage: `#8ba596`
- muted cobalt: `#5d77a6`
- soft coral: `#c96f52`
- small violet accent: `#8c7ca8`

Dark mode:

- graphite background: `#151413`
- dark surface: `#1f1d1a`
- soft text: `#f4efe5`
- restrained luminous accents from the light palette

## Components

- Cards use 8px radius or less.
- Use thin dividers and restrained shadows.
- Bottom tabs stay clear and stable.
- The central capture action is the main daily affordance.
- Weave graphics use node-card relationships, not decoration.
- Do not place cards inside cards.

## Implementation Notes

The first implementation uses React Native built-in components and inline styles via tokenized theme helpers. It is intentionally close to the generated prototype but not pixel copied.

Future Figma recreation should use the generated prototype board as visual reference and this document as the implementation contract.
