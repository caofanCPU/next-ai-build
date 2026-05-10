'use client';

import {
  CheckIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
} from '@windrun-huaiin/base-ui/icons';
import {
  themeIconColor,
  themeRingColor,
  themeSvgIconColor,
} from '@windrun-huaiin/base-ui/lib';
import { cn } from '@windrun-huaiin/lib/utils';
import {
  Children,
  type CSSProperties,
  isValidElement,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { InfoTooltip } from '../../main/info-tooltip';

const DEFAULT_COLUMN_WIDTH = 180;
const MIN_COLUMN_WIDTH = 140;
const CHEET_TABLE_BORDER_COLOR = `color-mix(in srgb, ${themeSvgIconColor} 35%, transparent)`;
const CHEET_TABLE_BORDER_CLASS = 'border-[color:var(--cheet-table-border-color)]';

type ParsedCheetCell = {
  text: string;
  description?: string;
  force: boolean;
};

type CheetTableCell = ParsedCheetCell & {
  rawText: string;
};

type CheetTableModel = {
  headers: CheetTableCell[];
  rows: CheetTableCell[][];
};

export type CheetTableProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  title?: ReactNode;
  description?: string;
  copyableColumns?: string[];
  defaultOpen?: boolean;
  collapsible?: boolean;
  striped?: boolean;
  stickyHeader?: boolean;
  emptyText?: string;
  children: ReactNode;
};

function parseCheetCell(raw: string): ParsedCheetCell {
  let value = raw.trim();
  let force = false;

  if (value.startsWith('!!')) {
    force = true;
    value = value.slice(2).trimStart();
  }

  const descriptionIndex = value.indexOf('??');

  if (descriptionIndex === -1) {
    return {
      text: value,
      force,
    };
  }

  const description = value.slice(descriptionIndex + 2).trim();

  return {
    text: value.slice(0, descriptionIndex).trimEnd(),
    description: description ? description : undefined,
    force,
  };
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function collectText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(collectText).join('');
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return collectText(node.props.children);
  }

  return '';
}

function getElementChildren(element: ReactElement<{ children?: ReactNode }>) {
  return Children.toArray(element.props.children);
}

function isElementType(node: ReactNode, type: string) {
  return isValidElement(node) && node.type === type;
}

function findFirstElement(node: ReactNode, type: string): ReactElement<{ children?: ReactNode }> | null {
  if (isElementType(node, type)) {
    return node as ReactElement<{ children?: ReactNode }>;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findFirstElement(child, type);

      if (match) {
        return match;
      }
    }
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return findFirstElement(node.props.children, type);
  }

  return null;
}

function collectRowElements(node: ReactNode): ReactElement<{ children?: ReactNode }>[] {
  if (isElementType(node, 'tr')) {
    return [node as ReactElement<{ children?: ReactNode }>];
  }

  if (Array.isArray(node)) {
    return node.flatMap(collectRowElements);
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return collectRowElements(node.props.children);
  }

  return [];
}

function parseRow(row: ReactElement<{ children?: ReactNode }>) {
  return getElementChildren(row)
    .filter(isValidElement)
    .map((cell) => {
      const rawText = normalizeText(
        collectText((cell as ReactElement<{ children?: ReactNode }>).props.children),
      );

      return {
        rawText,
        ...parseCheetCell(rawText),
      };
    });
}

function parseCheetTable(children: ReactNode): CheetTableModel | null {
  const rows = collectRowElements(children);

  if (rows.length > 0) {
    const headerRow = rows[0];
    const dataRows = rows.slice(1);
    const headers = parseRow(headerRow);

    if (headers.length === 0) {
      return null;
    }

    return {
      headers,
      rows: dataRows.map(parseRow).filter((row) => row.length > 0),
    };
  }

  const table = findFirstElement(children, 'table');

  if (!table) {
    return null;
  }

  const thead = findFirstElement(table.props.children, 'thead');
  const tbody = findFirstElement(table.props.children, 'tbody');
  const headRows = thead ? collectRowElements(thead.props.children) : [];
  const bodyRows = tbody ? collectRowElements(tbody.props.children) : [];
  const fallbackRows = !thead && !tbody ? collectRowElements(table.props.children) : [];
  const headerRow = headRows[0] ?? fallbackRows[0];
  const dataRows = bodyRows.length > 0 ? bodyRows : fallbackRows.slice(1);

  if (!headerRow) {
    return null;
  }

  const headers = parseRow(headerRow);

  if (headers.length === 0) {
    return null;
  }

  return {
    headers,
    rows: dataRows.map(parseRow).filter((row) => row.length > 0),
  };
}

function parseCheetTableElement(element: HTMLElement | null): CheetTableModel | null {
  const table = element?.querySelector('table');

  if (!table) {
    return null;
  }

  const headRow = table.querySelector('thead tr');
  const bodyRows = Array.from(table.querySelectorAll('tbody tr'));
  const fallbackRows = Array.from(table.querySelectorAll('tr'));
  const headerRow = headRow ?? fallbackRows[0];
  const dataRows = bodyRows.length > 0
    ? bodyRows
    : fallbackRows.slice(headerRow ? 1 : 0);

  if (!headerRow) {
    return null;
  }

  const parseDomRow = (row: Element) =>
    Array.from(row.querySelectorAll('th,td')).map((cell) => {
      const rawText = normalizeText(cell.textContent ?? '');

      return {
        rawText,
        ...parseCheetCell(rawText),
      };
    });

  const headers = parseDomRow(headerRow);

  if (headers.length === 0) {
    return null;
  }

  return {
    headers,
    rows: dataRows.map(parseDomRow).filter((row) => row.length > 0),
  };
}

function createCopyableColumnSet(headers: CheetTableCell[], copyableColumns?: string[]) {
  const names = copyableColumns ?? [];

  return new Set(
    names.map((name) => {
      const header = headers.find(
        (item) => item.text === name || item.rawText === name,
      );

      return header ? header.text : name;
    }),
  );
}

function CheetCellContent({
  cell,
  force,
  copied,
  copyable,
  onCopy,
}: {
  cell: CheetTableCell;
  force: boolean;
  copied?: boolean;
  copyable?: boolean;
  onCopy?: () => void;
}) {
  return (
    <span className="flex min-w-0 items-center gap-0.5">
      <span
        className={cn(
          'block min-w-0 truncate',
          force && cn('font-semibold', themeIconColor),
        )}
      >
        {cell.text}
      </span>
      {cell.description ? (
        <InfoTooltip
          content={cell.description}
          className="not-prose -mx-0.5"
          desktopSide="bottom"
        />
      ) : null}
      {copyable ? (
        <button
          type="button"
          aria-label={copied ? 'Copied' : 'Copy cell content'}
          className={cn(
            'not-prose inline-flex size-6 shrink-0 touch-manipulation items-center justify-center rounded text-fd-muted-foreground transition',
            'hover:bg-fd-accent hover:text-fd-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950',
            copied && themeIconColor,
            themeRingColor,
          )}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onCopy?.();
          }}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
        >
          {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
        </button>
      ) : null}
    </span>
  );
}

export function CheetTable({
  title,
  description,
  copyableColumns,
  defaultOpen = true,
  collapsible = true,
  striped = true,
  stickyHeader = false,
  emptyText = 'No data',
  className,
  children,
  style,
  ...props
}: CheetTableProps) {
  const [mounted, setMounted] = useState(false);
  const [model, setModel] = useState<CheetTableModel | null>(null);
  const [parsed, setParsed] = useState(false);
  const [open, setOpen] = useState(defaultOpen);
  const [copiedCell, setCopiedCell] = useState<string | null>(null);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const sourceRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef<{
    columnIndex: number;
    startX: number;
    startWidth: number;
  } | null>(null);
  const headerCount = model?.headers.length ?? 0;
  const copyableColumnSet = useMemo(
    () => createCopyableColumnSet(model?.headers ?? [], copyableColumns),
    [copyableColumns, model?.headers],
  );

  useEffect(() => {
    setMounted(true);
    setModel(parseCheetTableElement(sourceRef.current) ?? parseCheetTable(children));
    setParsed(true);
  }, [children]);

  useEffect(() => {
    if (headerCount === 0) {
      setColumnWidths([]);
      return;
    }

    setColumnWidths((current) =>
      Array.from({ length: headerCount }, (_, index) =>
        Math.max(current[index] ?? DEFAULT_COLUMN_WIDTH, MIN_COLUMN_WIDTH),
      ),
    );
  }, [headerCount]);

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const start = resizeStartRef.current;

      if (!start) {
        return;
      }

      const nextWidth = Math.max(
        MIN_COLUMN_WIDTH,
        start.startWidth + event.clientX - start.startX,
      );

      setColumnWidths((current) => {
        const next = [...current];
        next[start.columnIndex] = nextWidth;
        return next;
      });
    }

    function handlePointerUp() {
      resizeStartRef.current = null;
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
    };
  }, []);

  const startResize = (event: React.PointerEvent, columnIndex: number) => {
    event.preventDefault();
    event.stopPropagation();

    resizeStartRef.current = {
      columnIndex,
      startX: event.clientX,
      startWidth: columnWidths[columnIndex] ?? DEFAULT_COLUMN_WIDTH,
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleCopy = async (text: string, cellId: string) => {
    if (!text || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedCell(cellId);
      window.setTimeout(() => setCopiedCell(null), 1200);
    } catch {
      // Keep MDX reading uninterrupted when clipboard permission is unavailable.
    }
  };

  const shellClassName = cn(
    'not-prose my-6 overflow-hidden rounded-lg border bg-fd-card text-fd-card-foreground shadow-sm',
    CHEET_TABLE_BORDER_CLASS,
    className,
  );
  const shellStyle = {
    '--cheet-table-border-color': CHEET_TABLE_BORDER_COLOR,
    ...style,
  } as CSSProperties;

  const titleBar = title || description || collapsible ? (
    <div className="grid min-w-0 grid-cols-[minmax(0,90%)_minmax(2rem,10%)] items-center bg-fd-muted/35 px-4 py-2">
      <div className="flex min-w-0 items-center justify-center gap-0.5">
        {title ? (
          <h3 className="truncate text-center text-sm font-semibold leading-6 text-fd-foreground">
            {title}
          </h3>
        ) : null}
        {description ? (
          <InfoTooltip
            content={description}
            className="not-prose -mx-0.5"
            desktopSide="bottom"
          />
        ) : null}
      </div>
      {collapsible ? (
        <button
          type="button"
          className={cn(
            'justify-self-end inline-flex size-8 shrink-0 items-center justify-center rounded-md text-fd-muted-foreground transition',
            'hover:text-fd-accent-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950',
            open && themeIconColor,
            themeRingColor,
          )}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4" />}
        </button>
      ) : null}
    </div>
  ) : null;

  if (!mounted) {
    return (
      <section
        data-cheet-table
        className={shellClassName}
        style={shellStyle}
        {...props}
      >
        {titleBar}
        <div ref={sourceRef} hidden>
          {children}
        </div>
      </section>
    );
  }

  if (!model) {
    return (
      <section
        data-cheet-table
        className={shellClassName}
        style={shellStyle}
        {...props}
      >
        {titleBar}
        <div ref={sourceRef} hidden>
          {children}
        </div>
        {open && parsed ? (
          <div className="px-4 py-6 text-center text-sm text-fd-muted-foreground">
            {emptyText}
          </div>
        ) : null}
      </section>
    );
  }

  const content = model.rows.length > 0 ? (
    <div className="overflow-x-auto">
      <table
        className="table-fixed border-separate border-spacing-0 text-sm"
        style={{
          width: columnWidths.length
            ? columnWidths.reduce((total, width) => total + width, 0)
            : '100%',
          minWidth: '100%',
        }}
      >
        <colgroup>
          {model.headers.map((header, index) => (
            <col
              key={`${header.text}-${index}-col`}
              style={{
                width: columnWidths[index] ?? DEFAULT_COLUMN_WIDTH,
                minWidth: MIN_COLUMN_WIDTH,
              }}
            />
          ))}
        </colgroup>
        <thead className={cn(stickyHeader && 'sticky top-0 z-10')}>
          <tr>
            {model.headers.map((header, index) => (
              <th
                key={`${header.text}-${index}`}
                className={cn(
                  'relative border-t border-b bg-fd-muted/80 px-3 py-2.5 align-middle text-xs font-semibold uppercase tracking-normal text-fd-muted-foreground first:pl-4 last:pr-4',
                  index > 0 && 'border-l',
                  CHEET_TABLE_BORDER_CLASS,
                  'text-left',
                )}
                scope="col"
              >
                <CheetCellContent cell={header} force={header.force} />
                {index < model.headers.length - 1 ? (
                  <button
                    type="button"
                    aria-label="Resize column"
                    className={cn(
                      'absolute top-0 right-0 h-full w-2 cursor-col-resize touch-none select-none',
                      'after:absolute after:top-2 after:right-0 after:bottom-2 after:w-px after:bg-transparent after:transition-colors',
                      'hover:after:bg-fd-muted-foreground/40',
                    )}
                    onPointerDown={(event) => startResize(event, index)}
                  />
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {model.rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={cn(
                'transition-colors hover:bg-fd-accent/45',
                striped && rowIndex % 2 === 1 && 'bg-fd-muted/30',
              )}
            >
              {model.headers.map((header, columnIndex) => {
                const cell = row[columnIndex] ?? {
                  rawText: '',
                  text: '',
                  force: false,
                };
                const cellId = `${rowIndex}:${columnIndex}`;
                const copyable = copyableColumnSet.has(header.text);

                return (
                  <td
                    key={cellId}
                    className={cn(
                      'group px-3 py-2.5 align-top text-fd-foreground first:pl-4 last:pr-4',
                      rowIndex < model.rows.length - 1 && 'border-b',
                      columnIndex > 0 && 'border-l',
                      'text-left',
                      CHEET_TABLE_BORDER_CLASS,
                    )}
                    onDoubleClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                  >
                    <CheetCellContent
                      cell={cell}
                      force={header.force || cell.force}
                      copyable={copyable}
                      copied={copiedCell === cellId}
                      onCopy={
                        copyable
                          ? () => handleCopy(cell.text, cellId)
                          : undefined
                      }
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="px-4 py-6 text-center text-sm text-fd-muted-foreground">
      {emptyText}
    </div>
  );

  return (
    <section
      data-cheet-table
      className={shellClassName}
      style={shellStyle}
      {...props}
    >
      {titleBar}
      <div ref={sourceRef} hidden>
        {children}
      </div>
      {open ? content : null}
    </section>
  );
}
