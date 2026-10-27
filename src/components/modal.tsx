"use client";

import { useEffect, useRef } from "react";

export function Modal({
  children,
  labelledBy,
  onClose,
  disabled,
}: {
  children: React.ReactNode;
  labelledBy: string;
  onClose: () => void;
  disabled: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      className="fixed inset-0 m-auto max-h-[calc(100vh-4rem)] w-[calc(100%-2.5rem)] max-w-lg overflow-y-auto border-0 bg-transparent p-0 backdrop:bg-black/30 backdrop:backdrop-blur-sm"
      onCancel={(event) => {
        event.preventDefault();
        if (!disabled) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !disabled) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
