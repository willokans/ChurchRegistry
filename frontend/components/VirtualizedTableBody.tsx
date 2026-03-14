'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

const VIRTUALIZATION_THRESHOLD = 500;
const ROW_HEIGHT = 48;
const OVERSCAN = 10;


export interface VirtualizedTableBodyProps<T> {
  items: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
  getRowKey: (item: T) => string;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  onRowClick?: (item: T) => void;
}

/**
 * Virtualizes table body rows when items >= 500 for performance with long sacrament lists.
 * Renders normally for smaller lists. When virtualizing, requires scrollContainerRef from parent.
 */
function rowProps<T>(item: T, onRowClick?: (item: T) => void) {
  if (!onRowClick) return {};
  return {
    role: 'button' as const,
    tabIndex: 0,
    onClick: () => onRowClick(item),
    onKeyDown: (e: React.KeyboardEvent) => e.key === 'Enter' && onRowClick(item),
    className: 'cursor-pointer hover:bg-gray-50/80 transition-colors',
  };
}

export function VirtualizedTableBody<T>({
  items,
  renderRow,
  getRowKey,
  scrollContainerRef,
  onRowClick,
}: VirtualizedTableBodyProps<T>) {
  const shouldVirtualize = items.length >= VIRTUALIZATION_THRESHOLD;

  if (!shouldVirtualize) {
    return (
      <tbody className="divide-y divide-gray-100 bg-white">
        {items.map((item, index) => (
          <tr key={getRowKey(item)} {...rowProps(item, onRowClick)}>
            {renderRow(item, index)}
          </tr>
        ))}
      </tbody>
    );
  }

  if (!scrollContainerRef) {
    return (
      <tbody className="divide-y divide-gray-100 bg-white">
        {items.map((item, index) => (
          <tr key={getRowKey(item)} {...rowProps(item, onRowClick)}>
            {renderRow(item, index)}
          </tr>
        ))}
      </tbody>
    );
  }

  return (
    <VirtualizedTableBodyInner
      items={items}
      renderRow={renderRow}
      getRowKey={getRowKey}
      parentRef={scrollContainerRef}
      onRowClick={onRowClick}
    />
  );
}

function VirtualizedTableBodyInner<T>({
  items,
  renderRow,
  getRowKey,
  parentRef,
  onRowClick,
}: VirtualizedTableBodyProps<T> & { parentRef: React.RefObject<HTMLDivElement | null> }) {
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <tbody
      className="divide-y divide-gray-100 bg-white"
      style={{ height: `${totalSize}px`, position: 'relative' }}
    >
      {virtualItems.map((virtualRow, index) => {
        const item = items[virtualRow.index];
        return (
          <tr
            key={getRowKey(item)}
            {...rowProps(item, onRowClick)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start - index * virtualRow.size}px)`,
            }}
          >
            {renderRow(item, virtualRow.index)}
          </tr>
        );
      })}
    </tbody>
  );
}

export interface VirtualizedTableContainerProps {
  children: (scrollContainerRef: React.RefObject<HTMLDivElement | null> | undefined) => React.ReactNode;
  itemCount: number;
}

/**
 * Wrapper that provides the scroll container for virtualized table body.
 * Passes scrollContainerRef to children via render prop when virtualizing.
 */
export function VirtualizedTableContainer({
  children,
  itemCount,
}: VirtualizedTableContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldVirtualize = itemCount >= VIRTUALIZATION_THRESHOLD;

  if (!shouldVirtualize) {
    return (
      <div className="overflow-x-auto">
        {children(undefined)}
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto overflow-y-auto max-h-[70vh]"
    >
      {children(scrollRef)}
    </div>
  );
}
