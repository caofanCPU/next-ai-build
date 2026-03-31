'use client';

import { useState } from 'react';
import { globalLucideIcons } from '@base-ui/components/global-icon';
import { themeIconColor } from '@windrun-huaiin/base-ui/lib';
import { cn } from '@lib/utils';
import { GradientButton } from '@third-ui/fuma/mdx';
import { XButton } from '@third-ui/main';

const iconEntries = Object.entries(globalLucideIcons).sort(([nameA], [nameB]) => nameA.localeCompare(nameB));

const pageShellClass =
  'mx-auto mt-12 flex w-full max-w-7xl flex-col gap-6 px-3 py-6 sm:px-4 md:gap-8 md:px-6 md:py-8';
const panelClass =
  'rounded-[28px] border border-border/60 bg-white/85 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/75 dark:bg-neutral-950/80 md:p-6';
const sectionTitleClass = 'text-xl font-semibold tracking-tight text-foreground md:text-2xl';
const sectionDescClass = 'text-sm leading-6 text-muted-foreground';
const iconCardClass =
  'flex min-h-[112px] flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-background/80 px-3 py-4 text-center shadow-sm transition-colors hover:border-primary/30 hover:bg-background';
const gradientButtonDemoClass = 'text-xs sm:text-base px-5 sm:px-8';
const xButtonSingleDemoClass = 'text-xs sm:text-sm';
const xButtonSplitMainDemoClass = 'text-xs sm:text-sm';
const xButtonSplitDropdownDemoClass = 'py-1 sm:py-1.5';

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

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

export default function TestComponentsPage() {
  const [actionText, setActionText] = useState('点击任意按钮查看交互记录');
  const [copiedIconName, setCopiedIconName] = useState<string | null>(null);
  const [copyToastText, setCopyToastText] = useState<string | null>(null);

  const handleAction = async (label: string) => {
    setActionText(`执行中：${label}`);
    await sleep(900);
    setActionText(`最近一次操作：${label}`);
  };

  const handleCopyIconUsage = async (iconName: string) => {
    const usageText = `icons.${iconName}`;

    try {
      const copied = await copyText(usageText);

      if (!copied) {
        throw new Error('Copy failed in both Clipboard API and fallback path');
      }

      setCopiedIconName(iconName);
      setCopyToastText(`已复制：icons.${iconName}`);
      setActionText(`已复制图标用法：${usageText}`);
      window.setTimeout(() => {
        setCopiedIconName((current) => (current === iconName ? null : current));
      }, 1600);
      window.setTimeout(() => {
        setCopyToastText((current) => (current === `已复制：icons.${iconName}` ? null : current));
      }, 1800);
    } catch (error) {
      console.error('Copy icon usage failed:', error);
      setActionText(`复制失败：${usageText}`);
      setCopyToastText('复制失败，请手动重试');
    }
  };

  return (
    <div className={pageShellClass}>
      <section className={cn(panelClass, 'relative overflow-hidden')}>
        <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-sky-100/70 via-white to-amber-100/60 dark:from-sky-950/30 dark:via-neutral-950 dark:to-amber-950/20" />
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
            组件测试页
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">按钮与图标效果展示</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
            这个页面专门用来集中查看通用图标与按钮效果。当前先放
            `Global Icon`、`GradientButton`、`XButton`，后续可以继续按 section 往下追加。
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full border border-emerald-300/70 bg-emerald-100 px-3 py-1 font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              图标总数：{iconEntries.length}
            </span>
            <span className="rounded-full border border-sky-300/70 bg-sky-100 px-3 py-1 font-medium text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
              已接入按钮变体：default / soft / subtle
            </span>
          </div>
        </div>
      </section>

      <section className={panelClass}>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className={sectionTitleClass}>Global Icon 全量展示</h2>
          </div>
          <div className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs text-muted-foreground">
            <code>{`import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server'`}</code>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
          {iconEntries.map(([iconName, Icon]) => (
            <button
              key={iconName}
              type="button"
              className={cn(
                iconCardClass,
                'group relative cursor-pointer text-left outline-none transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary/40',
                copiedIconName === iconName && cn(themeIconColor, 'border-current bg-primary/5 shadow-[0_0_0_2px_currentColor]')
              )}
              onClick={() => handleCopyIconUsage(iconName)}
              title={`点击复制 icons.${iconName}`}
            >
              <div
                className={cn(
                  "absolute right-2 top-2 rounded-full border px-2 py-0.5 text-[10px] transition-opacity",
                  copiedIconName === iconName
                    ? "border-emerald-300/70 bg-emerald-100 text-emerald-700 opacity-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : "border-border/70 bg-background/90 text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
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
      </section>

      <section className={panelClass}>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className={sectionTitleClass}>GradientButton 展示</h2>
            <p className={sectionDescClass}>保留默认渐变风格，同时展示 `soft`、`subtle`、链接态、点击态、禁用态和对齐差异。</p>
          </div>
        </div>

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
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="mb-3 text-sm font-medium text-foreground">图标、对齐与禁用</div>
            <div className="space-y-4">
              <GradientButton
                title="左对齐带图标"
                align="left"
                className={gradientButtonDemoClass}
                icon={<globalLucideIcons.Rocket />}
                onClick={() => handleAction('GradientButton 左对齐带图标')}
              />
              <GradientButton
                title="居中 soft 按钮"
                align="center"
                variant="soft"
                className={gradientButtonDemoClass}
                icon={<globalLucideIcons.Sparkles />}
                onClick={() => handleAction('GradientButton 居中 soft')}
              />
              <GradientButton
                title="居中 subtle 按钮"
                align="center"
                variant="subtle"
                className={gradientButtonDemoClass}
                icon={<globalLucideIcons.AlbumIcon />}
                onClick={() => handleAction('GradientButton 居中 subtle')}
              />
              <GradientButton
                title="右对齐禁用按钮"
                align="right"
                disabled
                className={gradientButtonDemoClass}
                icon={<globalLucideIcons.Shield />}
                onClick={() => handleAction('GradientButton 禁用态')}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={cn(panelClass, 'relative z-10')}>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className={sectionTitleClass}>XButton 展示</h2>
            <p className={sectionDescClass}>这里集中展示 `single` 和 `split` 两种模式，方便确认默认、soft、subtle 三种层级。</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="mb-3 text-sm font-medium text-foreground">Single 模式</div>
            <div className="flex flex-col gap-3">
              <XButton
                type="single"
                button={{
                  icon: <globalLucideIcons.Download />,
                  text: '默认单按钮',
                  onClick: () => handleAction('XButton 默认 single'),
                }}
                className={xButtonSingleDemoClass}
              />
              <XButton
                type="single"
                variant="soft"
                button={{
                  icon: <globalLucideIcons.BadgeQuestionMark />,
                  text: 'soft 单按钮',
                  onClick: () => handleAction('XButton soft single'),
                }}
                className={xButtonSingleDemoClass}
              />
              <XButton
                type="single"
                variant="subtle"
                button={{
                  icon: <globalLucideIcons.AlbumIcon />,
                  text: 'subtle 单按钮',
                  onClick: () => handleAction('XButton subtle single'),
                }}
                className={xButtonSingleDemoClass}
              />
              <XButton
                type="single"
                button={{
                  icon: <globalLucideIcons.Shield />,
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
                  icon: <globalLucideIcons.Rocket />,
                  text: '默认分体按钮',
                  onClick: () => handleAction('XButton 默认 split 主按钮'),
                }}
                mainButtonClassName={xButtonSplitMainDemoClass}
                dropdownButtonClassName={xButtonSplitDropdownDemoClass}
                menuItems={[
                  {
                    icon: <globalLucideIcons.Copy className="mr-2 h-4 w-4" />,
                    text: '复制链接',
                    onClick: () => handleAction('XButton 默认 split 复制链接'),
                  },
                  {
                    icon: <globalLucideIcons.ExternalLink className="mr-2 h-4 w-4" />,
                    text: '打开详情页',
                    onClick: () => handleAction('XButton 默认 split 打开详情页'),
                  },
                  {
                    icon: <globalLucideIcons.Shield className="mr-2 h-4 w-4" />,
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
                  icon: <globalLucideIcons.Sparkles />,
                  text: 'soft 分体按钮',
                  onClick: () => handleAction('XButton soft split 主按钮'),
                }}
                mainButtonClassName={xButtonSplitMainDemoClass}
                dropdownButtonClassName={xButtonSplitDropdownDemoClass}
                menuItems={[
                  {
                    icon: <globalLucideIcons.Mail className="mr-2 h-4 w-4" />,
                    text: '发送通知',
                    onClick: () => handleAction('XButton soft split 发送通知'),
                  },
                  {
                    icon: <globalLucideIcons.Settings className="mr-2 h-4 w-4" />,
                    text: '进入设置',
                    onClick: () => handleAction('XButton soft split 进入设置'),
                  },
                  {
                    icon: <globalLucideIcons.Bug className="mr-2 h-4 w-4" />,
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
                  icon: <globalLucideIcons.AlbumIcon />,
                  text: 'subtle 分体按钮',
                  onClick: () => handleAction('XButton subtle split 主按钮'),
                }}
                mainButtonClassName={xButtonSplitMainDemoClass}
                dropdownButtonClassName={xButtonSplitDropdownDemoClass}
                menuItems={[
                  {
                    icon: <globalLucideIcons.Mail className="mr-2 h-4 w-4" />,
                    text: '发送邮件',
                    onClick: () => handleAction('XButton subtle split 发送邮件'),
                  },
                  {
                    icon: <globalLucideIcons.Settings className="mr-2 h-4 w-4" />,
                    text: '调整配置',
                    onClick: () => handleAction('XButton subtle split 调整配置'),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

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
    </div>
  );
}
