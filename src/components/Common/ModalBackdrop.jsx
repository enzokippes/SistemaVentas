import React, { useRef } from 'react';

/**
 * ModalBackdrop
 * Safely handles backdrop clicks without closing the modal if the user
 * started mouse selection inside the modal card/input and released mouse outside.
 * 
 * Only closes the modal when the user intentionally presses and releases
 * the mouse directly on the backdrop outside the modal container.
 */
export default function ModalBackdrop({ 
  children, 
  onClose, 
  className = 'modal-backdrop', 
  style, 
  closeOnBackdropClick = true,
  ...props 
}) {
  const isDirectBackdropClickRef = useRef(false);

  return (
    <div
      className={className}
      style={style}
      onMouseDown={(e) => {
        // ONLY valid if mousedown started directly on the backdrop itself (not inside any child)
        isDirectBackdropClickRef.current = closeOnBackdropClick && e.target === e.currentTarget;
      }}
      onMouseUp={(e) => {
        // If mouse was released anywhere other than the backdrop itself, cancel the click
        if (e.target !== e.currentTarget) {
          isDirectBackdropClickRef.current = false;
        }
      }}
      onClick={(e) => {
        const wasIntentionalBackdropClick = 
          closeOnBackdropClick && 
          isDirectBackdropClickRef.current && 
          e.target === e.currentTarget;

        isDirectBackdropClickRef.current = false;

        if (wasIntentionalBackdropClick) {
          onClose?.();
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
}
