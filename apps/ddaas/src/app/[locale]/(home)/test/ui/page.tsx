'use client';

import { type ComponentType, type ReactNode, useState } from 'react';
import type { LucideProps } from 'lucide-react';
import {
  AlbumIcon,
  BadgeQuestionMarkIcon,
  BadgeAlertIcon,
  BadgeCheckIcon,
  BadgeInfoIcon,
  BadgeXIcon,
  BellIcon,
  BugIcon,
  CircleAlertIcon,
  CircleQuestionMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FAQSIcon,
  FileDownIcon,
  FileUpIcon,
  HandHeartIcon,
  LinkIcon,
  MailIcon,
  RocketIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
  ShieldUserIcon,
  SparklesIcon,
  ZapIcon,
} from '@base-ui/icons';
import * as exportedIcons from '@base-ui/icons';
import { themeIconColor } from '@windrun-huaiin/base-ui/lib';
import { cn } from '@lib/utils';
import { GradientButton, XButton, XToggleButton } from '@third-ui/main/buttons';
import {
  AdsAlertDialog,
  ConfirmDialog,
  HighPriorityConfirmDialog,
  InfoDialog,
  UndoableConfirmDialog,
} from '@third-ui/main/alert-dialog';
import {
  XFilterPills,
  XFormPills,
  XPillSelect,
  XTokenInput,
  type XPillOption,
} from '@third-ui/main/pill-select';

type StaticIconComponent = ComponentType<LucideProps>;

const nonRenderableIconExportNames = new Set([
  'createGlobalIcon',
  'createGlobalLucideIcon',
  'createSiteIcon',
  'getGlobalIcon',
  'GlobalAccentIcon',
]);

const iconEntries = Object.entries(exportedIcons)
  .filter(([name]) => name.endsWith('Icon') && !nonRenderableIconExportNames.has(name))
  .map(([name, value]) => [name, value as StaticIconComponent] as const)
  .sort(([nameA], [nameB]) => nameA.localeCompare(nameB));

const pageShellClass =
  'mx-auto mt-12 flex w-full max-w-7xl flex-col gap-6 px-3 py-6 sm:px-4 md:gap-8 md:px-6 md:py-8';
const panelClass =
  'rounded-[28px] border border-border/60 bg-white/85 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/75 dark:bg-neutral-950/80 md:p-6';
const sectionTitleClass = 'text-xl font-semibold tracking-tight text-foreground md:text-2xl';
const sectionDescClass = 'text-sm leading-6 text-muted-foreground';
const iconCardClass =
  'flex min-h-[112px] flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-background/80 px-3 py-4 text-center shadow-sm transition-colors hover:border-primary/30 hover:bg-background';
const gradientButtonDemoClass = 'text-xs sm:text-sm px-5 sm:px-8';
const gradientButtonCustomClass = 'inline-flex min-h-8 min-w-20 items-center justify-center rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-400/20 dark:text-red-300 dark:hover:bg-red-500/10';
const xButtonSingleDemoClass = 'text-xs sm:text-sm';
const xButtonSplitMainDemoClass = 'text-xs sm:text-sm';
const xButtonSplitDropdownDemoClass = 'py-1 sm:py-1.5';
const dialogDemoButtonClass = 'w-auto border-border/70 bg-background/80 px-4 py-2 text-sm text-foreground hover:bg-accent';
const dialogInfoDemoMinWidthClass = 'min-w-[120px]';
const dialogDangerDemoButtonClass = 'w-auto min-w-0 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40';
// const textButtonDemoClass = 'w-auto min-w-0 border border-slate-300 text-sm font-medium text-slate-700 dark:border-slate-600 dark:text-slate-300';
const iconButtonDemoClass = 'w-auto min-w-0 rounded-full border border-border/70 bg-background/80 px-3 py-3 text-foreground hover:bg-accent';
const fieldCardClass = 'rounded-2xl border border-border/60 bg-background/70 p-4';
const compareCardClass = 'rounded-2xl border border-border/60 bg-background/60 p-3 sm:p-4';
const codeHintClass = 'mt-3 rounded-2xl border border-dashed border-border/70 bg-background/70 px-3 py-2 font-mono text-[11px] leading-5 text-muted-foreground sm:text-xs';

const collapsibleSectionIds = ['alert-dialog', 'global-icon', 'gradient-button', 'x-button', 'x-toggle-button', 'pill-select'] as const;

type SectionId = (typeof collapsibleSectionIds)[number];
type ExpandedSections = Record<SectionId, boolean>;
type ActiveDialogDemo =
  | null
  | 'ads'
  | 'info-info'
  | 'info-warn'
  | 'info-success'
  | 'info-error'
  | 'confirm-normal'
  | 'confirm-danger'
  | 'undoable-confirm'
  | 'high-priority';

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const createExpandedSections = (expanded: boolean): ExpandedSections =>
  collapsibleSectionIds.reduce(
    (accumulator, sectionId) => {
      accumulator[sectionId] = expanded;
      return accumulator;
    },
    {} as ExpandedSections
  );

const pillOptions: XPillOption[] = [
  { label: '产品设计', value: 'design' },
  { label: '前端开发', value: 'frontend' },
  { label: '后端接口', value: 'backend' },
  { label: 'AI 自动化', value: 'ai' },
  { label: '增长运营', value: 'growth' },
];

const copyText = async (text: string) => {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn('Clipboard API copy failed, fallback to execCommand.', error);
    }
  }

  if (typeof document === 'undefined') {
    return false;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  let copied = false;

  try {
    copied = document.execCommand('copy');
  } catch (error) {
    console.error('execCommand copy failed:', error);
  } finally {
    document.body.removeChild(textarea);
  }

  return copied;
};

type CollapsibleSectionProps = {
  title: string;
  description?: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
  headerExtra?: ReactNode;
};

function CollapsibleSection({
  title,
  description,
  isExpanded,
  onToggle,
  children,
  className,
  headerExtra,
}: CollapsibleSectionProps) {
  const ChevronIcon = isExpanded ? ChevronUpIcon : ChevronDownIcon;

  return (
    <section className={cn(panelClass, className)}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-col gap-3 text-left md:flex-row md:items-start md:justify-between"
        aria-expanded={isExpanded}
      >
        <div>
          <h2 className={sectionTitleClass}>{title}</h2>
          {description ? <p className={cn(sectionDescClass, 'mt-1')}>{description}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start md:justify-end">
          {headerExtra}
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent">
            <ChevronIcon className="h-4 w-4" />
            {isExpanded ? '折叠内容' : '展开内容'}
          </span>
        </div>
      </button>

      {isExpanded ? children : null}
    </section>
  );
}

export default function TestComponentsPage() {
  const [actionText, setActionText] = useState('点击任意按钮查看交互记录');
  const [activeDialogDemo, setActiveDialogDemo] = useState<ActiveDialogDemo>(null);
  const [copiedIconName, setCopiedIconName] = useState<string | null>(null);
  const [copyToastText, setCopyToastText] = useState<string | null>(null);
  const [iconSearchValue, setIconSearchValue] = useState('');
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>(() => createExpandedSections(false));
  const [singleValue, setSingleValue] = useState('frontend');
  const [singleCompactValue, setSingleCompactValue] = useState('design');
  const [multiValue, setMultiValue] = useState<string[]>(['frontend', 'ai']);
  const [multiPlainValue, setMultiPlainValue] = useState<string[]>(['design', 'frontend', 'backend']);
  const [multiCompactValue, setMultiCompactValue] = useState<string[]>(['growth']);
  const [formValue, setFormValue] = useState('backend');
  const [filterValue, setFilterValue] = useState('');
  const [tokenValue, setTokenValue] = useState<string[]>(['nextjs', 'tailwind', 'openai']);
  const [tokenCompactValue, setTokenCompactValue] = useState<string[]>(['seo', 'landing']);
  const [toggleDemoValue, setToggleDemoValue] = useState('icon-only');

  const handleAction = async (label: string) => {
    setActionText(`执行中：${label}`);
    await sleep(900);
    setActionText(`最近一次操作：${label}`);
  };

  const handleCopyIconUsage = async (iconName: string) => {
    const usageText = iconName;

    try {
      const copied = await copyText(usageText);

      if (!copied) {
        throw new Error('Copy failed in both Clipboard API and fallback path');
      }

      setCopiedIconName(iconName);
      setCopyToastText(`已复制：${iconName}`);
      setActionText(`已复制图标用法：${usageText}`);
      window.setTimeout(() => {
        setCopiedIconName((current) => (current === iconName ? null : current));
      }, 1600);
      window.setTimeout(() => {
        setCopyToastText((current) => (current === `已复制：${iconName}` ? null : current));
      }, 1800);
    } catch (error) {
      console.error('Copy icon usage failed:', error);
      setActionText(`复制失败：${usageText}`);
      setCopyToastText('复制失败，请手动重试');
    }
  };

  const handleToggleSection = (sectionId: SectionId) => {
    setExpandedSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  };

  const allSectionsExpanded = collapsibleSectionIds.every((sectionId) => expandedSections[sectionId]);
  const normalizedIconSearchValue = iconSearchValue.trim().toLowerCase();
  const filteredIconEntries = normalizedIconSearchValue
    ? iconEntries.filter(([iconName]) => iconName.toLowerCase().includes(normalizedIconSearchValue))
    : iconEntries;

  const handleToggleAllSections = () => {
    setExpandedSections(createExpandedSections(!allSectionsExpanded));
  };

  const closeActiveDialog = () => setActiveDialogDemo(null);

  return (
    <div className={pageShellClass}>
      <section className={cn(panelClass, 'relative overflow-hidden')}>
        <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-sky-100/70 via-white to-amber-100/60 dark:from-sky-950/30 dark:via-neutral-950 dark:to-amber-950/20" />
        <button
          type="button"
          onClick={handleToggleAllSections}
          className="flex w-full flex-col gap-3 text-left md:flex-row md:items-start md:justify-between"
          aria-expanded={allSectionsExpanded}
        >
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
              组件测试页
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">按钮与图标效果展示</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              这个页面专门用来集中查看通用图标与按钮效果。当前先放
              `Global Icon`、`GradientButton`、`XButton`，后续可以继续按 section 往下追加。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start md:justify-end">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent">
              {allSectionsExpanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
              {allSectionsExpanded ? '全部折叠' : '全部展开'}
            </span>
          </div>
        </button>
        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full border border-emerald-300/70 bg-emerald-100 px-3 py-1 font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            图标总数：{iconEntries.length}
          </span>
          <span className="rounded-full border border-sky-300/70 bg-sky-100 px-3 py-1 font-medium text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
            已接入按钮变体：default / soft / subtle
          </span>
        </div>
      </section>

      <CollapsibleSection
        title="Alert Dialog 展示"
        description="快速打开广告、信息提示、确认和高优先级确认弹窗，便于检查主题色、暗色模式、关闭按钮和按钮语义。"
        isExpanded={expandedSections['alert-dialog']}
        onToggle={() => handleToggleSection('alert-dialog')}
        className="relative z-20"
      >
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className={compareCardClass}>
            <div className="mb-3 text-sm font-medium text-foreground">AdsAlertDialog</div>
            <p className="mb-4 text-xs leading-6 text-muted-foreground">
              图片、链接、右上角关闭、可选取消/确认按钮。图片使用 R2 测试地址。
            </p>
            <XButton
              type="single"
              variant="subtle"
              minWidth="min-w-0"
              className={dialogDemoButtonClass}
              button={{
                icon: <BellIcon />,
                text: '打开广告弹窗',
                onClick: () => setActiveDialogDemo('ads'),
              }}
            />
          </div>

          <div className={compareCardClass}>
            <div className="mb-3 text-sm font-medium text-foreground">InfoDialog</div>
            <p className="mb-4 text-xs leading-6 text-muted-foreground">
              单确认按钮，按 info / warn / success / error 区分提示语义和视觉状态。
            </p>
            <div className="flex flex-wrap gap-2">
              <XButton
                type="single"
                variant="subtle"
                minWidth={dialogInfoDemoMinWidthClass}
                className={dialogDemoButtonClass}
                button={{ icon: <BadgeInfoIcon />, text: 'Info', onClick: () => setActiveDialogDemo('info-info') }}
              />
              <XButton
                type="single"
                variant="subtle"
                minWidth={dialogInfoDemoMinWidthClass}
                className={dialogDemoButtonClass}
                button={{ icon: <BadgeAlertIcon />, text: 'Warn', onClick: () => setActiveDialogDemo('info-warn') }}
              />
              <XButton
                type="single"
                variant="subtle"
                minWidth={dialogInfoDemoMinWidthClass}
                className={dialogDemoButtonClass}
                button={{ icon: <BadgeCheckIcon />, text: 'Success', onClick: () => setActiveDialogDemo('info-success') }}
              />
              <XButton
                type="single"
                variant="subtle"
                minWidth={dialogInfoDemoMinWidthClass}
                className={dialogDemoButtonClass}
                button={{ icon: <BadgeXIcon />, text: 'Error', onClick: () => setActiveDialogDemo('info-error') }}
              />
            </div>
          </div>

          <div className={compareCardClass}>
            <div className="mb-3 text-sm font-medium text-foreground">ConfirmDialog</div>
            <p className="mb-4 text-xs leading-6 text-muted-foreground">
              双按钮确认弹窗，normal 跟随主题色，danger 使用红色危险语义。
            </p>
            <div className="flex flex-wrap gap-2">
              <XButton
                type="single"
                variant="subtle"
                minWidth="min-w-0"
                className={dialogDemoButtonClass}
                button={{ icon: <CircleQuestionMarkIcon />, text: '普通确认', onClick: () => setActiveDialogDemo('confirm-normal') }}
              />
              <XButton
                type="single"
                variant="subtle"
                minWidth="min-w-0"
                className={dialogDangerDemoButtonClass}
                button={{ icon: <CircleAlertIcon />, text: '危险确认', onClick: () => setActiveDialogDemo('confirm-danger') }}
              />
              <XButton
                type="single"
                variant="subtle"
                minWidth="min-w-0"
                className={dialogDangerDemoButtonClass}
                button={{
                  icon: <CircleAlertIcon />,
                  text: '倒计时删除',
                  onClick: () => setActiveDialogDemo('undoable-confirm'),
                }}
              />
            </div>
          </div>

          <div className={compareCardClass}>
            <div className="mb-3 text-sm font-medium text-foreground">HighPriorityConfirmDialog</div>
            <p className="mb-4 text-xs leading-6 text-muted-foreground">
              强遮罩、高层级、必须决策，适合流程中断、离开页面、丢失状态这类高优先级场景。
            </p>
            <XButton
              type="single"
              variant="subtle"
              minWidth="min-w-0"
              className={cn(dialogDemoButtonClass, themeIconColor, 'border-current bg-primary/5 hover:bg-primary/10')}
              button={{
                icon: <FAQSIcon />,
                text: '打开高优先级确认',
                onClick: () => setActiveDialogDemo('high-priority'),
              }}
            />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Global Icon 全量展示"
        description="支持按图标名做前后模糊匹配，点击卡片可复制 `XxxIcon` 用法。"
        isExpanded={expandedSections['global-icon']}
        onToggle={() => handleToggleSection('global-icon')}
      >
        <div className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <label className="relative block w-full md:max-w-sm">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <SearchIcon className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={iconSearchValue}
                onChange={(event) => setIconSearchValue(event.target.value)}
                placeholder="搜索图标名，如 search / arrow / chevron"
                className={cn(
                  'h-11 w-full rounded-2xl border border-border/60 bg-background/80 pl-10 pr-4 text-sm text-foreground outline-none transition focus-visible:ring-2',
                  themeIconColor,
                  'focus:border-current focus-visible:border-current focus-visible:ring-current/30'
                )}
              />
            </label>
            <div className="text-sm text-muted-foreground">
              匹配结果：<span className="font-medium text-foreground">{filteredIconEntries.length}</span> / {iconEntries.length}
            </div>
          </div>

          {filteredIconEntries.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
              {filteredIconEntries.map(([iconName, Icon]) => (
                <button
                  key={iconName}
                  type="button"
                  className={cn(
                    iconCardClass,
                    'group relative cursor-pointer text-left outline-none transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary/40',
                    copiedIconName === iconName && cn(themeIconColor, 'border-current bg-primary/5 shadow-[0_0_0_2px_currentColor]')
                  )}
                  onClick={() => handleCopyIconUsage(iconName)}
                  title={`点击复制 ${iconName}`}
                >
                  <div
                    className={cn(
                      'absolute right-2 top-2 rounded-full border px-2 py-0.5 text-[10px] transition-opacity',
                      copiedIconName === iconName
                        ? 'border-emerald-300/70 bg-emerald-100 text-emerald-700 opacity-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'border-border/70 bg-background/90 text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                    )}
                  >
                    {copiedIconName === iconName ? '已复制' : '点击复制'}
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-linear-to-br from-background to-muted/60">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="w-full">
                    <div className="truncate text-sm font-medium text-foreground">{iconName}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 px-4 py-10 text-center text-sm text-muted-foreground">
              没有匹配到图标：<span className="font-medium text-foreground">{iconSearchValue}</span>
            </div>
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="GradientButton 展示"
        description="保留默认渐变风格，同时展示 `soft`、`subtle`、链接态、点击态、禁用态和对齐差异。"
        isExpanded={expandedSections['gradient-button']}
        onToggle={() => handleToggleSection('gradient-button')}
      >
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="mb-3 text-sm font-medium text-foreground">三种视觉层级</div>
            <div className="flex flex-col gap-3">
              <GradientButton className={gradientButtonDemoClass} title="默认渐变按钮" onClick={() => handleAction('GradientButton 默认渐变按钮')} />
              <GradientButton className={gradientButtonDemoClass} title="低调主题按钮" variant="soft" onClick={() => handleAction('GradientButton soft 按钮')} />
              <GradientButton className={gradientButtonDemoClass} title="更低调 subtle 按钮" variant="subtle" onClick={() => handleAction('GradientButton subtle 按钮')} />
              <GradientButton className={gradientButtonDemoClass} title="链接跳转按钮" href="#" openInNewTab={false} />
              <GradientButton className={gradientButtonDemoClass} title="soft 链接按钮" href="#" openInNewTab={false} variant="soft" />
              <GradientButton className={gradientButtonDemoClass} title="subtle 链接按钮" href="#" openInNewTab={false} variant="subtle" />
              <GradientButton className={gradientButtonCustomClass} title="subtle普通点击按钮" onClick={() => handleAction('GradientButton Subtle个性化按钮')}  variant="subtle" icon={false} />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="mb-3 text-sm font-medium text-foreground">图标、对齐与禁用</div>
            <div className="space-y-4">
              <GradientButton
                title="左对齐带图标"
                align="left"
                className={gradientButtonDemoClass}
                icon={<RocketIcon />}
                onClick={() => handleAction('GradientButton 左对齐带图标')}
              />
              <GradientButton
                title="居中 soft 按钮"
                align="center"
                variant="soft"
                className={gradientButtonDemoClass}
                icon={<SparklesIcon />}
                onClick={() => handleAction('GradientButton 居中 soft')}
              />
              <GradientButton
                title="居中 subtle 按钮"
                align="center"
                variant="subtle"
                className={gradientButtonDemoClass}
                icon={<AlbumIcon />}
                onClick={() => handleAction('GradientButton 居中 subtle')}
              />
              <GradientButton
                title="右对齐禁用按钮"
                align="right"
                disabled
                className={gradientButtonDemoClass}
                icon={<ShieldIcon />}
                onClick={() => handleAction('GradientButton 禁用态')}
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="XButton 展示"
        description="这里集中展示 `single` 和 `split` 两种模式，方便确认默认、soft、subtle 三种层级。"
        isExpanded={expandedSections['x-button']}
        onToggle={() => handleToggleSection('x-button')}
        className="relative z-10"
      >
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="mb-3 text-sm font-medium text-foreground">Single 模式</div>
            <div className="flex flex-col gap-3">
              <XButton
                type="single"
                button={{
                  icon: <DownloadIcon />,
                  text: '默认单按钮',
                  onClick: () => handleAction('XButton 默认 single'),
                }}
                className={xButtonSingleDemoClass}
              />
              <XButton
                type="single"
                variant="soft"
                button={{
                  icon: <BadgeQuestionMarkIcon />,
                  text: 'soft 单按钮',
                  onClick: () => handleAction('XButton soft single'),
                }}
                className={xButtonSingleDemoClass}
              />
              <XButton
                type="single"
                variant="subtle"
                button={{
                  icon: <AlbumIcon />,
                  text: 'subtle 单按钮',
                  onClick: () => handleAction('XButton subtle single'),
                }}
                className={xButtonSingleDemoClass}
              />
              <XButton
                type="single"
                button={{
                  icon: <ShieldIcon />,
                  text: '禁用单按钮',
                  onClick: () => handleAction('XButton 禁用 single'),
                  disabled: true,
                }}
                className={xButtonSingleDemoClass}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="mb-3 text-sm font-medium text-foreground">Split 模式</div>
            <div className="flex flex-col gap-3">
              <XButton
                type="split"
                mainButton={{
                  icon: <RocketIcon />,
                  text: '默认分体按钮',
                  onClick: () => handleAction('XButton 默认 split 主按钮'),
                }}
                mainButtonClassName={xButtonSplitMainDemoClass}
                dropdownButtonClassName={xButtonSplitDropdownDemoClass}
                menuItems={[
                  {
                    icon: <CopyIcon className="mr-2 h-4 w-4" />,
                    text: '复制链接',
                    onClick: () => handleAction('XButton 默认 split 复制链接'),
                  },
                  {
                    icon: <ExternalLinkIcon className="mr-2 h-4 w-4" />,
                    text: '打开详情页',
                    onClick: () => handleAction('XButton 默认 split 打开详情页'),
                  },
                  {
                    icon: <ShieldIcon className="mr-2 h-4 w-4" />,
                    text: '受保护操作',
                    onClick: () => handleAction('XButton 默认 split 受保护操作'),
                    splitTopBorder: true,
                    tag: { text: '推荐' },
                  },
                ]}
              />
              <XButton
                type="split"
                variant="soft"
                mainButton={{
                  icon: <SparklesIcon />,
                  text: 'soft 分体按钮',
                  onClick: () => handleAction('XButton soft split 主按钮'),
                }}
                mainButtonClassName={xButtonSplitMainDemoClass}
                dropdownButtonClassName={xButtonSplitDropdownDemoClass}
                menuItems={[
                  {
                    icon: <MailIcon className="mr-2 h-4 w-4" />,
                    text: '发送通知',
                    onClick: () => handleAction('XButton soft split 发送通知'),
                  },
                  {
                    icon: <SettingsIcon className="mr-2 h-4 w-4" />,
                    text: '进入设置',
                    onClick: () => handleAction('XButton soft split 进入设置'),
                  },
                  {
                    icon: <BugIcon className="mr-2 h-4 w-4" />,
                    text: '调试入口',
                    onClick: () => handleAction('XButton soft split 调试入口'),
                    tag: { text: '测试', color: '#0EA5E9' },
                  },
                ]}
              />
              <XButton
                type="split"
                variant="subtle"
                mainButton={{
                  icon: <AlbumIcon />,
                  text: 'subtle 分体按钮',
                  onClick: () => handleAction('XButton subtle split 主按钮'),
                }}
                mainButtonClassName={xButtonSplitMainDemoClass}
                dropdownButtonClassName={xButtonSplitDropdownDemoClass}
                menuItems={[
                  {
                    icon: <MailIcon className="mr-2 h-4 w-4" />,
                    text: '发送邮件',
                    onClick: () => handleAction('XButton subtle split 发送邮件'),
                  },
                  {
                    icon: <SettingsIcon className="mr-2 h-4 w-4" />,
                    text: '调整配置',
                    onClick: () => handleAction('XButton subtle split 调整配置'),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="XToggleButton 展示"
        description="这一组用来测试单选切换、floating badge，以及切换后联动展示纯 icon 按钮、纯文本按钮、强调按钮、链接按钮四种按钮形态。"
        isExpanded={expandedSections['x-toggle-button']}
        onToggle={() => handleToggleSection('x-toggle-button')}
        className="relative z-10"
      >
        <div className="mt-5 flex flex-col gap-4">
          <div className={compareCardClass}>
            <div className="mb-3 text-sm font-medium text-foreground">Billing 风格 Toggle</div>
            <div className="flex justify-center">
              <XToggleButton
                value={toggleDemoValue}
                onChange={setToggleDemoValue}
                ariaLabel="Button style switcher"
                itemTextClassName="text-xs"
                itemPaddingClassName="px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2"
                minItemWidthClassName="min-w-[60px] sm:min-w-[80px] md:min-w-[100px]"
                maxItemWidthClassName="max-w-[70px] sm:max-w-[100px] md:max-w-[140px]"
                options={[
                  { value: 'icon-only', label: 'Icon Only' },
                  { value: 'text-only', label: 'Text Only', badge: 'Popular' },
                  { value: 'accent', label: 'Accent' },
                  { value: 'link-like', label: 'Link Like', badge: 'Light' },
                ]}
              />
            </div>
            <div className={codeHintClass}>
              {`<XToggleButton itemTextClassName="text-xs" maxItemWidthClassName="max-w-[70px] sm:max-w-[100px]" />`}
            </div>
          </div>

          <div className={compareCardClass}>
            <div className="mb-3 text-sm font-medium text-foreground">切换结果预览</div>
            <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Active: {toggleDemoValue}
              </div>

              {toggleDemoValue === 'icon-only' ? (
                <div className="flex flex-wrap items-center gap-3">
                  <XButton
                    type="single"
                    button={{
                      icon: <SearchIcon />,
                      text: '',
                      onClick: () => handleAction('Toggle / 纯 icon 搜索按钮'),
                    }}
                    className={iconButtonDemoClass}
                    minWidth="min-w-0"
                  />
                  <XButton
                    type="single"
                    button={{
                      icon: <HandHeartIcon />,
                      text: '',
                      onClick: () => handleAction('Toggle / 纯 icon 喜欢按钮'),
                    }}
                    className={iconButtonDemoClass}
                    minWidth="min-w-0"
                  />
                  <XButton
                    type="single"
                    button={{
                      icon: <ShieldUserIcon />,
                      text: '',
                      onClick: () => handleAction('Toggle / 纯 icon 分享按钮'),
                    }}
                    className={iconButtonDemoClass}
                    minWidth="min-w-0"
                  />
                </div>
              ) : null}

              {toggleDemoValue === 'text-only' ? (
                <div className="flex flex-wrap items-center gap-5">
                  <XButton
                    type="single"
                    variant="subtle"
                    button={{
                      icon: null,
                      text: 'Cancel',
                      onClick: () => handleAction('Toggle / 文本 Cancel 按钮'),
                    }}
                    className="border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300"
                    minWidth="min-w-0"
                  />
                  <XButton
                    type="single"
                    variant="subtle"
                    button={{
                      icon: false,
                      text: 'Forgot password?',
                      onClick: () => handleAction('Toggle / 文本 Forgot password 按钮'),
                    }}
                    className="border border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300"
                    minWidth="min-w-0"
                  />
                  <XButton
                    type="single"
                    variant="subtle"
                    button={{
                      icon: null,
                      text: 'View details',
                      onClick: () => handleAction('Toggle / 文本 View details 按钮'),
                    }}
                    className="border border-emerald-300 text-emerald-700 dark:border-emerald-600 dark:text-emerald-300"
                    minWidth="min-w-0"
                  />
                </div>
              ) : null}

              {toggleDemoValue === 'accent' ? (
                <div className="flex flex-wrap items-center gap-3">
                  <GradientButton
                    title="Upgrade Now"
                    icon={<RocketIcon />}
                    className="min-w-[150px]"
                    onClick={() => handleAction('Toggle / 强调 Upgrade Now 按钮')}
                  />
                  <XButton
                    type="single"
                    variant="soft"
                    button={{
                      icon: <SparklesIcon />,
                      text: 'Try Pro',
                      onClick: () => handleAction('Toggle / 强调 Try Pro 按钮'),
                    }}
                    className="w-auto bg-emerald-500 text-white hover:bg-emerald-600 border border-emerald-600"
                    minWidth="min-w-[140px]"
                  />
                </div>
              ) : null}

              {toggleDemoValue === 'link-like' ? (
                <div className="flex flex-wrap items-center gap-3">
                  <GradientButton
                    title="Open Docs"
                    href="#"
                    openInNewTab={false}
                    variant="subtle"
                    icon={<ExternalLinkIcon />}
                    className="min-w-[148px] border-sky-300 text-sky-700 hover:bg-sky-50 dark:text-sky-300"
                  />
                  <GradientButton
                    title="View Pricing"
                    href="#"
                    openInNewTab={false}
                    variant="soft"
                    icon={false}
                    className="min-w-[148px]"
                  />
                </div>
              ) : null}
            </div>
            <div className={codeHintClass}>
              {`toggle items: icon-only / text-only / accent / link-like`}
            </div>
          </div>

          <div className={compareCardClass}>
            <div className="mb-3 text-sm font-medium text-foreground">Web 风格 Toggle - 带 mobileIcon</div>
            <p className="mb-4 text-xs text-muted-foreground">移动端显示图标，web端显示文本</p>
            <div className="flex justify-center">
              <XToggleButton
                value={toggleDemoValue}
                onChange={setToggleDemoValue}
                ariaLabel="Button style switcher"
                itemPaddingClassName="px-1 py-1 sm:px-3 sm:py-2"
                minItemWidthClassName="min-w-[40px] sm:min-w-[100px]"
                maxItemWidthClassName="max-w-[50px] sm:max-w-[160px]"
                options={[
                  { value: 'icon-only', label: 'Icon Only', mobileIcon: <FileUpIcon className="h-4 w-4" /> },
                  { value: 'text-only', label: 'Text Only', badge: 'Popular', mobileIcon: <FileDownIcon className="h-4 w-4" /> },
                  { value: 'accent', label: 'Accent', mobileIcon: <ZapIcon className="h-4 w-4" /> },
                  { value: 'link-like', label: 'Link Like', badge: 'Light', mobileIcon: <LinkIcon className="h-4 w-4" /> },
                ]}
              />
            </div>
            <div className={codeHintClass}>
              {`<XToggleButton options={[..., { mobileIcon: <Icon className="h-4 w-4" /> }]} />`}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Pill Select 展示"
        description="这里按组件分组，把 `default` 和 `compact` 放在同一组内直接对照，方便一眼看出尺寸和布局差异。"
        isExpanded={expandedSections['pill-select']}
        onToggle={() => handleToggleSection('pill-select')}
        className="relative z-0"
      >
        <div className="mt-5 grid gap-4">
          <div className={fieldCardClass}>
            <div className="mb-3 text-sm font-medium text-foreground">下拉单选</div>
            <div className="grid gap-3 lg:grid-cols-2">
              <div className={compareCardClass}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Default</div>
                <XPillSelect
                  mode="single"
                  value={singleValue}
                  onChange={setSingleValue}
                  options={pillOptions}
                  emptyLabel="请选择一个方向"
                  allowClear
                />
                <div className={codeHintClass}>
                  {`<XPillSelect mode="single" size="default" allowClear />`}
                </div>
              </div>
              <div className={compareCardClass}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Compact</div>
                <XPillSelect
                  mode="single"
                  size="compact"
                  value={singleCompactValue}
                  onChange={setSingleCompactValue}
                  options={pillOptions}
                  emptyLabel="紧凑单选"
                  allowClear
                />
                <div className={codeHintClass}>
                  {`<XPillSelect mode="single" size="compact" allowClear />`}
                </div>
              </div>
            </div>
          </div>

          <div className={fieldCardClass}>
            <div className="mb-3 text-sm font-medium text-foreground">下拉多选</div>
            <div className="grid gap-3 xl:grid-cols-3">
              <div className={compareCardClass}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Default / Full Pills</div>
                <XPillSelect
                  mode="multiple"
                  value={multiPlainValue}
                  onChange={setMultiPlainValue}
                  options={pillOptions}
                  emptyLabel="不限制显示数量"
                  allSelectedLabel="全部方向"
                  allowClear
                />
                <div className={codeHintClass}>
                  {`<XPillSelect mode="multiple" allSelectedLabel="全部方向" />`}
                </div>
              </div>
              <div className={compareCardClass}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Default</div>
                <XPillSelect
                  mode="multiple"
                  value={multiValue}
                  onChange={setMultiValue}
                  options={pillOptions}
                  emptyLabel="请选择多个标签"
                  allSelectedLabel="全部方向"
                  maxVisiblePills={2}
                  allowClear
                />
                <div className={codeHintClass}>
                  {`<XPillSelect mode="multiple" allSelectedLabel="全部方向" maxVisiblePills={2} />`}
                </div>
              </div>
              <div className={compareCardClass}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Compact</div>
                <XPillSelect
                  mode="multiple"
                  size="compact"
                  value={multiCompactValue}
                  onChange={setMultiCompactValue}
                  options={pillOptions}
                  emptyLabel="紧凑多选"
                  allSelectedLabel="全部方向"
                  maxVisiblePills={1}
                  allowClear
                />
                <div className={codeHintClass}>
                  {`<XPillSelect mode="multiple" size="compact" allSelectedLabel="全部方向" maxVisiblePills={1} />`}
                </div>
              </div>
            </div>
          </div>

          <div className={fieldCardClass}>
            <div className="mb-3 text-sm font-medium text-foreground">表单/筛选封装</div>
            <div className="grid gap-3 lg:grid-cols-2">
              <div className={compareCardClass}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">XFormPills</div>
                <XFormPills
                  label="所属模块"
                  value={formValue}
                  options={pillOptions}
                  onChange={setFormValue}
                  emptyLabel="请选择模块"
                  allowClear
                />
                <div className={codeHintClass}>
                  {`<XFormPills label="所属模块" allowClear />`}
                </div>
              </div>
              <div className={compareCardClass}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">XFilterPills</div>
                <XFilterPills
                  label="筛选方向"
                  value={filterValue}
                  options={pillOptions}
                  onChange={setFilterValue}
                  allLabel="全部"
                />
                <div className={codeHintClass}>
                  {`<XFilterPills label="筛选方向" allLabel="全部" />`}
                </div>
              </div>
            </div>
          </div>

          <div className={fieldCardClass}>
            <div className="mb-3 text-sm font-medium text-foreground">XTokenInput</div>
            <div className="grid gap-3 lg:grid-cols-2">
              <div className={compareCardClass}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Default</div>
                <XTokenInput
                  value={tokenValue}
                  onChange={setTokenValue}
                  placeholder="输入标签后回车"
                  emptyLabel="还没有输入任何 token"
                />
                <div className={codeHintClass}>
                  {`<XTokenInput size="default" placeholder="输入标签后回车" />`}
                </div>
              </div>
              <div className={compareCardClass}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Compact</div>
                <XTokenInput
                  size="compact"
                  value={tokenCompactValue}
                  onChange={setTokenCompactValue}
                  placeholder="紧凑模式 token 输入"
                  emptyLabel="紧凑模式下可快速录入"
                />
                <div className={codeHintClass}>
                  {`<XTokenInput size="compact" placeholder="紧凑模式 token 输入" />`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <section className={cn(panelClass, 'relative z-0')}>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className={sectionTitleClass}>交互记录</h2>
            <p className={sectionDescClass}>按钮点击后会在这里展示最近一次操作，方便确认 loading 与事件是否正常。</p>
          </div>
          <div className="rounded-full border border-amber-300/70 bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            当前状态：{actionText}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-dashed border-border/70 bg-background/60 p-4 text-sm leading-7 text-muted-foreground">
          后续如果继续扩展这个页面，建议按 section 增加，例如：`Card`、`Badge`、`Dialog`、`Loading`、`Pricing`。
        </div>
      </section>

      {copyToastText ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-120 flex justify-center px-4">
          <div className="rounded-full border border-emerald-300/70 bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-800 shadow-lg dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
            {copyToastText}
          </div>
        </div>
      ) : null}

      <AdsAlertDialog
        open={activeDialogDemo === 'ads'}
        onOpenChange={(open) => setActiveDialogDemo(open ? 'ads' : null)}
        title="R2 Image Promotion"
        description="用于测试广告弹窗的图片展示、图片点击链接、关闭按钮和主题按钮样式。"
        imgSrc="https://r2.d8ger.com/default.webp"
        imgHref="https://r2.d8ger.com/default.webp"
        cancelText="Later"
        confirmText="View Image"
        onCancel={() => setActionText('广告弹窗：点击 Later')}
        onConfirm={() => setActionText('广告弹窗：点击 View Image')}
      />

      <InfoDialog
        open={activeDialogDemo === 'info-info'}
        onOpenChange={(open) => setActiveDialogDemo(open ? 'info-info' : null)}
        type="info"
        title="Information"
        description="这是一条普通信息提示，用来测试 info 类型的图标、边框、背景和确认按钮。"
        confirmText="Got it"
        onConfirm={() => setActionText('InfoDialog：info 确认')}
      />
      <InfoDialog
        open={activeDialogDemo === 'info-warn'}
        onOpenChange={(open) => setActiveDialogDemo(open ? 'info-warn' : null)}
        type="warn"
        title="Warning"
        description="这是一条警告提示，用来测试 warn 类型在浅色和暗色主题下的可读性。"
        confirmText="I understand"
        onConfirm={() => setActionText('InfoDialog：warn 确认')}
      />
      <InfoDialog
        open={activeDialogDemo === 'info-success'}
        onOpenChange={(open) => setActiveDialogDemo(open ? 'info-success' : null)}
        type="success"
        title="Success"
        description="操作已经完成。这个弹窗用于检查 success 类型的语义色和单按钮确认交互。"
        confirmText="Done"
        onConfirm={() => setActionText('InfoDialog：success 确认')}
      />
      <InfoDialog
        open={activeDialogDemo === 'info-error'}
        onOpenChange={(open) => setActiveDialogDemo(open ? 'info-error' : null)}
        type="error"
        title="Error"
        description="操作失败，请稍后重试。这个弹窗用于检查 error 类型的红色提示样式。"
        confirmText="Close"
        onConfirm={() => setActionText('InfoDialog：error 确认')}
      />

      <ConfirmDialog
        open={activeDialogDemo === 'confirm-normal'}
        onOpenChange={(open) => setActiveDialogDemo(open ? 'confirm-normal' : null)}
        type="normal"
        title="Apply changes?"
        description="这是一个普通确认弹窗，用来测试取消、确认、右上角关闭以及主题色确认按钮。"
        cancelText="Cancel"
        confirmText="Apply"
        onCancel={() => setActionText('ConfirmDialog：normal 取消')}
        onConfirm={() => setActionText('ConfirmDialog：normal 确认')}
      />
      <ConfirmDialog
        open={activeDialogDemo === 'confirm-danger'}
        onOpenChange={(open) => setActiveDialogDemo(open ? 'confirm-danger' : null)}
        type="danger"
        title="Delete this item?"
        description="这是一个危险确认弹窗，用来测试删除、清空、重置等破坏性操作的红色警醒样式。"
        cancelText="Cancel"
        confirmText="Delete"
        onCancel={() => setActionText('ConfirmDialog：danger 取消')}
        onConfirm={() => setActionText('ConfirmDialog：danger 确认')}
      />

      <UndoableConfirmDialog
        open={activeDialogDemo === 'undoable-confirm'}
        onOpenChange={(open) => setActiveDialogDemo(open ? 'undoable-confirm' : null)}
        title="Delete this record?"
        description="点击删除后会进入等待期。等待期内可以撤回，倒计时结束后才会执行删除。"
        pendingTitle="Delete scheduled"
        pendingDescription="删除操作即将执行。倒计时结束前点击 Undo 可以撤回。"
        countdownSeconds={5}
        cancelText="Cancel"
        confirmText="Delete"
        undoText="Undo"
        onCancel={() => setActionText('UndoableConfirmDialog：取消')}
        onUndo={() => setActionText('UndoableConfirmDialog：已撤回')}
        onConfirm={async () => {
          setActionText('UndoableConfirmDialog：倒计时结束，开始删除');
          await sleep(400);
          setActionText('UndoableConfirmDialog：删除已执行');
        }}
      />

      <HighPriorityConfirmDialog
        open={activeDialogDemo === 'high-priority'}
        title="Leave this flow?"
        description="这是一个高优先级确认弹窗，用来测试强遮罩、高 z-index、关闭按钮和二选一决策。"
        cancelText="Stay"
        confirmText="Leave"
        onCancel={() => {
          closeActiveDialog();
          setActionText('HighPriorityConfirmDialog：取消/关闭');
        }}
        onConfirm={() => {
          closeActiveDialog();
          setActionText('HighPriorityConfirmDialog：确认');
        }}
      />
    </div>
  );
}
