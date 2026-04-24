import type { MDXComponents, MDXProps } from 'mdx/types';
import type { ReactNode } from 'react';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import { createGenerator as createTypeTableGenerator } from 'fumadocs-typescript';
import { AutoTypeTable } from 'fumadocs-typescript/ui';
import { baseMarkdownComponents } from '../share/markdown-component-map';
import { Mermaid, ImageGrid, ImageZoom, MathBlock, InlineMath } from '../heavy';
import { TrophyCard } from '../mdx/trophy-card';
import { ZiaCard } from '../mdx/zia-card';
import { GradientButton } from '../mdx/gradient-button';
import { ZiaFile, ZiaFolder } from '../mdx/zia-file';
import { SunoEmbed } from '../mdx/suno-embed';

const typeTableGenerator = createTypeTableGenerator();

function tryToMatchIcon(
  props: Readonly<MDXProps & { 'data-language'?: string; title?: string }>,
  iconMap: Record<string, ReactNode>,
): ReactNode | undefined {
  let lang: string | undefined;

  const dataLanguage = props['data-language'] as string | undefined;

  if (dataLanguage && dataLanguage.trim() !== '') {
    lang = dataLanguage.trim().toLowerCase();
  } else {
    const title = props.title as string | undefined;
    if (title) {
      const titleParts = title.split('.');
      if (titleParts.length > 1 && titleParts[0] !== '') {
        const extension = titleParts.pop()?.toLowerCase();
        if (extension) {
          lang = extension;
        }
      }
    }
  }

  if (lang && iconMap[lang]) {
    return iconMap[lang];
  }

  return undefined;
}

export function createBaseMdxComponents(
  imageFallbackSrc?: string,
): MDXComponents {
  return {
    ...baseMarkdownComponents,
    img: (props) => (
      <ImageZoom
        {...(props as any)}
        fallbackSrc={imageFallbackSrc}
      />
    ),
  };
}

export function createCodeMdxComponents(
  iconMap: Record<string, ReactNode>,
): MDXComponents {
  return {
    pre: (props) => {
      const customIcon = tryToMatchIcon(props, iconMap);
      return (
        <CodeBlock
          {...props}
          {...(customIcon && { icon: customIcon })}
        >
          <Pre>{props.children}</Pre>
        </CodeBlock>
      );
    },
    CodeBlock,
    Pre,
  };
}

export function createMathMdxComponents(): MDXComponents {
  return {
    MathBlock,
    InlineMath,
  };
}

export function createMermaidMdxComponents(
  watermarkEnabled?: boolean,
  watermarkText?: string,
): MDXComponents {
  return {
    Mermaid: (props) => (
      <Mermaid
        {...props}
        watermarkEnabled={watermarkEnabled}
        watermarkText={watermarkText}
      />
    ),
  };
}

export function createTypeTableMdxComponents(): MDXComponents {
  return {
    TypeTable,
    AutoTypeTable: (props) => (
      <AutoTypeTable {...props} generator={typeTableGenerator} />
    ),
  };
}

export function createWidgetMdxComponents(
  cdnBaseUrl?: string,
  imageFallbackSrc?: string,
): MDXComponents {
  return {
    TrophyCard,
    ZiaCard,
    GradientButton,
    ZiaFile,
    ZiaFolder,
    SunoEmbed,
    ImageGrid: (props) => (
      <ImageGrid {...props} cdnBaseUrl={cdnBaseUrl} />
    ),
    ImageZoom: (props) => (
      <ImageZoom {...props} fallbackSrc={imageFallbackSrc} />
    ),
  };
}
