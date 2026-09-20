import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
  footer,
}) => {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 backdrop-blur-[2px] animate-fadeIn"
    >
      <div
        ref={contentRef}
        className={`${sizeClasses[size]} w-full rounded-xl border border-border bg-popover shadow-overlay animate-modalSlideIn`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 pb-0">
          <div className="min-w-0">
            <h3 className="font-display text-h2 font-semibold text-foreground">{title}</h3>
            {subtitle && (
              <p className="mt-1 text-small text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 rounded-xs p-1 text-muted-foreground transition-colors duration-150 ease-kiln hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover focus-visible:outline-none"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-2 px-6 pb-6 pt-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
