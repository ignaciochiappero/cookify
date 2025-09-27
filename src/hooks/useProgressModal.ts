import { useState, useCallback } from "react";
import { ProgressStep } from "@/components/ProgressModal";

export function useProgressModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const openModal = useCallback((
    modalTitle: string,
    modalDescription: string,
    initialSteps: ProgressStep[]
  ) => {
    setTitle(modalTitle);
    setDescription(modalDescription);
    setSteps(initialSteps);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setSteps([]);
  }, []);

  const updateStep = useCallback((stepId: string, updates: Partial<ProgressStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  }, []);

  const updateStepStatus = useCallback((
    stepId: string, 
    status: ProgressStep["status"],
    description?: string,
    errorMessage?: string
  ) => {
    updateStep(stepId, { status, description, errorMessage });
  }, [updateStep]);

  const markStepInProgress = useCallback((stepId: string, description?: string) => {
    updateStepStatus(stepId, "in-progress", description);
  }, [updateStepStatus]);

  const markStepCompleted = useCallback((stepId: string, description?: string) => {
    updateStepStatus(stepId, "completed", description);
  }, [updateStepStatus]);

  const markStepError = useCallback((stepId: string, errorMessage: string, description?: string) => {
    updateStepStatus(stepId, "error", description, errorMessage);
  }, [updateStepStatus]);

  return {
    isOpen,
    steps,
    title,
    description,
    openModal,
    closeModal,
    updateStep,
    updateStepStatus,
    markStepInProgress,
    markStepCompleted,
    markStepError,
  };
}
