'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

const VIRTUALIZATION_THRESHOLD = 500;
const CARD_ESTIMATE_SIZE = 180;
const OVERSCAN = 5;

export interface VirtualizedCardListProps<T> {
  items: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  getItemKey: (item: T) => string;
}

/**
 * Virtualizes card list when items >= 500 for performance with long sacrament lists.
 * Renders normally for smaller lists.
 */
export function VirtualizedCardList<T>({
  items,
  renderCard,
  getItemKey,
}: VirtualizedCardListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const shouldVirtualize = items.length >= VIRTUALIZATION_THRESHOLD;

  if (!shouldVirtualize) {
    return (
      <ul className="space-y-3" role="list">
        {items.map((item, index) => (
          <li key={getItemKey(item)}>{renderCard(item, index)}</li>
        ))}
      </ul>
    );
  }

  return (
    <VirtualizedCardListInner
      items={items}
      renderCard={renderCard}
      getItemKey={getItemKey}
      parentRef={parentRef}
    />
  );
}

function VirtualizedCardListInner<T>({
  items,
  renderCard,
  getItemKey,
  parentRef,
}: VirtualizedCardListProps<T> & { parentRef: React.RefObject<HTMLDivElement | null> }) {
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_ESTIMATE_SIZE,
    overscan: OVERSCAN,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <div
      ref={parentRef as React.RefObject<HTMLDivElement>}
      className="overflow-y-auto max-h-[70vh] -mx-1 px-1"
      aria-label="Sacrament list"
    >
      <ul
        className="relative w-full"
        style={{ height: `${totalSize}px` }}
        role="list"
      >
        {virtualItems.map((virtualRow) => {
          const item = items[virtualRow.index];
          return (
            <li
              key={getItemKey(item)}
              className="absolute left-0 right-0 w-full"
              style={{
                top: 0,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="pb-3">{renderCard(item, virtualRow.index)}</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
