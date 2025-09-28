"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export interface ProgressStep {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in-progress" | "completed" | "error";
  errorMessage?: string;
}

interface ProgressModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  description?: string;
  steps: ProgressStep[];
  currentStep?: string;
  showCloseButton?: boolean;
  allowCloseOnComplete?: boolean;
}

export default function ProgressModal({
  isOpen,
  onClose,
  title,
  description,
  steps,
  showCloseButton = true,
  allowCloseOnComplete = true,
}: ProgressModalProps) {
  const completedSteps = steps.filter(step => step.status === "completed").length;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  
  const hasErrors = steps.some(step => step.status === "error");
  const isComplete = completedSteps === totalSteps && !hasErrors;
  const isInProgress = steps.some(step => step.status === "in-progress");

  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "in-progress":
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStepColor = (step: ProgressStep) => {
    switch (step.status) {
      case "completed":
        return "border-green-200 bg-green-50";
      case "error":
        return "border-red-200 bg-red-50";
      case "in-progress":
        return "border-blue-200 bg-blue-50";
      default:
        return "border-gray-200 bg-white";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget && allowCloseOnComplete && isComplete) {
              onClose?.();
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                  {description && (
                    <p className="text-sm text-gray-600 mt-1">{description}</p>
                  )}
                </div>
                {showCloseButton && (allowCloseOnComplete || !isInProgress) && (
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-6 py-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Progreso: {completedSteps}/{totalSteps}
                </span>
                <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className={`h-2 rounded-full ${
                    hasErrors ? "bg-red-500" : isComplete ? "bg-green-500" : "bg-blue-500"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Steps */}
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 ${getStepColor(step)}`}
                  >
                    <div className="flex items-start space-x-3">
                      {getStepIcon(step)}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900">
                          {step.title}
                        </h4>
                        {step.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {step.description}
                          </p>
                        )}
                        {step.status === "error" && step.errorMessage && (
                          <p className="text-sm text-red-600 mt-1">
                            {step.errorMessage}
                          </p>
                        )}
                        {step.status === "in-progress" && (
                          <p className="text-sm text-blue-600 mt-1">
                            Procesando...
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer */}
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 border-t border-gray-200 bg-green-50"
              >
                <div className="flex items-center space-x-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">¡Proceso completado exitosamente!</span>
                </div>
              </motion.div>
            )}

            {hasErrors && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 border-t border-gray-200 bg-red-50"
              >
                <div className="flex items-center space-x-2 text-red-700">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Se completó con errores</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
