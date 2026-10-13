import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({
  open,
  title,
  onClose,
  children,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className={`card w-full ${sizes[size]} max-h-[90vh] overflow-hidden flex flex-col fade-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <h3 className="text-base font-bold text-neutral-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto scrollbar-thin px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
