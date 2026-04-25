# @windrun-huaiin/third-ui

Third-party integrated UI components library, including Clerk authentication, Fumadocs documentation, and main application components.

## Installation

```bash
pnpm add @windrun-huaiin/third-ui
```

## TailwindCSS 4.x Config

- Assume you have a project structure like this:

```txt
Your-project/
├── src/
│   └── app/
│       └── globals.css
├── node_modules/
│   ├── @windrun-huaiin/
│   │   ├── third-ui/
│   │   │   └── src/        # This is third-ui src
│   │   └── base-ui/
│   │       └── src/        # This is base-ui src
└── package.json
```

- Then, in your `globals.css` file, you have to configure Tailwind CSS 4.x like this:

```css
@import 'tailwindcss';

@source "../node_modules/@windrun-huaiin/third-ui/src/**/*.{js,ts,jsx,tsx}";
@source "../node_modules/@windrun-huaiin/base-ui/src/**/*.{js,ts,jsx,tsx}";
@source "./src/**/*.{js,ts,jsx,tsx}";

/* Import styles */
@import '@windrun-huaiin/third-ui/styles/third-ui.css';
```


## Usage Example

Root entry import is not supported. Always import from an explicit subpath such as `@windrun-huaiin/third-ui/clerk` or `@windrun-huaiin/third-ui/main`.

### Import components by module
```tsx
// Only import Clerk related components
import { ClerkUser, ClerkOrganization } from '@windrun-huaiin/third-ui/clerk';

// Only import main application components
import { CTA, Features } from '@windrun-huaiin/third-ui/main';

// Only import Fumadocs components  
import { FumaPageGenerator, FumaBannerSuit } from '@windrun-huaiin/third-ui/fuma/server';

// Shared MDX building blocks
import { TocFooterWrapper, PortableClerkTOC } from '@windrun-huaiin/third-ui/fuma/mdx';
```

### Use components
```tsx
// Clerk user component (need to pass in translations and configuration)
<ClerkUser 
  locale="zh"
  clerkAuthInModal={true}
  t={{ signIn: "Sign in" }}
  t2={{ terms: "Terms of Service", privacy: "Privacy Policy" }}
/>

// Clerk organization component
<ClerkOrganization locale="zh" className="custom-class" />

// Main application components
<CTA />
<Features />
```

## Design Principles

1. **Modularization**: Grouped by functional domain, support import on demand
2. **Parameterization**: Remove hard-coded dependencies, pass configuration through props
3. **Type safety**: Full TypeScript support
4. **Path alias**: Use `@/` alias internally, keep code clean

## Dependencies

- `@windrun-huaiin/base-ui`: Base UI components
- `@windrun-huaiin/lib`: General utility library
- `@clerk/nextjs`: Clerk authentication
- `fumadocs-core`, `fumadocs-ui`: Fumadocs documentation

## Notes

- Components have removed direct `appConfig` dependencies, and configuration is passed through props
- Clerk components need to provide correct translations in the application layer
- Some components may require specific CSS animation classes (e.g. `animate-cta-gradient-wave`) 

## Component List

### Clerk module
- `ClerkProviderClient` - Clerk authentication provider
- `ClerkUser` - User button component  
- `ClerkOrganization` - Organization switcher component

### Main module
- `CTA` - Call-to-Action component
- `Features` - Feature showcase component
- `Footer` - Footer component
- `Gallery` - Image gallery component
- `GoToTop` - Go to top button
- `SEOContent` - SEO content component
- `Tips` - Tip component

### Fuma module
- `getMDXComponents` - MDX component configuration function
- `createMDXComponents` - MDX component factory function
- `TocFooter` - Table of contents footer component
- `FumaBannerSuit` - Fumadocs banner component

### Fuma MDX submodule
- `Mermaid` - Flowchart component
- `ImageZoom` - Image zoom component
- `TrophyCard` - Trophy card component
- `ImageGrid` - Image grid component
- `ZiaCard` - Zia card component
- `GradientButton` - Gradient button component 

## Usage

### Clerk components

```tsx
import { ClerkProviderClient, ClerkUser } from '@windrun-huaiin/third-ui/clerk';

// Use in layout.tsx
<ClerkProviderClient 
  signInUrl="/sign-in"
  signUpUrl="/sign-up"
  waitlistUrl="/waitlist"
>
  {children}
</ClerkProviderClient>

// Use in navigation bar
<ClerkUser clerkAuthInModal={true} />
```

### Main components

```tsx
import { CTA, Features, Footer } from '@windrun-huaiin/third-ui/main';

// Use various page components
<Features />
<CTA />
<Footer />
```

### Fumadocs components

```tsx
import { createMDXComponents, TocFooter } from '@windrun-huaiin/third-ui/fuma';

// Create pre-configured MDX components
const getMDXComponents = createMDXComponents({
  watermark: {
    enabled: true,
    text: "Your Watermark"
  },
  githubBaseUrl: "https://github.com/your-org/your-repo/edit/main/"
});

// Use in page
const MDX = page.data.body;
<MDX components={getMDXComponents()} />

// Use TocFooter
<TocFooter 
  lastModified={page.data.date}
  showCopy={true}
  editPath="src/docs/your-file.mdx"
  githubBaseUrl="https://github.com/your-org/your-repo/edit/main/"
/>
```

#### MDX components global configuration

In MDX file:

```mdx
<!-- Mermaid chart, watermark automatically applied -->
<Mermaid
  chart="graph TD; A-->B"
  title="My Diagram"
/>

<!-- Image grid, CDN URL automatically applied -->
<ImageGrid
  type="url"
  images={["image1.webp", "image2.webp"]}
  altPrefix="example"
/>

<!-- Image zoom, placeholder image automatically applied -->
<ImageZoom src="/some-image.jpg" alt="Example" />
```

All configuration parameters will be automatically obtained from the global configuration, and no need to specify them in each use.


## Showcase

- [Free Trivia Game](https://freetrivia.info/)
- [Music Poster](https://musicposter.org/en)
- [Image Narration](https://imagenarration.com/en)
- [Describe Yourself](https://describeyourself.org/en)
- [Newspaper Template](https://newspaper-template.org/en)
- [breathing exercise](https://breathingexercise.net/en)
- [ai directory list](https://aidirectorylist.com/en)
- [reve image directory](https://reveimage.directory/en)
