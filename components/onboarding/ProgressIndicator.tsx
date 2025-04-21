'use client';

interface ProgressIndicatorProps {
  steps: string[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export const ProgressIndicator = ({ 
  steps, 
  currentStep, 
  onStepClick 
}: ProgressIndicatorProps) => {
  return (
    <div className="flex items-center w-full justify-between">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div 
            className={`
              flex items-center justify-center w-8 h-8 rounded-full 
              ${index <= currentStep ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}
              ${index < steps.length - 1 ? 'mr-2' : ''}
              cursor-pointer
            `}
            onClick={() => index <= currentStep && onStepClick(index)}
          >
            {index + 1}
          </div>
          <span 
            className={`
              text-sm ${index <= currentStep ? 'text-indigo-600 font-medium' : 'text-gray-500'}
            `}
          >
            {step}
          </span>
          
          {index < steps.length - 1 && (
            <div 
              className={`
                h-[2px] w-12 mx-2
                ${index < currentStep ? 'bg-indigo-600' : 'bg-gray-200'}
              `}
            />
          )}
        </div>
      ))}
    </div>
  );
}; 