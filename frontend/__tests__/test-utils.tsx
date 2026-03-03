import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { SWRConfig } from 'swr';

/**
 * Wraps components in SWRConfig with a fresh cache per render.
 * Use this for pages that use useBaptisms, useCommunions, etc. to avoid
 * SWR cache persisting between tests.
 */
function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ provider: () => new Map() }}>
      {children}
    </SWRConfig>
  );
}

function renderWithSWR(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    wrapper: AllTheProviders,
    ...options,
  });
}

export { renderWithSWR };
