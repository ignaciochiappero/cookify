"use client";

import React, { useState } from "react";
import ProgressModal, { ProgressStep } from "./ProgressModal";

// Ejemplo de cómo usar el ProgressModal en otros componentes
export default function ProgressModalExample() {
  const [showModal, setShowModal] = useState(false);
  const [steps, setSteps] = useState<ProgressStep[]>([]);

  const simulateProcess = async () => {
    // Inicializar pasos
    const initialSteps: ProgressStep[] = [
      {
        id: "step1",
        title: "Conectando con el servidor",
        description: "Estableciendo conexión...",
        status: "pending"
      },
      {
        id: "step2", 
        title: "Procesando datos",
        description: "Analizando información...",
        status: "pending"
      },
      {
        id: "step3",
        title: "Generando reporte",
        description: "Creando documento...",
        status: "pending"
      },
      {
        id: "step4",
        title: "Enviando notificaciones",
        description: "Notificando a usuarios...",
        status: "pending"
      }
    ];

    setSteps(initialSteps);
    setShowModal(true);

    // Simular proceso paso a paso
    for (let i = 0; i < initialSteps.length; i++) {
      const stepId = initialSteps[i].id;
      
      // Marcar como en progreso
      setSteps(prev => prev.map(step => 
        step.id === stepId 
          ? { ...step, status: "in-progress" }
          : step
      ));

      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Marcar como completado o error (simular error en el paso 3)
      const isError = stepId === "step3" && Math.random() > 0.5;
      setSteps(prev => prev.map(step => 
        step.id === stepId 
          ? { 
              ...step, 
              status: isError ? "error" : "completed",
              errorMessage: isError ? "Error al generar el reporte" : undefined,
              description: isError ? "Error en la generación" : "Completado exitosamente"
            }
          : step
      ));

      // Si hay error, salir del bucle
      if (isError) break;
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Ejemplo de ProgressModal</h2>
      <p className="text-gray-600 mb-4">
        Este es un ejemplo de cómo usar el ProgressModal reutilizable en cualquier componente.
      </p>
      
      <button
        onClick={simulateProcess}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Simular Proceso
      </button>

      <ProgressModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Procesando Solicitud"
        description="Ejecutando tareas en segundo plano..."
        steps={steps}
        showCloseButton={true}
        allowCloseOnComplete={true}
      />
    </div>
  );
}
