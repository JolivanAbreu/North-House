import React from "react";
import { Check, XCircle } from "lucide-react";

const STATUS_ORDER = {
  Recebido: 1,
  "Em preparo": 2,
  "Pronto para entrega": 3,
  "Pronto para retirada": 3,
  Concluído: 4,
  Cancelado: -1,
};

const Step = ({ title, isActive, isCompleted, isFirst, isLast }) => {
  return (
    <div className="flex-1 flex flex-col items-center">
      <div className="relative w-full flex items-center justify-center">
        <div
          className={`flex-1 h-1 transition-colors duration-300 ${
            isFirst ? "bg-transparent" : isCompleted ? "bg-brand-600" : "bg-stone-200"
          }`}
        />

        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
                      transition-all duration-300
                      ${
                        isCompleted || isActive
                          ? "bg-brand-600 text-white shadow-soft"
                          : "bg-stone-200 text-stone-500"
                      }`}
        >
          {isCompleted ? (
            <Check className="w-4 h-4" strokeWidth={3} />
          ) : (
            <div className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-white" : "bg-stone-400"}`} />
          )}
        </div>

        <div
          className={`flex-1 h-1 transition-colors duration-300 ${
            isLast ? "bg-transparent" : isCompleted ? "bg-brand-600" : "bg-stone-200"
          }`}
        />
      </div>

      <p
        className={`mt-2 text-xs sm:text-sm text-center px-1
                    ${isActive || isCompleted ? "font-semibold text-brand-700" : "text-stone-400"}`}
      >
        {title}
      </p>
    </div>
  );
};

const StatusStepper = ({ currentStatus, tipoEntrega }) => {
  const step3Text =
    tipoEntrega === "Retirada" ? "Pronto para retirada" : "Pronto para entrega";

  const steps = ["Recebido", "Em preparo", step3Text, "Concluído"];
  const currentStepWeight = STATUS_ORDER[currentStatus] || 0;

  if (currentStepWeight === -1) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-center gap-3 mb-8">
        <XCircle className="w-6 h-6 shrink-0" />
        <div>
          <h3 className="font-bold">Pedido Cancelado</h3>
          <p className="text-sm">Este pedido foi cancelado pelo estabelecimento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex mb-8">
      {steps.map((stepTitle, index) => {
        const stepWeight = STATUS_ORDER[stepTitle];
        return (
          <Step
            key={stepTitle}
            title={stepTitle}
            isActive={stepWeight === currentStepWeight}
            isCompleted={currentStepWeight > stepWeight}
            isFirst={index === 0}
            isLast={index === steps.length - 1}
          />
        );
      })}
    </div>
  );
};

export default StatusStepper;
