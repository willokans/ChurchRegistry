/**
 * Tests for VirtualizedTableBody and VirtualizedTableContainer.
 * - Renders all rows when below 500 (non-virtualized)
 * - Virtualizes when 500+ items with scrollContainerRef
 * - onRowClick fires when row is clicked
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VirtualizedTableBody, VirtualizedTableContainer } from '@/components/VirtualizedTableBody';

function makeItems(count: number) {
  return Array.from({ length: count }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }));
}

describe('VirtualizedTableBody', () => {
  it('renders all rows when below 500', () => {
    const items = makeItems(10);
    render(
      <table>
        <VirtualizedTableBody
          items={items}
          getRowKey={(item) => String(item.id)}
          renderRow={(item) => <td>{item.name}</td>}
        />
      </table>
    );
    items.forEach((item) => {
      expect(screen.getByText(item.name)).toBeInTheDocument();
    });
  });

  it('calls onRowClick when row is clicked', async () => {
    const items = makeItems(3);
    const onRowClick = jest.fn();
    render(
      <table>
        <VirtualizedTableBody
          items={items}
          getRowKey={(item) => String(item.id)}
          onRowClick={onRowClick}
          renderRow={(item) => <td>{item.name}</td>}
        />
      </table>
    );
    await userEvent.click(screen.getByText('Row 2'));
    expect(onRowClick).toHaveBeenCalledWith(items[1]);
  });

  it('renders virtualized structure when 500+ items with scrollContainerRef', () => {
    const items = makeItems(600);
    const scrollRef = { current: document.createElement('div') };
    const { container } = render(
      <table>
        <VirtualizedTableBody
          items={items}
          getRowKey={(item) => String(item.id)}
          scrollContainerRef={scrollRef}
          renderRow={(item) => <td data-testid={`row-${item.id}`}>{item.name}</td>}
        />
      </table>
    );
    const tbody = container.querySelector('tbody');
    expect(tbody).toBeInTheDocument();
    // In JSDOM the scroll container has no height, so virtualizer may render 0 rows.
    // We verify the virtualized structure (tbody with total height) is used.
    expect(tbody).toHaveStyle({ height: '28800px' }); // 600 * ROW_HEIGHT
  });
});

describe('VirtualizedTableContainer', () => {
  it('renders overflow-x-auto when below 500', () => {
    render(
      <VirtualizedTableContainer itemCount={10}>
        {(ref) => <div data-testid="child">Table {ref ? 'with ref' : 'no ref'}</div>}
      </VirtualizedTableContainer>
    );
    const container = screen.getByTestId('child').parentElement;
    expect(container).toHaveClass('overflow-x-auto');
    expect(screen.getByText('Table no ref')).toBeInTheDocument();
  });

  it('passes scrollContainerRef to children when 500+', () => {
    render(
      <VirtualizedTableContainer itemCount={600}>
        {(ref) => <div data-testid="child">Table {ref ? 'with ref' : 'no ref'}</div>}
      </VirtualizedTableContainer>
    );
    expect(screen.getByText('Table with ref')).toBeInTheDocument();
  });

  it('adds overflow-y and max-h when virtualizing', () => {
    const { container } = render(
      <VirtualizedTableContainer itemCount={600}>
        {() => <div>content</div>}
      </VirtualizedTableContainer>
    );
    const scrollDiv = container.querySelector('.overflow-y-auto');
    expect(scrollDiv).toBeInTheDocument();
    expect(scrollDiv).toHaveClass('max-h-[70vh]');
  });
});
