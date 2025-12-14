import defaultMdxComponents from "fumadocs-ui/mdx";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import {
  Mermaid,
  ImageZoom,
  TrophyCard,
  ImageGrid,
  ZiaCard,
  GradientButton,
  ZiaFile,
  ZiaFolder,
} from "@third-ui/fuma/mdx";
import { SiteX } from "@third-ui/fuma/server";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { Callout } from "fumadocs-ui/components/callout";
import { File, Folder, Files } from "fumadocs-ui/components/files";
import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import type { MDXComponents, MDXProps } from "mdx/types";
import { TypeTable } from "fumadocs-ui/components/type-table";
import { createGenerator as createTypeTableGenerator } from "fumadocs-typescript";
import { AutoTypeTable } from "fumadocs-typescript/ui";

import { globalLucideIcons as icons } from "@base-ui/components/global-icon";
import { appConfig } from "@/lib/appConfig";

// 创建一个语言标识符到图标组件的映射
const languageToIconMap: Record<string, React.ReactNode> = {
  css: <icons.CSS />,
  csv: <icons.CSV />,
  diff: <icons.Diff />,
  html: <icons.Html />,
  http: <icons.Http />,
  java: <icons.Java />,
  json: <icons.Json />,
  jsonc: <icons.SquareDashedBottomCode />,
  log: <icons.Log />,
  mdx: <icons.MDX />,
  regex: <icons.Regex />,
  sql: <icons.SQL />,
  text: <icons.Txt />,
  txt: <icons.Txt />,
  plaintext: <icons.Txt />,
  scheme: <icons.Scheme />,
  xml: <icons.XML />,
  yaml: <icons.Yaml />,
  yml: <icons.Yaml />,
};

// source.config.ts 中自定义transformer:parse-code-language中调用, 搭配使用
function tryToMatchIcon(
  props: Readonly<MDXProps & { "data-language"?: string; title?: string }>, // 明确 props 的类型
  iconMap: Record<string, React.ReactNode>
): React.ReactNode | undefined {
  let lang: string | undefined;

  // 1. 优先从 props['data-language'] 获取
  const dataLanguage = props["data-language"] as string | undefined;

  if (dataLanguage && dataLanguage.trim() !== "") {
    lang = dataLanguage.trim().toLowerCase();
  } else {
    // 2. 如果 data-language 不可用，则回退到从 title 解析
    const title = props.title as string | undefined;
    if (title) {
      const titleParts = title.split(".");
      // 确保文件名部分不是空的 (例如 ".css" 这种标题是不合法的)
      if (titleParts.length > 1 && titleParts[0] !== "") {
        const extension = titleParts.pop()?.toLowerCase();
        if (extension) {
          lang = extension;
        }
      }
    }
  }
  let customIcon: React.ReactNode | undefined;
  if (lang && iconMap[lang]) {
    customIcon = iconMap[lang];
  }
  return customIcon;
}

// Object containing globally available Fumadocs UI components
const fumadocsUiComponents = {
  Callout,
  CodeBlock,
  File,
  Folder,
  Files,
  Accordion,
  Accordions,
  Tab,
  Tabs,
  Pre,
  TypeTable,
};

const customUiComponents = {
  TrophyCard,
  ZiaCard,
  GradientButton,
  SiteX,
  ZiaFile,
  ZiaFolder,
};

const typeTableGenerator = createTypeTableGenerator();

// 这里只是渲染层处理, 将HAST渲染为React组件, 即HTML代码
export function getMDXComponents(
  components?: MDXComponents,
): MDXComponents {
  return {
    ...defaultMdxComponents,
    pre: (props) => {
      const customIcon = tryToMatchIcon(props, languageToIconMap);
      return (
        <CodeBlock
          {...props} // 扩展原始 props (包含 Shiki 的 props.icon)
          {...(customIcon && { icon: customIcon })} // 条件性覆盖 icon
        >
          <Pre>{props.children}</Pre>
        </CodeBlock>
      );
    },
    AutoTypeTable: (props) => (
      <AutoTypeTable {...props} generator={typeTableGenerator} />
    ),
    // 全局处理图片放大
     
    img: (props) => <ImageZoom {...(props as any)} />,
    // 全局配置的 Mermaid 组件
    Mermaid: (props) => (
      <Mermaid
        {...props}
        watermarkEnabled={appConfig.style.watermark.enabled}
        watermarkText={appConfig.style.watermark.text}
      />
    ),
    // 全局配置的 ImageGrid 组件
    ImageGrid: (props) => (
      <ImageGrid {...props} cdnBaseUrl={appConfig.style.cdnBaseUrl} />
    ),
    // 全局配置的 ImageZoom 组件
    ImageZoom: (props) => (
      <ImageZoom {...props} fallbackSrc={appConfig.style.placeHolder.image} />
    ),
    ...fumadocsUiComponents,
    ...customUiComponents,
    // 从项目统一icon库中使用
    ...icons,
    ...components,
  };
}

export const useMDXComponents = getMDXComponents;
