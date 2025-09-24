import { useState, useCallback } from 'react';
import { SupportSignal } from '../types';

export const useSignalManagement = () => {
  const [selectedSignal, setSelectedSignal] = useState<SupportSignal | null>(null);
  const [showTriage, setShowTriage] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const handleSignalSelect = useCallback((signal: SupportSignal) => {
    setSelectedSignal(signal);
    setShowTriage(true);
  }, []);

  const handleTriageClose = useCallback(() => {
    setSelectedSignal(null);
    setShowTriage(false);
  }, []);

  const handleReportModalOpen = useCallback(() => {
    setShowReportModal(true);
  }, []);

  const handleReportModalClose = useCallback(() => {
    setShowReportModal(false);
  }, []);

  return {
    selectedSignal,
    showTriage,
    showReportModal,
    handleSignalSelect,
    handleTriageClose,
    handleReportModalOpen,
    handleReportModalClose,
  };
};
