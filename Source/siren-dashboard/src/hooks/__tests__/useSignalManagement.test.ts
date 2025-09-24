import { renderHook, act } from '@testing-library/react';
import { useSignalManagement } from '../useSignalManagement';

const mockSignal = {
  id: '1',
  title: 'Test Signal',
  description: 'Test description',
  source: 'Test Source',
  timestamp: '2023-09-22T10:00:00Z',
  category: 'Test Category',
  manualScore: 5,
};

describe('useSignalManagement', () => {
  test('initial state is correct', () => {
    const { result } = renderHook(() => useSignalManagement());

    expect(result.current.selectedSignal).toBeNull();
    expect(result.current.showTriage).toBe(false);
    expect(result.current.showReportModal).toBe(false);
  });

  test('handleSignalSelect sets signal and opens triage', () => {
    const { result } = renderHook(() => useSignalManagement());

    act(() => {
      result.current.handleSignalSelect(mockSignal);
    });

    expect(result.current.selectedSignal).toEqual(mockSignal);
    expect(result.current.showTriage).toBe(true);
  });

  test('handleTriageClose clears signal and closes triage', () => {
    const { result } = renderHook(() => useSignalManagement());

    // First select a signal
    act(() => {
      result.current.handleSignalSelect(mockSignal);
    });

    expect(result.current.selectedSignal).toEqual(mockSignal);
    expect(result.current.showTriage).toBe(true);

    // Then close triage
    act(() => {
      result.current.handleTriageClose();
    });

    expect(result.current.selectedSignal).toBeNull();
    expect(result.current.showTriage).toBe(false);
  });

  test('handleReportModalOpen opens report modal', () => {
    const { result } = renderHook(() => useSignalManagement());

    act(() => {
      result.current.handleReportModalOpen();
    });

    expect(result.current.showReportModal).toBe(true);
  });

  test('handleReportModalClose closes report modal', () => {
    const { result } = renderHook(() => useSignalManagement());

    // First open modal
    act(() => {
      result.current.handleReportModalOpen();
    });

    expect(result.current.showReportModal).toBe(true);

    // Then close modal
    act(() => {
      result.current.handleReportModalClose();
    });

    expect(result.current.showReportModal).toBe(false);
  });

  test('triage and report modal can be open simultaneously', () => {
    const { result } = renderHook(() => useSignalManagement());

    act(() => {
      result.current.handleSignalSelect(mockSignal);
      result.current.handleReportModalOpen();
    });

    expect(result.current.selectedSignal).toEqual(mockSignal);
    expect(result.current.showTriage).toBe(true);
    expect(result.current.showReportModal).toBe(true);
  });
});
