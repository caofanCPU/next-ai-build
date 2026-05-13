# Base UI Components

A shared React UI package built with TypeScript and Tailwind CSS. It provides reusable base components, theme-adaptive utilities, common icons, global icon handling, and analytics script components for Windrun Huaiin applications.

The package focuses on consistent theme adaptation and responsive compatibility across desktop, tablet, and mobile experiences.

## Core Features

### Theme Utilities

Theme utility classes and helpers for consistent visual styling across applications.

The theme system is designed to let components, icons, accents, and interaction states adapt to the selected palette without duplicating style logic in each application.

Supported theme palettes:

- `purple`: `#AC62FD`
- `orange`: `#F97316`
- `indigo`: `#6366F1`
- `emerald`: `#48C892`
- `rose`: `#F43F5E`

Core module:

- `theme-util`

### Common Icons

A unified icon set based on `lucide-icons` and commonly used SVG assets.

The icons are designed to work with the supported theme palettes, making it easier to keep product UI, navigation, actions, and status indicators visually consistent across different themes and screen sizes.

### Responsive Multi-Device Compatibility

Base components are intended for responsive layouts across common application surfaces, including desktop, tablet, and mobile screens.

The package helps keep spacing, sizing, icons, and interaction patterns predictable across multiple viewport sizes, so shared UI remains consistent when reused by different applications.

### Global Site Icon Handler

A global handler for site icons, intended to centralize favicon and related icon metadata handling across applications.

This keeps browser tab icons, app icons, and shared site icon behavior consistent without repeating setup in every application.

### Analytics Script Components

Reusable script components for integrating common analytics providers.

Supported providers:

- Google
- Microsoft

These components provide a consistent way to add analytics scripts to applications while keeping script setup centralized in the shared UI package.

## License
MIT License