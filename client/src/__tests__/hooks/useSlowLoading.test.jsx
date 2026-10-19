import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSlowLoading } from '../../hooks/useSlowLoading';

function TestConsumer({ pending, delayMs }) {
  const isSlow = useSlowLoading(pending, delayMs);
  return <p data-testid="slow">{String(isSlow)}</p>;
}

describe('useSlowLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stays false while pending is true but under the delay', () => {
    render(<TestConsumer pending={true} delayMs={3000} />);
    act(() => { vi.advanceTimersByTime(2999); });
    expect(screen.getByTestId('slow')).toHaveTextContent('false');
  });

  it('flips true once pending has lasted past the delay', () => {
    render(<TestConsumer pending={true} delayMs={3000} />);
    act(() => { vi.advanceTimersByTime(3000); });
    expect(screen.getByTestId('slow')).toHaveTextContent('true');
  });

  it('never flips true if pending resolves before the delay', () => {
    const { rerender } = render(<TestConsumer pending={true} delayMs={3000} />);
    act(() => { vi.advanceTimersByTime(1000); });
    rerender(<TestConsumer pending={false} delayMs={3000} />);
    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.getByTestId('slow')).toHaveTextContent('false');
  });

  it('resets back to false once pending flips back to false after being slow', () => {
    const { rerender } = render(<TestConsumer pending={true} delayMs={3000} />);
    act(() => { vi.advanceTimersByTime(3000); });
    expect(screen.getByTestId('slow')).toHaveTextContent('true');

    rerender(<TestConsumer pending={false} delayMs={3000} />);
    expect(screen.getByTestId('slow')).toHaveTextContent('false');
  });
});
