import { createContext, forwardRef, ReactNode, useContext, useState, cloneElement, isValidElement } from 'react';
import { cn } from '../../utils/cn';

interface TooltipContextValue {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

const TooltipContext = createContext<TooltipContextValue | undefined>(undefined);

interface TooltipProviderProps {
  children: ReactNode;
}

function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>;
}

interface TooltipProps {
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}

function Tooltip({ children }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <TooltipContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative inline-block" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
        {children}
      </div>
    </TooltipContext.Provider>
  );
}

interface TooltipTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

const TooltipTrigger = forwardRef<HTMLDivElement, TooltipTriggerProps>(
  ({ children, asChild = false }, ref) => {
    if (asChild && isValidElement(children)) {
      return cloneElement(children as React.ReactElement, { ref } as any);
    }
    return <div ref={ref} className="inline-block">{children}</div>;
  }
);
TooltipTrigger.displayName = 'TooltipTrigger';

interface TooltipContentProps {
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const TooltipContent = forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ children, side = 'top', className }, ref) => {
    const context = useContext(TooltipContext);
    if (!context) throw new Error('TooltipContent must be used within a Tooltip');

    if (!context.isOpen) return null;

    const sideStyles = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'absolute z-50 px-3 py-1.5 text-sm text-popover-foreground bg-popover border border-border rounded-md shadow-md animate-in fade-in-0 zoom-in-95',
          sideStyles[side],
          className
        )}
      >
        {children}
      </div>
    );
  }
);

TooltipContent.displayName = 'TooltipContent';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };