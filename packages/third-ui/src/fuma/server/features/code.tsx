import type { MDXComponents, MDXProps } from 'mdx/types';
import { lazy, type ReactNode } from 'react';
import {
  CSSIcon,
  CSVIcon,
  DiffIcon,
  HtmlIcon,
  HttpIcon,
  JavaIcon,
  JsonIcon,
  LogIcon,
  MDXIcon,
  RegexIcon,
  SQLIcon,
  SchemeIcon,
  SquareDashedBottomCodeIcon,
  TxtIcon,
  XMLIcon,
  YamlIcon,
} from '@windrun-huaiin/base-ui/icons';

const CodeBlock = lazy(() =>
  import('fumadocs-ui/components/codeblock').then((mod) => ({ default: mod.CodeBlock })),
);
const Pre = lazy(() =>
  import('fumadocs-ui/components/codeblock').then((mod) => ({ default: mod.Pre })),
);

const defaultCodeLanguageIconMap: Record<string, ReactNode> = {
  css: <CSSIcon />,
  csv: <CSVIcon />,
  diff: <DiffIcon />,
  html: <HtmlIcon />,
  http: <HttpIcon />,
  java: <JavaIcon />,
  json: <JsonIcon />,
  jsonc: <SquareDashedBottomCodeIcon />,
  log: <LogIcon />,
  mdx: <MDXIcon />,
  plaintext: <TxtIcon />,
  regex: <RegexIcon />,
  scheme: <SchemeIcon />,
  sql: <SQLIcon />,
  text: <TxtIcon />,
  txt: <TxtIcon />,
  xml: <XMLIcon />,
  yaml: <YamlIcon />,
  yml: <YamlIcon />,
};

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

export function createCodeMdxComponents(): MDXComponents {
  return {
    pre: (props) => {
      const customIcon = tryToMatchIcon(
        props as MDXProps & { 'data-language'?: string; title?: string },
        defaultCodeLanguageIconMap,
      );
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
