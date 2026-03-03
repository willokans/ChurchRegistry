/**
 * Tests for VirtualizedCardList.
 * - Renders all items when below 500 (non-virtualized)
 * - Virtualizes when 500+ items (only visible items in DOM)
 */
import { render, screen } from '@testing-library/react';
import { VirtualizedCardList } from '@/components/VirtualizedCardList';

function makeItems(count: number) {
  return Array.from({ length: count }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));
}

describe('VirtualizedCardList', () => {
  it('renders all items when below 500', () => {
    const items = makeItems(10);
    render(
      <VirtualizedCardList
        items={items}
        getItemKey={(item) => String(item.id)}
        renderCard={(item) => <span data-testid={`item-${item.id}`}>{item.name}</span>}
      />
    );
    expect(screen.getByRole('list')).toBeInTheDocument();
    items.forEach((item) => {
      expect(screen.getByTestId(`item-${item.id}`)).toBeInTheDocument();
    });
  });

  it('renders virtualized structure when 500+ items', () => {
    const items = makeItems(600);
    const { container } = render(
      <VirtualizedCardList
        items={items}
        getItemKey={(item) => String(item.id)}
        renderCard={(item) => <span data-testid={`item-${item.id}`}>{item.name}</span>}
      />
    );
    const scrollDiv = container.querySelector('.overflow-y-auto');
    expect(scrollDiv).toBeInTheDocument();
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    // In JSDOM the scroll container has no height, so virtualizer may render 0 items.
    // We verify the virtualized structure (scroll container + list with total height) is used.
    expect(list).toHaveStyle({ height: '108000px' }); // 600 * CARD_ESTIMATE_SIZE
  });

  it('has scrollable container when virtualized', () => {
    const items = makeItems(600);
    const { container } = render(
      <VirtualizedCardList
        items={items}
        getItemKey={(item) => String(item.id)}
        renderCard={(item) => <span>{item.name}</span>}
      />
    );
    const scrollDiv = container.querySelector('.overflow-y-auto');
    expect(scrollDiv).toBeInTheDocument();
    expect(scrollDiv).toHaveAttribute('aria-label', 'Sacrament list');
  });
});
