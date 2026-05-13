# @windrun-huaiin/lib

A shared utility package for application configuration, class name composition, date formatting, i18n message handling, server-side locale message loading, and MDX-to-LLM text conversion.

## Features

### Application Configuration

Create consistent runtime configuration for applications that share site settings, i18n behavior, visual preferences, authentication page URLs, and MDX content directory conventions.

Methods:

- `createCommonAppConfig`
- `createI18nHelpers`

Constants:

- `LOCALE_PRESETS`

`createCommonAppConfig` builds a complete application config from explicit options, environment variables, and sensible defaults. It returns base site metadata, i18n settings, style settings, Clerk page settings, MDX source directory settings, and convenient shortcut fields for frequently used values.

`createI18nHelpers` creates helpers from an i18n config, including locale validation, fallback locale resolution, and generated locale display data.

`LOCALE_PRESETS` provides ready-made locale sets for common setups such as English-only, English and Chinese, Asian languages, European languages, global language coverage, and no multilingual setup.

### Class Name Composition

Compose conditional class names and resolve Tailwind CSS class conflicts in React components.

Method:

- `cn`

Typical uses:

- Merge default component styles with a consumer-provided `className`.
- Add classes conditionally based on component state.
- Keep the final effective Tailwind class when conflicting utilities are provided.

### Date And Time Formatting

Format millisecond timestamps or Date objects into user-facing local time strings.

Methods:

- `formatTimestamp`
- `viewLocalTime`

`formatTimestamp` accepts a millisecond timestamp string and a formatting pattern. It returns an empty string for missing values, invalid timestamps, or invalid dates.

`viewLocalTime` accepts a Date object or an empty value and returns local time in the `yyyy-MM-dd HH:mm:ss` format.

### Plain Text Paste Handling

Intercept paste events in editable elements and insert only plain text, preventing external styles, rich text structure, or HTML content from being pasted.

Method:

- `handlePastePlainText`

Typical uses:

- Restrict pasted content in rich text editing areas.
- Keep `contenteditable` fields plain-text only.
- Prevent copied web content from bringing unwanted formatting into the editor.

### Localized URL Generation

Generate localized URLs from the current locale, target path, default locale, and locale prefix strategy.

Method:

- `getAsNeededLocalizedUrl`

Typical uses:

- Omit the locale prefix for the default locale.
- Add a locale prefix for non-default locales.
- Force locale prefixes for every locale.
- Normalize leading and trailing slashes consistently.

Example results:

- Default locale home page: `/`
- Chinese home page: `/zh`
- Default locale blog page: `/blog`
- Chinese blog page: `/zh/blog`

### I18n Message Merging

Identify plain objects and deeply merge multiple i18n message objects. Later values override earlier values, while nested objects are merged recursively.

Methods:

- `isPlainObject`
- `deepMergeMessages`

Typical uses:

- Merge base messages with feature-specific messages.
- Combine default copy with page-level copy.
- Compose messages from multiple modules in a larger application.

### Server-Side Locale Message Loading

Load and merge JSON message files for a locale on the server. It supports both single-file sources and directory sources. Directory sources are collected recursively, filtered by locale-specific file names, sorted, and merged in order.

Method:

- `loadMergedLocaleMessages`

Types:

- `RuntimeMessageSource`
- `RuntimeMessageFileSource`
- `RuntimeMessageDirectorySource`

Typical uses:

- Load messages for the active locale in a server-rendered application.
- Merge shared, page-level, and module-level messages into one object.
- Split locale messages by directory while exposing a single merged message object at runtime.

### MDX To LLM Text

Convert MDX content into Markdown text that is easier for language models to consume. Frontmatter is removed, while Markdown, MDX, and GFM content structure is preserved. Optional title and description values can be prepended to the output.

Method:

- `getLLMText`

Typical uses:

- Generate LLM-readable text from documentation, blog posts, or MDX pages.
- Prepare content for search, summarization, question answering, or indexing.
- Remove frontmatter so models do not read unrelated metadata.

## License
MIT License