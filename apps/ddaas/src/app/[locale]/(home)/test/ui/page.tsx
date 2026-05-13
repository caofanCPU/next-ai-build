'use client';

import { type ComponentType, type ReactNode, useState } from 'react';
import { useTranslations } from 'next-intl';
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
  CalendarClockIcon,
  CalendarDaysIcon,
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
import {
  CalendarDateRangeInput,
  CalendarStatusView,
  RandomDateRangeDialog,
  type CalendarDayState,
  type RandomCalendarRange,
} from '@third-ui/main/calendar';

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

const collapsibleSectionIds = ['random-calendar', 'alert-dialog', 'global-icon', 'gradient-button', 'x-button', 'x-toggle-button', 'pill-select'] as const;

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
  | 'confirm-normal-reversed'
  | 'confirm-danger'
  | 'info-loading'
  | 'confirm-loading-confirm'
  | 'confirm-loading-cancel'
  | 'undoable-confirm'
  | 'undoable-loading-confirm'
  | 'undoable-loading-undo'
  | 'undoable-loading-both'
  | 'high-priority-loading'
  | 'high-priority';

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const DIALOG_LOADING_DEMO_DELAY_MS = 2000;

const createExpandedSections = (expanded: boolean): ExpandedSections =>
  collapsibleSectionIds.reduce(
    (accumulator, sectionId) => {
      accumulator[sectionId] = expanded;
      return accumulator;
    },
    {} as ExpandedSections
  );

const randomCalendarSavedDates = ['2026-05-03', '2026-05-07', '2026-05-18', '2026-05-29'];
const randomCalendarPlannedDates = ['2026-05-10', '2026-05-11', '2026-05-12', '2026-05-13'];
const randomCalendarWarningDates = ['2026-05-21'];

function parseDateString(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number): string {
  const date = parseDateString(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateString(date);
}

function buildDateRangeDates(range: RandomCalendarRange): string[] {
  if (!range.startDate || !range.endDate) {
    return [];
  }

  const startTime = parseDateString(range.startDate).getTime();
  const endTime = parseDateString(range.endDate).getTime();
  const orderedStart = startTime <= endTime ? range.startDate : range.endDate;
  const orderedEnd = startTime <= endTime ? range.endDate : range.startDate;
  const dayCount = Math.floor((parseDateString(orderedEnd).getTime() - parseDateString(orderedStart).getTime()) / 86400000) + 1;

  return Array.from({ length: Math.max(dayCount, 0) }, (_, index) => addDays(orderedStart, index));
}

function buildPlannedDatesSkippingSaved(
  range: RandomCalendarRange,
  states: Map<string, CalendarDayState>
): string[] {
  const requestedDayCount = buildDateRangeDates(range).length;

  if (!range.startDate || requestedDayCount === 0) {
    return [];
  }

  const plannedDates: string[] = [];
  let cursorDate = range.startDate;

  while (plannedDates.length < requestedDayCount) {
    if (states.get(cursorDate)?.key !== 'saved') {
      plannedDates.push(cursorDate);
    }

    cursorDate = addDays(cursorDate, 1);
  }

  return plannedDates;
}

function createRandomCalendarDayStates(options?: { plannedRange?: RandomCalendarRange }): Map<string, CalendarDayState> {
  const states = new Map<string, CalendarDayState>();

  randomCalendarSavedDates.forEach((date) => {
    states.set(date, {
      key: 'saved',
      tone: 'saved',
      title: `${date}: saved question set`,
    });
  });

  randomCalendarPlannedDates.forEach((date) => {
    states.set(date, {
      key: 'planned',
      tone: 'planned',
      title: `${date}: planned draft`,
    });
  });

  randomCalendarWarningDates.forEach((date) => {
    states.set(date, {
      key: 'warning',
      tone: 'warning',
      title: `${date}: needs review`,
    });
  });

  buildDateRangeDates(options?.plannedRange ?? { startDate: null, endDate: null }).forEach((date) => {
    if (!states.has(date)) {
      states.set(date, {
        key: 'planned',
        tone: 'planned',
        title: `${date}: planned from range window`,
      });
    }
  });

  return states;
}

function setCalendarDateState(
  states: Map<string, CalendarDayState>,
  date: string,
  state: CalendarDayState | null
): Map<string, CalendarDayState> {
  const nextStates = new Map(states);

  if (state) {
    nextStates.set(date, state);
  } else {
    nextStates.delete(date);
  }

  return nextStates;
}

function getRangeSummary(range: RandomCalendarRange): string {
  if (!range.startDate || !range.endDate) {
    return 'No range selected';
  }

  return `${range.startDate} ~ ${range.endDate} (${buildDateRangeDates(range).length} days)`;
}

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
  collapseLabel: string;
  expandLabel: string;
  children: ReactNode;
  className?: string;
  headerExtra?: ReactNode;
};

function CollapsibleSection({
  title,
  description,
  isExpanded,
  onToggle,
  collapseLabel,
  expandLabel,
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
            {isExpanded ? collapseLabel : expandLabel}
          </span>
        </div>
      </button>

      {isExpanded ? children : null}
    </section>
  );
}

export default function TestComponentsPage() {
  const t = useTranslations('test.ui');
  const pillOptions: XPillOption[] = [
    { label: t('pillOptions.design'), value: 'design' },
    { label: t('pillOptions.frontend'), value: 'frontend' },
    { label: t('pillOptions.backend'), value: 'backend' },
    { label: t('pillOptions.ai'), value: 'ai' },
    { label: t('pillOptions.growth'), value: 'growth' },
  ];
  const [actionText, setActionText] = useState(t('initialAction'));
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
  const [rangeOnlyValue, setRangeOnlyValue] = useState<RandomCalendarRange>({
    startDate: '2026-05-08',
    endDate: '2026-05-14',
  });
  const [calendarOnlySelectedDate, setCalendarOnlySelectedDate] = useState('2026-05-07');
  const [calendarOnlyDayStates, setCalendarOnlyDayStates] = useState(() => createRandomCalendarDayStates());
  const [combinedSelectedDate, setCombinedSelectedDate] = useState('2026-05-10');
  const [combinedRangeDialogOpen, setCombinedRangeDialogOpen] = useState(false);
  const [combinedBatchDialogOpen, setCombinedBatchDialogOpen] = useState(false);
  const [combinedDayStates, setCombinedDayStates] = useState(() => createRandomCalendarDayStates());
  const [combinedPlannedRange, setCombinedPlannedRange] = useState<RandomCalendarRange>({
    startDate: null,
    endDate: null,
  });

  const handleAction = async (label: string) => {
    setActionText(t('running', { label }));
    await sleep(900);
    setActionText(t('latestAction', { label }));
  };

  const handleCopyIconUsage = async (iconName: string) => {
    const usageText = iconName;

    try {
      const copied = await copyText(usageText);

      if (!copied) {
        throw new Error('Copy failed in both Clipboard API and fallback path');
      }

      setCopiedIconName(iconName);
      setCopyToastText(t('copied', { name: iconName }));
      setActionText(t('copiedIconUsage', { usage: usageText }));
      window.setTimeout(() => {
        setCopiedIconName((current) => (current === iconName ? null : current));
      }, 1600);
      window.setTimeout(() => {
        setCopyToastText((current) => (current === t('copied', { name: iconName }) ? null : current));
      }, 1800);
    } catch (error) {
      console.error('Copy icon usage failed:', error);
      setActionText(t('copyFailed', { usage: usageText }));
      setCopyToastText(t('copyFailedRetry'));
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
  const calendarOnlySelectedState = calendarOnlyDayStates.get(calendarOnlySelectedDate);
  const combinedSelectedState = combinedDayStates.get(combinedSelectedDate);
  const combinedAllocatedPlanDates = buildPlannedDatesSkippingSaved(combinedPlannedRange, combinedDayStates);
  const combinedPlannedDates = combinedAllocatedPlanDates.filter(
    (date) => combinedDayStates.get(date)?.key === 'planned'
  );

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
              {t('badge')}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{t('title')}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              {t('description')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start md:justify-end">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent">
              {allSectionsExpanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
              {allSectionsExpanded ? t('collapseAll') : t('expandAll')}
            </span>
          </div>
        </button>
        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full border border-emerald-300/70 bg-emerald-100 px-3 py-1 font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            {t('iconTotal', { count: iconEntries.length })}
          </span>
          <span className="rounded-full border border-sky-300/70 bg-sky-100 px-3 py-1 font-medium text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
            {t('buttonVariants')}
          </span>
        </div>
      </section>

      <CollapsibleSection
        title={t('randomCalendar.title')}
        description={t('randomCalendar.description')}
        isExpanded={expandedSections['random-calendar']}
        onToggle={() => handleToggleSection('random-calendar')}
        collapseLabel={t('collapse')}
        expandLabel={t('expand')}
        className="relative z-30"
      >
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          <div className={compareCardClass}>
            <div className="mb-3 text-sm font-medium text-foreground">{t('randomCalendar.rangeOnlyTitle')}</div>
            <p className="mb-4 text-xs leading-6 text-muted-foreground">
              {t('randomCalendar.rangeOnlyDescription')}
            </p>
            <CalendarDateRangeInput
              value={rangeOnlyValue}
              onChange={(range) => {
                setRangeOnlyValue(range);
                setActionText(`CalendarDateRangeInput: ${getRangeSummary(range)}`);
              }}
              placeholder={t('randomCalendar.rangePlaceholder')}
              defaultRangeDays={10}
              showDayCount={true}
              dayCountUnit='D'
              themedCalendarIcon={true}
              clearPressFeedback="subtle"
            />
          </div>

          <div className={cn(compareCardClass, 'xl:col-span-2')}>
            <div className="mb-3 text-sm font-medium text-foreground">{t('randomCalendar.calendarOnlyTitle')}</div>
            <p className="mb-4 text-xs leading-6 text-muted-foreground">
              {t('randomCalendar.calendarOnlyDescription')}
            </p>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
              <CalendarStatusView
                selectedDate={calendarOnlySelectedDate}
                dayStates={calendarOnlyDayStates}
                onSelectedDateChange={setCalendarOnlySelectedDate}
              />
              <div className="flex min-h-48 flex-col justify-between rounded-2xl border border-border/60 bg-background/70 p-4">
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground">Selected Date</div>
                  <div className="mt-2 text-2xl font-semibold text-foreground">{calendarOnlySelectedDate}</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {t('randomCalendar.currentState', { state: calendarOnlySelectedState?.key ?? 'empty' })}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {([
                      { key: 'saved', tone: 'saved', label: t('randomCalendar.setSaved') },
                      { key: 'planned', tone: 'planned', label: t('randomCalendar.setPlanned') },
                      { key: 'warning', tone: 'warning', label: t('randomCalendar.setWarning') },
                    ] as const).map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setCalendarOnlyDayStates((current) =>
                            setCalendarDateState(current, calendarOnlySelectedDate, {
                              key: item.key,
                              tone: item.tone,
                              title: `${calendarOnlySelectedDate}: ${item.key}`,
                            })
                          );
                          setActionText(`CalendarStatusView: ${calendarOnlySelectedDate} -> ${item.key}`);
                        }}
                        className="rounded-2xl border border-border/60 bg-background/80 px-3 py-2 text-xs font-medium text-foreground transition hover:bg-accent"
                      >
                        {item.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setCalendarOnlyDayStates((current) => setCalendarDateState(current, calendarOnlySelectedDate, null));
                        setActionText(t('randomCalendar.clearAction', { date: calendarOnlySelectedDate }));
                      }}
                      className="rounded-2xl border border-border/60 bg-background/80 px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-accent"
                    >
                      {t('randomCalendar.clearStatus')}
                    </button>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" />Saved</span>
                    <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" />Planned</span>
                    <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-orange-500" />Needs review</span>
                  </div>
                </div>
                <div className={codeHintClass}>
                  {`selectedDate="${calendarOnlySelectedDate}"`}
                </div>
              </div>
            </div>
          </div>

          <div className={cn(compareCardClass, 'xl:col-span-3')}>
            <div className="mb-3 text-sm font-medium text-foreground">{t('randomCalendar.combinedTitle')}</div>
            <p className="mb-4 text-xs leading-6 text-muted-foreground">
              {t('randomCalendar.combinedDescription')}
            </p>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
              <CalendarStatusView
                selectedDate={combinedSelectedDate}
                dayStates={combinedDayStates}
                action={{
                  icon:
                    combinedPlannedDates.length > 0 ? (
                      <CalendarClockIcon className="h-4 w-4" />
                    ) : (
                      <CalendarDaysIcon className="h-4 w-4" />
                    ),
                  label: 'Plan range',
                  title: combinedPlannedDates.length > 0 ? 'Batch planned dates' : 'Plan range',
                  onPress: () => {
                    if (combinedPlannedDates.length > 0) {
                      setCombinedBatchDialogOpen(true);
                      return;
                    }

                    setCombinedRangeDialogOpen(true);
                  },
                }}
                onSelectedDateChange={setCombinedSelectedDate}
              />
              <div className="flex min-h-72 flex-col justify-between rounded-2xl border border-border/60 bg-background/70 p-4">
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground">Review Focus</div>
                  <div className="mt-2 text-2xl font-semibold text-foreground">{combinedSelectedDate}</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {t('randomCalendar.currentState', { state: combinedSelectedState?.key ?? 'empty' })}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCombinedDayStates((current) =>
                          setCalendarDateState(current, combinedSelectedDate, {
                            key: 'saved',
                            tone: 'saved',
                            title: `${combinedSelectedDate}: saved after review`,
                          })
                        );
                        setActionText(t('randomCalendar.saveAction', { date: combinedSelectedDate }));
                      }}
                      className="rounded-2xl border border-emerald-300/70 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                    >
                      {t('randomCalendar.saveCurrentDay')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCombinedDayStates((current) => setCalendarDateState(current, combinedSelectedDate, null));
                        setActionText(t('randomCalendar.clearAction2', { date: combinedSelectedDate }));
                      }}
                      className="rounded-2xl border border-border/60 bg-background/80 px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-accent"
                    >
                      {t('randomCalendar.clearCurrentDay')}
                    </button>
                  </div>
                  <div className="mt-4 rounded-2xl border border-dashed border-border/70 bg-background/70 px-3 py-2 text-xs leading-5 text-muted-foreground">
                    Planned range: {getRangeSummary(combinedPlannedRange)}
                    <br />
                    Allocated plan days: {combinedAllocatedPlanDates.length}
                  </div>
                  {combinedPlannedDates.length > 0 ? (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {combinedPlannedDates.slice(0, 8).map((date) => (
                        <button
                          key={date}
                          type="button"
                          onClick={() => setCombinedSelectedDate(date)}
                          className={cn(
                            'rounded-2xl border px-3 py-2 text-left text-xs transition hover:bg-accent',
                            date === combinedSelectedDate
                              ? 'border-primary/50 bg-primary/8 text-foreground'
                              : 'border-border/60 bg-background/70 text-muted-foreground'
                          )}
                        >
                          {date}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-border/70 bg-background/70 px-3 py-6 text-center text-xs text-muted-foreground">
                      {t('randomCalendar.noPlannedDates')}
                    </div>
                  )}
                </div>
                <div className={codeHintClass}>
                  {`import { CalendarStatusView, RandomDateRangeDialog } from '@third-ui/main/calendar';`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title={t('alert.title')}
        description={t('alert.description')}
        isExpanded={expandedSections['alert-dialog']}
        onToggle={() => handleToggleSection('alert-dialog')}
        collapseLabel={t('collapse')}
        expandLabel={t('expand')}
        className="relative z-20"
      >
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className={compareCardClass}>
            <div className="mb-3 text-sm font-medium text-foreground">AdsAlertDialog</div>
            <p className="mb-4 text-xs leading-6 text-muted-foreground">
              {t('alert.adsDescription')}
            </p>
            <XButton
              type="single"
              variant="subtle"
              minWidth="min-w-0"
              className={dialogDemoButtonClass}
              button={{
                icon: <BellIcon />,
                text: t('alert.openAds'),
                onClick: () => setActiveDialogDemo('ads'),
              }}
            />
          </div>

          <div className={compareCardClass}>
            <div className="mb-3 text-sm font-medium text-foreground">InfoDialog</div>
            <p className="mb-4 text-xs leading-6 text-muted-foreground">
              {t('alert.infoDescription')}
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
            <div className="mb-3 text-sm font-medium text-foreground">{t('alert.confirmBaseTitle')}</div>
            <p className="mb-4 text-xs leading-6 text-muted-foreground">
              {t('alert.confirmBaseDescription')}
            </p>
            <div className="flex flex-wrap gap-2">
              <XButton
                type="single"
                variant="subtle"
                minWidth="min-w-0"
                className={dialogDemoButtonClass}
                button={{ icon: <CircleQuestionMarkIcon />, text: t('alert.normalConfirm'), onClick: () => setActiveDialogDemo('confirm-normal') }}
              />
              <XButton
                type="single"
                variant="subtle"
                minWidth="min-w-0"
                className={dialogDangerDemoButtonClass}
                button={{ icon: <CircleQuestionMarkIcon />, text: t('alert.reversedConfirm'), onClick: () => setActiveDialogDemo('confirm-normal-reversed') }}
              />
              <XButton
                type="single"
                variant="subtle"
                minWidth="min-w-0"
                className={dialogDangerDemoButtonClass}
                button={{ icon: <CircleAlertIcon />, text: t('alert.dangerConfirm'), onClick: () => setActiveDialogDemo('confirm-danger') }}
              />
              <XButton
                type="single"
                variant="subtle"
                minWidth="min-w-0"
                className={dialogDangerDemoButtonClass}
                button={{
                  icon: <CircleAlertIcon />,
                  text: t('alert.countdownDelete'),
                  onClick: () => setActiveDialogDemo('undoable-confirm'),
                }}
              />
            </div>
          </div>

          <div className={compareCardClass}>
            <div className="mb-3 text-sm font-medium text-foreground">{t('alert.highPriorityTitle')}</div>
            <p className="mb-4 text-xs leading-6 text-muted-foreground">
              {t('alert.highPriorityDescription')}
            </p>
            <XButton
              type="single"
              variant="subtle"
              minWidth="min-w-0"
              className={cn(dialogDemoButtonClass, themeIconColor, 'border-current bg-primary/5 hover:bg-primary/10')}
              button={{
                icon: <FAQSIcon />,
                text: t('alert.openHighPriority'),
                onClick: () => setActiveDialogDemo('high-priority'),
              }}
            />
          </div>

          <div className={cn(compareCardClass, 'lg:col-span-2')}>
            <div className="mb-3 text-sm font-medium text-foreground">{t('alert.loadingTitle')}</div>
            <p className="mb-4 text-xs leading-6 text-muted-foreground">
              {t('alert.loadingDescription')}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <XButton
                type="single"
                variant="subtle"
                minWidth="min-w-0"
                className={dialogDemoButtonClass}
                button={{ icon: <BadgeInfoIcon />, text: 'Info confirm', onClick: () => setActiveDialogDemo('info-loading') }}
              />
              <XButton
                type="single"
                variant="subtle"
                minWidth="min-w-0"
                className={dialogDemoButtonClass}
                button={{ icon: <CircleQuestionMarkIcon />, text: 'Confirm action', onClick: () => setActiveDialogDemo('confirm-loading-confirm') }}
              />
              <XButton
                type="single"
                variant="subtle"
                minWidth="min-w-0"
                className={dialogDangerDemoButtonClass}
                button={{ icon: <CircleQuestionMarkIcon />, text: 'Cancel action', onClick: () => setActiveDialogDemo('confirm-loading-cancel') }}
              />
              <XButton
                type="single"
                variant="subtle"
                minWidth="min-w-0"
                className={cn(dialogDemoButtonClass, themeIconColor, 'border-current bg-primary/5 hover:bg-primary/10')}
                button={{
                  icon: <FAQSIcon />,
                  text: 'High priority',
                  onClick: () => setActiveDialogDemo('high-priority-loading'),
                }}
              />
            </div>
            <div className={codeHintClass}>
              {`loadingActions={['confirm']} / loadingActions={['cancel']}`}
            </div>
          </div>

          <div className={cn(compareCardClass, 'lg:col-span-2')}>
            <div className="mb-3 text-sm font-medium text-foreground">UndoableConfirmDialog Loading Action</div>
            <p className="mb-4 text-xs leading-6 text-muted-foreground">
              {t('alert.undoableLoadingDescription')}
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <XButton
                type="single"
                variant="subtle"
                minWidth="min-w-0"
                className={dialogDangerDemoButtonClass}
                button={{
                  icon: <CircleAlertIcon />,
                  text: t('alert.countdownConfirmLoading'),
                  onClick: () => setActiveDialogDemo('undoable-loading-confirm'),
                }}
              />
              <XButton
                type="single"
                variant="subtle"
                minWidth="min-w-0"
                className={dialogDemoButtonClass}
                button={{
                  icon: <CircleAlertIcon />,
                  text: t('alert.countdownUndoLoading'),
                  onClick: () => setActiveDialogDemo('undoable-loading-undo'),
                }}
              />
              <XButton
                type="single"
                variant="subtle"
                minWidth="min-w-0"
                className={dialogDangerDemoButtonClass}
                button={{
                  icon: <CircleAlertIcon />,
                  text: t('alert.countdownBothLoading'),
                  onClick: () => setActiveDialogDemo('undoable-loading-both'),
                }}
              />
            </div>
            <div className={codeHintClass}>
              {t('alert.undoableHint')}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title={t('icons.title')}
        description={t('icons.description')}
        isExpanded={expandedSections['global-icon']}
        onToggle={() => handleToggleSection('global-icon')}
        collapseLabel={t('collapse')}
        expandLabel={t('expand')}
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
                placeholder={t('icons.placeholder')}
                className={cn(
                  'h-11 w-full rounded-2xl border border-border/60 bg-background/80 pl-10 pr-4 text-sm text-foreground outline-none transition focus-visible:ring-2',
                  themeIconColor,
                  'focus:border-current focus-visible:border-current focus-visible:ring-current/30'
                )}
              />
            </label>
            <div className="text-sm text-muted-foreground">
              {t('icons.matches', { count: filteredIconEntries.length, total: iconEntries.length })}
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
                  title={t('icons.copyTitle', { name: iconName })}
                >
                  <div
                    className={cn(
                      'absolute right-2 top-2 rounded-full border px-2 py-0.5 text-[10px] transition-opacity',
                      copiedIconName === iconName
                        ? 'border-emerald-300/70 bg-emerald-100 text-emerald-700 opacity-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'border-border/70 bg-background/90 text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                    )}
                  >
                    {copiedIconName === iconName ? t('icons.copied') : t('icons.clickToCopy')}
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
              {t('icons.empty', { value: iconSearchValue })}
            </div>
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title={t('gradient.title')}
        description={t('gradient.description')}
        isExpanded={expandedSections['gradient-button']}
        onToggle={() => handleToggleSection('gradient-button')}
        collapseLabel={t('collapse')}
        expandLabel={t('expand')}
      >
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="mb-3 text-sm font-medium text-foreground">{t('gradient.levels')}</div>
            <div className="flex flex-col gap-3">
              <GradientButton className={gradientButtonDemoClass} title={t('gradient.default')} onClick={() => handleAction('GradientButton default gradient button')} />
              <GradientButton className={gradientButtonDemoClass} title={t('gradient.soft')} variant="soft" onClick={() => handleAction('GradientButton soft button')} />
              <GradientButton className={gradientButtonDemoClass} title={t('gradient.subtle')} variant="subtle" onClick={() => handleAction('GradientButton subtle button')} />
              <GradientButton className={gradientButtonDemoClass} title={t('gradient.link')} href="#" openInNewTab={false} />
              <GradientButton className={gradientButtonDemoClass} title={t('gradient.softLink')} href="#" openInNewTab={false} variant="soft" />
              <GradientButton className={gradientButtonDemoClass} title={t('gradient.subtleLink')} href="#" openInNewTab={false} variant="subtle" />
              <GradientButton className={gradientButtonCustomClass} title={t('gradient.customSubtle')} onClick={() => handleAction('GradientButton custom subtle button')}  variant="subtle" icon={false} />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="mb-3 text-sm font-medium text-foreground">{t('gradient.iconAlignDisabled')}</div>
            <div className="space-y-4">
              <GradientButton
                title={t('gradient.leftIcon')}
                align="left"
                className={gradientButtonDemoClass}
                icon={<RocketIcon />}
                onClick={() => handleAction('GradientButton left aligned with icon')}
              />
              <GradientButton
                title={t('gradient.centerSoft')}
                align="center"
                variant="soft"
                className={gradientButtonDemoClass}
                icon={<SparklesIcon />}
                onClick={() => handleAction('GradientButton centered soft')}
              />
              <GradientButton
                title={t('gradient.centerSubtle')}
                align="center"
                variant="subtle"
                className={gradientButtonDemoClass}
                icon={<AlbumIcon />}
                onClick={() => handleAction('GradientButton centered subtle')}
              />
              <GradientButton
                title={t('gradient.rightDisabled')}
                align="right"
                disabled
                className={gradientButtonDemoClass}
                icon={<ShieldIcon />}
                onClick={() => handleAction('GradientButton disabled state')}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/70 p-4 lg:col-span-2">
            <div className="mb-3 text-sm font-medium text-foreground">{t('gradient.pressFeedback')}</div>
            <p className="mb-4 text-xs leading-6 text-muted-foreground">
              {t('gradient.pressDescription')}
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <GradientButton
                className={gradientButtonDemoClass}
                title={t('gradient.defaultSubtleFeedback')}
                onClick={() => handleAction('GradientButton pressFeedback default subtle')}
              />
              <GradientButton
                className={gradientButtonDemoClass}
                title={t('gradient.solidFeedback')}
                pressFeedback="solid"
                variant="soft"
                onClick={() => handleAction('GradientButton pressFeedback solid')}
              />
              <GradientButton
                className={gradientButtonDemoClass}
                title={t('gradient.noneFeedback')}
                pressFeedback="none"
                variant="subtle"
                onClick={() => handleAction('GradientButton pressFeedback none')}
              />
              <GradientButton
                className={gradientButtonDemoClass}
                title={t('gradient.linkSubtleFeedback')}
                href="#"
                openInNewTab={false}
                variant="subtle"
              />
              <GradientButton
                className={gradientButtonDemoClass}
                title={t('gradient.linkSolidFeedback')}
                href="#"
                openInNewTab={false}
                pressFeedback="solid"
                variant="soft"
              />
              <GradientButton
                className={gradientButtonDemoClass}
                title={t('gradient.disabledNoFeedback')}
                disabled
                pressFeedback="solid"
                icon={<ShieldIcon />}
                onClick={() => handleAction('GradientButton disabled no feedback')}
              />
            </div>
            <div className={codeHintClass}>
              {`<GradientButton pressFeedback="solid" /> / <GradientButton pressFeedback="none" />`}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title={t('xbutton.title')}
        description={t('xbutton.description')}
        isExpanded={expandedSections['x-button']}
        onToggle={() => handleToggleSection('x-button')}
        collapseLabel={t('collapse')}
        expandLabel={t('expand')}
        className="relative z-10"
      >
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="mb-3 text-sm font-medium text-foreground">{t('xbutton.singleMode')}</div>
            <div className="flex flex-col gap-3">
              <XButton
                type="single"
                button={{
                  icon: <DownloadIcon />,
                  text: t('xbutton.defaultSingle'),
                  onClick: () => handleAction('XButton default single'),
                }}
                className={xButtonSingleDemoClass}
              />
              <XButton
                type="single"
                variant="soft"
                button={{
                  icon: <BadgeQuestionMarkIcon />,
                  text: t('xbutton.softSingle'),
                  onClick: () => handleAction('XButton soft single'),
                }}
                className={xButtonSingleDemoClass}
              />
              <XButton
                type="single"
                variant="subtle"
                button={{
                  icon: <AlbumIcon />,
                  text: t('xbutton.subtleSingle'),
                  onClick: () => handleAction('XButton subtle single'),
                }}
                className={xButtonSingleDemoClass}
              />
              <XButton
                type="single"
                button={{
                  icon: <ShieldIcon />,
                  text: t('xbutton.disabledSingle'),
                  onClick: () => handleAction('XButton disabled single'),
                  disabled: true,
                }}
                className={xButtonSingleDemoClass}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="mb-3 text-sm font-medium text-foreground">{t('xbutton.splitMode')}</div>
            <div className="flex flex-col gap-3">
              <XButton
                type="split"
                mainButton={{
                  icon: <RocketIcon />,
                  text: t('xbutton.defaultSplit'),
                  onClick: () => handleAction('XButton default split main button'),
                }}
                mainButtonClassName={xButtonSplitMainDemoClass}
                dropdownButtonClassName={xButtonSplitDropdownDemoClass}
                menuItems={[
                  {
                    icon: <CopyIcon className="mr-2 h-4 w-4" />,
                    text: t('xbutton.copyLink'),
                    onClick: () => handleAction('XButton default split copy link'),
                  },
                  {
                    icon: <ExternalLinkIcon className="mr-2 h-4 w-4" />,
                    text: t('xbutton.openDetails'),
                    onClick: () => handleAction('XButton default split open details'),
                  },
                  {
                    icon: <ShieldIcon className="mr-2 h-4 w-4" />,
                    text: t('xbutton.protectedAction'),
                    onClick: () => handleAction('XButton default split protected action'),
                    splitTopBorder: true,
                    tag: { text: t('xbutton.recommended') },
                  },
                ]}
              />
              <XButton
                type="split"
                variant="soft"
                mainButton={{
                  icon: <SparklesIcon />,
                  text: t('xbutton.softSplit'),
                  onClick: () => handleAction('XButton soft split main button'),
                }}
                mainButtonClassName={xButtonSplitMainDemoClass}
                dropdownButtonClassName={xButtonSplitDropdownDemoClass}
                menuItems={[
                  {
                    icon: <MailIcon className="mr-2 h-4 w-4" />,
                    text: t('xbutton.sendNotification'),
                    onClick: () => handleAction('XButton soft split send notification'),
                  },
                  {
                    icon: <SettingsIcon className="mr-2 h-4 w-4" />,
                    text: t('xbutton.openSettings'),
                    onClick: () => handleAction('XButton soft split open settings'),
                  },
                  {
                    icon: <BugIcon className="mr-2 h-4 w-4" />,
                    text: t('xbutton.debugEntry'),
                    onClick: () => handleAction('XButton soft split debug entry'),
                    tag: { text: t('xbutton.testTag'), color: '#0EA5E9' },
                  },
                ]}
              />
              <XButton
                type="split"
                variant="subtle"
                mainButton={{
                  icon: <AlbumIcon />,
                  text: t('xbutton.subtleSplit'),
                  onClick: () => handleAction('XButton subtle split main button'),
                }}
                mainButtonClassName={xButtonSplitMainDemoClass}
                dropdownButtonClassName={xButtonSplitDropdownDemoClass}
                menuItems={[
                  {
                    icon: <MailIcon className="mr-2 h-4 w-4" />,
                    text: t('xbutton.sendEmail'),
                    onClick: () => handleAction('XButton subtle split send email'),
                  },
                  {
                    icon: <SettingsIcon className="mr-2 h-4 w-4" />,
                    text: t('xbutton.adjustConfig'),
                    onClick: () => handleAction('XButton subtle split adjust config'),
                  },
                ]}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/70 p-4 lg:col-span-2">
            <div className="mb-3 text-sm font-medium text-foreground">{t('gradient.pressFeedback')}</div>
            <p className="mb-4 text-xs leading-6 text-muted-foreground">
              {t('xbutton.pressDescription')}
            </p>
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="grid gap-3 sm:grid-cols-3">
                <XButton
                  type="single"
                  variant="subtle"
                  button={{
                    icon: <HandHeartIcon />,
                    text: t('xbutton.defaultSubtle'),
                    onClick: () => handleAction('XButton pressFeedback default subtle'),
                  }}
                  className={xButtonSingleDemoClass}
                />
                <XButton
                  type="single"
                  variant="soft"
                  pressFeedback="solid"
                  button={{
                    icon: <ZapIcon />,
                    text: t('xbutton.solidStrong'),
                    onClick: () => handleAction('XButton pressFeedback solid'),
                  }}
                  className={xButtonSingleDemoClass}
                />
                <XButton
                  type="single"
                  pressFeedback={false}
                  button={{
                    icon: <ShieldIcon />,
                    text: t('xbutton.feedbackOff'),
                    onClick: () => handleAction('XButton pressFeedback false'),
                  }}
                  className={xButtonSingleDemoClass}
                />
              </div>

              <XButton
                type="split"
                variant="subtle"
                pressFeedback="solid"
                mainButton={{
                  icon: <RocketIcon />,
                  text: t('xbutton.solidSplitFeedback'),
                  onClick: () => handleAction('XButton pressFeedback solid split main button'),
                }}
                mainButtonClassName={xButtonSplitMainDemoClass}
                dropdownButtonClassName={xButtonSplitDropdownDemoClass}
                menuItems={[
                  {
                    icon: <CopyIcon className="mr-2 h-4 w-4" />,
                    text: t('xbutton.copyCurrentState'),
                    onClick: () => handleAction('XButton pressFeedback solid split copy current state'),
                  },
                  {
                    icon: <ExternalLinkIcon className="mr-2 h-4 w-4" />,
                    text: t('xbutton.openTestNotes'),
                    onClick: () => handleAction('XButton pressFeedback solid split open test notes'),
                  },
                ]}
              />
            </div>
            <div className={codeHintClass}>
              {`<XButton pressFeedback="solid" /> / <XButton pressFeedback={false} />`}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title={t('toggle.title')}
        description={t('toggle.description')}
        isExpanded={expandedSections['x-toggle-button']}
        onToggle={() => handleToggleSection('x-toggle-button')}
        collapseLabel={t('collapse')}
        expandLabel={t('expand')}
        className="relative z-10"
      >
        <div className="mt-5 flex flex-col gap-4">
          <div className={compareCardClass}>
            <div className="mb-3 text-sm font-medium text-foreground">{t('toggle.billingStyle')}</div>
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
            <div className="mb-3 text-sm font-medium text-foreground">{t('toggle.preview')}</div>
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
                      onClick: () => handleAction('Toggle / icon-only search button'),
                    }}
                    className={iconButtonDemoClass}
                    minWidth="min-w-0"
                  />
                  <XButton
                    type="single"
                    button={{
                      icon: <HandHeartIcon />,
                      text: '',
                      onClick: () => handleAction('Toggle / icon-only like button'),
                    }}
                    className={iconButtonDemoClass}
                    minWidth="min-w-0"
                  />
                  <XButton
                    type="single"
                    button={{
                      icon: <ShieldUserIcon />,
                      text: '',
                      onClick: () => handleAction('Toggle / icon-only share button'),
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
                      onClick: () => handleAction('Toggle / text Cancel button'),
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
                      onClick: () => handleAction('Toggle / text Forgot password button'),
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
                      onClick: () => handleAction('Toggle / text View details button'),
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
                    onClick={() => handleAction('Toggle / accent Upgrade Now button')}
                  />
                  <XButton
                    type="single"
                    variant="soft"
                    button={{
                      icon: <SparklesIcon />,
                      text: 'Try Pro',
                      onClick: () => handleAction('Toggle / accent Try Pro button'),
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
            <div className="mb-3 text-sm font-medium text-foreground">{t('toggle.webStyle')}</div>
            <p className="mb-4 text-xs text-muted-foreground">{t('toggle.mobileIconDescription')}</p>
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
        title={t('pill.title')}
        description={t('pill.description')}
        isExpanded={expandedSections['pill-select']}
        onToggle={() => handleToggleSection('pill-select')}
        collapseLabel={t('collapse')}
        expandLabel={t('expand')}
        className="relative z-0"
      >
        <div className="mt-5 grid gap-4">
          <div className={fieldCardClass}>
            <div className="mb-3 text-sm font-medium text-foreground">{t('pill.single')}</div>
            <div className="grid gap-3 lg:grid-cols-2">
              <div className={compareCardClass}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Default</div>
                <XPillSelect
                  mode="single"
                  value={singleValue}
                  onChange={setSingleValue}
                  options={pillOptions}
                  emptyLabel={t('pill.chooseDirection')}
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
                  emptyLabel={t('pill.compactSingle')}
                  allowClear
                />
                <div className={codeHintClass}>
                  {`<XPillSelect mode="single" size="compact" allowClear />`}
                </div>
              </div>
            </div>
          </div>

          <div className={fieldCardClass}>
            <div className="mb-3 text-sm font-medium text-foreground">{t('pill.multiple')}</div>
            <div className="grid gap-3 xl:grid-cols-3">
              <div className={compareCardClass}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Default / Full Pills</div>
                <XPillSelect
                  mode="multiple"
                  value={multiPlainValue}
                  onChange={setMultiPlainValue}
                  options={pillOptions}
                  emptyLabel={t('pill.unlimited')}
                  allSelectedLabel={t('pill.allDirections')}
                  allowClear
                />
                <div className={codeHintClass}>
                  {`<XPillSelect mode="multiple" allSelectedLabel="${t('pill.allDirections')}" />`}
                </div>
              </div>
              <div className={compareCardClass}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Default</div>
                <XPillSelect
                  mode="multiple"
                  value={multiValue}
                  onChange={setMultiValue}
                  options={pillOptions}
                  emptyLabel={t('pill.chooseTags')}
                  allSelectedLabel={t('pill.allDirections')}
                  maxVisiblePills={2}
                  allowClear
                />
                <div className={codeHintClass}>
                  {`<XPillSelect mode="multiple" allSelectedLabel="${t('pill.allDirections')}" maxVisiblePills={2} />`}
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
                  emptyLabel={t('pill.compactMultiple')}
                  allSelectedLabel={t('pill.allDirections')}
                  maxVisiblePills={1}
                  allowClear
                />
                <div className={codeHintClass}>
                  {`<XPillSelect mode="multiple" size="compact" allSelectedLabel="${t('pill.allDirections')}" maxVisiblePills={1} />`}
                </div>
              </div>
            </div>
          </div>

          <div className={fieldCardClass}>
            <div className="mb-3 text-sm font-medium text-foreground">{t('pill.formFilter')}</div>
            <div className="grid gap-3 lg:grid-cols-2">
              <div className={compareCardClass}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">XFormPills</div>
                <XFormPills
                  label={t('pill.moduleLabel')}
                  value={formValue}
                  options={pillOptions}
                  onChange={setFormValue}
                  emptyLabel={t('pill.chooseModule')}
                  allowClear
                />
                <div className={codeHintClass}>
                  {`<XFormPills label="${t('pill.moduleLabel')}" allowClear />`}
                </div>
              </div>
              <div className={compareCardClass}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">XFilterPills</div>
                <XFilterPills
                  label={t('pill.filterDirection')}
                  value={filterValue}
                  options={pillOptions}
                  onChange={setFilterValue}
                  allLabel={t('pill.all')}
                />
                <div className={codeHintClass}>
                  {`<XFilterPills label="${t('pill.filterDirection')}" allLabel="${t('pill.all')}" />`}
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
                  placeholder={t('pill.tokenPlaceholder')}
                  emptyLabel={t('pill.tokenEmpty')}
                />
                <div className={codeHintClass}>
                  {`<XTokenInput size="default" placeholder="${t('pill.tokenPlaceholder')}" />`}
                </div>
              </div>
              <div className={compareCardClass}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Compact</div>
                <XTokenInput
                  size="compact"
                  value={tokenCompactValue}
                  onChange={setTokenCompactValue}
                  placeholder={t('pill.tokenCompactPlaceholder')}
                  emptyLabel={t('pill.tokenCompactEmpty')}
                />
                <div className={codeHintClass}>
                  {`<XTokenInput size="compact" placeholder="${t('pill.tokenCompactPlaceholder')}" />`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <section className={cn(panelClass, 'relative z-0')}>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className={sectionTitleClass}>{t('interaction.title')}</h2>
            <p className={sectionDescClass}>{t('interaction.description')}</p>
          </div>
          <div className="rounded-full border border-amber-300/70 bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            {t('currentStatus', { status: actionText })}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-dashed border-border/70 bg-background/60 p-4 text-sm leading-7 text-muted-foreground">
          {t('interaction.extensionNote')}
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
        description={t('dialogs.adsDescription')}
        imgSrc="https://r2.d8ger.com/default.webp"
        imgHref="https://r2.d8ger.com/default.webp"
        cancelText="Later"
        confirmText="View Image"
        onCancel={() => setActionText(t('dialogs.adsCancelAction'))}
        onConfirm={() => setActionText(t('dialogs.adsConfirmAction'))}
      />

      <InfoDialog
        open={activeDialogDemo === 'info-info'}
        onOpenChange={(open) => setActiveDialogDemo(open ? 'info-info' : null)}
        type="info"
        title="Information"
        description={t('dialogs.infoDescription')}
        confirmText="Got it"
        onConfirm={() => setActionText(t('dialogs.infoConfirm'))}
      />
      <InfoDialog
        open={activeDialogDemo === 'info-warn'}
        onOpenChange={(open) => setActiveDialogDemo(open ? 'info-warn' : null)}
        type="warn"
        title="Warning"
        description={t('dialogs.warnDescription')}
        confirmText="I understand"
        onConfirm={() => setActionText(t('dialogs.warnConfirm'))}
      />
      <InfoDialog
        open={activeDialogDemo === 'info-success'}
        onOpenChange={(open) => setActiveDialogDemo(open ? 'info-success' : null)}
        type="success"
        title="Success"
        description={t('dialogs.successDescription')}
        confirmText="Done"
        onConfirm={() => setActionText(t('dialogs.successConfirm'))}
      />
      <InfoDialog
        open={activeDialogDemo === 'info-error'}
        onOpenChange={(open) => setActiveDialogDemo(open ? 'info-error' : null)}
        type="error"
        title="Error"
        description={t('dialogs.errorDescription')}
        confirmText="Close"
        onConfirm={() => setActionText(t('dialogs.errorConfirm'))}
      />
      <InfoDialog
        open={activeDialogDemo === 'info-loading'}
        onOpenChange={(open) => setActiveDialogDemo(open ? 'info-loading' : null)}
        type="info"
        title="Run loading demo?"
        description={t('dialogs.infoLoadingDescription')}
        confirmText="Got it"
        loadingActions={['confirm']}
        onConfirm={async () => {
          setActionText(t('dialogs.loadingStart', { source: 'InfoDialog: confirm' }));
          await sleep(DIALOG_LOADING_DEMO_DELAY_MS);
          setActionText(t('dialogs.loadingDone', { source: 'InfoDialog: confirm' }));
        }}
      />

      <ConfirmDialog
        open={activeDialogDemo === 'confirm-normal'}
        onOpenChange={(open) => setActiveDialogDemo(open ? 'confirm-normal' : null)}
        type="normal"
        title="Apply changes?"
        description={t('dialogs.normalDescription')}
        cancelText="Cancel"
        confirmText="Apply"
        onCancel={() => setActionText(t('dialogs.normalCancel'))}
        onConfirm={() => setActionText(t('dialogs.normalConfirm'))}
      />
      <ConfirmDialog
        open={activeDialogDemo === 'confirm-danger'}
        onOpenChange={(open) => setActiveDialogDemo(open ? 'confirm-danger' : null)}
        type="danger"
        title="Delete this item?"
        description={t('dialogs.dangerDescription')}
        cancelText="Cancel"
        confirmText="Delete"
        onCancel={() => setActionText(t('dialogs.dangerCancel'))}
        onConfirm={() => setActionText(t('dialogs.dangerConfirm'))}
      />
      <ConfirmDialog
        open={activeDialogDemo === 'confirm-normal-reversed'}
        onOpenChange={(open) => setActiveDialogDemo(open ? 'confirm-normal-reversed' : null)}
        type="normal"
        title="Apply generated result?"
        description={t('dialogs.reversedDescription')}
        cancelText="Discard Result"
        confirmText="Apply"
        emphasis="cancel"
        onCancel={() => setActionText(t('dialogs.reversedCancel'))}
        onConfirm={() => setActionText(t('dialogs.reversedConfirm'))}
      />
      <ConfirmDialog
        open={activeDialogDemo === 'confirm-loading-confirm'}
        onOpenChange={(open) => setActiveDialogDemo(open ? 'confirm-loading-confirm' : null)}
        type="normal"
        title="Apply changes with loading?"
        description={t('dialogs.confirmLoadingDescription')}
        cancelText="Cancel"
        confirmText="Apply"
        loadingActions={['confirm']}
        onCancel={() => setActionText(t('dialogs.confirmLoadingCancel'))}
        onConfirm={async () => {
          setActionText(t('dialogs.loadingStart', { source: 'ConfirmDialog: confirm' }));
          await sleep(DIALOG_LOADING_DEMO_DELAY_MS);
          setActionText(t('dialogs.loadingDone', { source: 'ConfirmDialog: confirm' }));
        }}
      />
      <ConfirmDialog
        open={activeDialogDemo === 'confirm-loading-cancel'}
        onOpenChange={(open) => setActiveDialogDemo(open ? 'confirm-loading-cancel' : null)}
        type="normal"
        title="Discard generated result?"
        description={t('dialogs.cancelLoadingDescription')}
        cancelText="Discard Result"
        confirmText="Apply"
        emphasis="cancel"
        loadingActions={['cancel']}
        onCancel={async () => {
          setActionText(t('dialogs.loadingStart', { source: 'ConfirmDialog: cancel' }));
          await sleep(DIALOG_LOADING_DEMO_DELAY_MS);
          setActionText(t('dialogs.loadingDone', { source: 'ConfirmDialog: cancel' }));
        }}
        onConfirm={() => setActionText(t('dialogs.cancelLoadingApply'))}
      />

      <UndoableConfirmDialog
        open={activeDialogDemo === 'undoable-confirm'}
        onOpenChange={(open) => setActiveDialogDemo(open ? 'undoable-confirm' : null)}
        title="Delete this record?"
        description={t('dialogs.deleteDescription')}
        pendingTitle="Delete scheduled"
        pendingDescription={t('dialogs.deletePending')}
        countdownSeconds={5}
        cancelText="Cancel"
        confirmText="Delete"
        undoText="Undo"
        onCancel={() => setActionText(t('dialogs.undoCancel'))}
        onUndo={() => setActionText(t('dialogs.undoDone'))}
        onConfirm={async () => {
          setActionText(t('dialogs.deleteStart'));
          await sleep(400);
          setActionText(t('dialogs.deleteDone'));
        }}
      />
      <UndoableConfirmDialog
        open={activeDialogDemo === 'undoable-loading-confirm'}
        onOpenChange={(open) => setActiveDialogDemo(open ? 'undoable-loading-confirm' : null)}
        title="Archive this record?"
        description={t('dialogs.archiveDescription')}
        pendingTitle="Archive scheduled"
        pendingDescription={t('dialogs.archivePending')}
        countdownSeconds={3}
        cancelText="Cancel"
        confirmText="Archive"
        undoText="Undo"
        loadingActions={['confirm']}
        onCancel={() => setActionText(t('dialogs.undoConfirmCancel'))}
        onUndo={() => setActionText(t('dialogs.undoConfirmUndo'))}
        onConfirm={async () => {
          setActionText(t('dialogs.loadingStart', { source: 'UndoableConfirmDialog: confirm' }));
          await sleep(DIALOG_LOADING_DEMO_DELAY_MS);
          setActionText(t('dialogs.loadingDone', { source: 'UndoableConfirmDialog: confirm' }));
        }}
      />
      <UndoableConfirmDialog
        open={activeDialogDemo === 'undoable-loading-undo'}
        onOpenChange={(open) => setActiveDialogDemo(open ? 'undoable-loading-undo' : null)}
        title="Replace saved set?"
        description={t('dialogs.replaceDescription')}
        pendingTitle="Replace scheduled"
        pendingDescription={t('dialogs.replacePending')}
        countdownSeconds={5}
        cancelText="Cancel"
        confirmText="Replace"
        undoText="Undo"
        loadingActions={['undo']}
        onCancel={() => setActionText(t('dialogs.undoLoadingCancel'))}
        onUndo={async () => {
          setActionText(t('dialogs.loadingStart', { source: 'UndoableConfirmDialog: undo' }));
          await sleep(DIALOG_LOADING_DEMO_DELAY_MS);
          setActionText(t('dialogs.loadingDone', { source: 'UndoableConfirmDialog: undo' }));
        }}
        onConfirm={() => setActionText(t('dialogs.undoLoadingConfirm'))}
      />
      <UndoableConfirmDialog
        open={activeDialogDemo === 'undoable-loading-both'}
        onOpenChange={(open) => setActiveDialogDemo(open ? 'undoable-loading-both' : null)}
        title="Publish scheduled changes?"
        description={t('dialogs.publishDescription')}
        pendingTitle="Publish scheduled"
        pendingDescription={t('dialogs.publishPending')}
        countdownSeconds={5}
        cancelText="Cancel"
        confirmText="Publish"
        undoText="Undo"
        loadingActions={['confirm', 'undo']}
        onCancel={() => setActionText(t('dialogs.bothLoadingCancel'))}
        onUndo={async () => {
          setActionText(t('dialogs.loadingStart', { source: 'UndoableConfirmDialog: dual-path undo' }));
          await sleep(DIALOG_LOADING_DEMO_DELAY_MS);
          setActionText(t('dialogs.loadingDone', { source: 'UndoableConfirmDialog: dual-path undo' }));
        }}
        onConfirm={async () => {
          setActionText(t('dialogs.loadingStart', { source: 'UndoableConfirmDialog: dual-path confirm' }));
          await sleep(DIALOG_LOADING_DEMO_DELAY_MS);
          setActionText(t('dialogs.loadingDone', { source: 'UndoableConfirmDialog: dual-path confirm' }));
        }}
      />

      <HighPriorityConfirmDialog
        open={activeDialogDemo === 'high-priority'}
        onOpenChange={(open) => setActiveDialogDemo(open ? 'high-priority' : null)}
        title="Leave this flow?"
        description={t('dialogs.highPriorityDescription')}
        cancelText="Stay"
        confirmText="Leave"
        onCancel={() => {
          closeActiveDialog();
          setActionText(t('dialogs.highPriorityCancel'));
        }}
        onConfirm={() => {
          closeActiveDialog();
          setActionText(t('dialogs.highPriorityConfirm'));
        }}
      />
      <HighPriorityConfirmDialog
        open={activeDialogDemo === 'high-priority-loading'}
        onOpenChange={(open) => setActiveDialogDemo(open ? 'high-priority-loading' : null)}
        title="Leave and save draft?"
        description={t('dialogs.highPriorityLoadingDescription')}
        cancelText="Stay"
        confirmText="Leave"
        loadingActions={['confirm']}
        onCancel={() => setActionText(t('dialogs.highPriorityLoadingCancel'))}
        onConfirm={async () => {
          setActionText(t('dialogs.loadingStart', { source: 'HighPriorityConfirmDialog: confirm' }));
          await sleep(DIALOG_LOADING_DEMO_DELAY_MS);
          setActionText(t('dialogs.loadingDone', { source: 'HighPriorityConfirmDialog: confirm' }));
        }}
      />
      <ConfirmDialog
        open={combinedBatchDialogOpen}
        onOpenChange={setCombinedBatchDialogOpen}
        type="normal"
        title="Handle planned dates?"
        description={t('randomCalendar.batchDescription', { count: combinedPlannedDates.length })}
        cancelText="Clear Planned"
        confirmText="Save All"
        emphasis="cancel"
        loadingActions={['cancel', 'confirm']}
        onCancel={async () => {
          await sleep(DIALOG_LOADING_DEMO_DELAY_MS);
          const targetDates = new Set(combinedPlannedDates);

          setCombinedDayStates((current) => {
            const nextStates = new Map(current);
            targetDates.forEach((date) => nextStates.delete(date));
            return nextStates;
          });
          setActionText(t('randomCalendar.batchClearAction', { count: targetDates.size }));
        }}
        onConfirm={async () => {
          await sleep(DIALOG_LOADING_DEMO_DELAY_MS);
          const targetDates = [...combinedPlannedDates];

          setCombinedDayStates((current) => {
            const nextStates = new Map(current);

            targetDates.forEach((date) => {
              nextStates.set(date, {
                key: 'saved',
                tone: 'saved',
                title: `${date}: batch saved`,
              });
            });

            return nextStates;
          });
          setActionText(t('randomCalendar.batchSaveAction', { count: targetDates.length }));
        }}
      />
      <RandomDateRangeDialog
        open={combinedRangeDialogOpen}
        value={combinedPlannedRange}
        anchorDate={combinedSelectedDate}
        defaultRangeDays={7}
        onOpenChange={setCombinedRangeDialogOpen}
        loadingActions={['confirm']}
        onApply={async (range) => {
          await sleep(DIALOG_LOADING_DEMO_DELAY_MS);
          setCombinedPlannedRange(range);
          setCombinedDayStates((current) => {
            const nextStates = new Map(current);

            buildPlannedDatesSkippingSaved(range, nextStates).forEach((date) => {
              nextStates.set(date, {
                key: 'planned',
                tone: 'planned',
                title: `${date}: planned from range window`,
              });
            });

            return nextStates;
          });
          if (range.startDate) {
            setCombinedSelectedDate(range.startDate);
          }
          setActionText(t('randomCalendar.generateRangeAction', { range: getRangeSummary(range) }));
        }}
      />
    </div>
  );
}
