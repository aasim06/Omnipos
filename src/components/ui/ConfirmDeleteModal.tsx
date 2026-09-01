"use client";

import { Trash2, AlertTriangle, X } from "lucide-react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  itemName: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteModal({
  isOpen,
  title = "Delete Confirmation",
  itemName,
  message,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#141720] border border-[#232734] rounded-xl p-6 shadow-2xl space-y-5 relative font-sans text-white animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#8b92a0] hover:text-white hover:bg-[#1f2432] transition"
        >
          <X size={16} />
        </button>

        {/* Warning Icon & Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 shadow-inner">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg leading-tight">{title}</h3>
            <p className="text-xs text-[#8b92a0] mt-0.5">This action is permanent</p>
          </div>
        </div>

        {/* Message Body */}
        <div className="p-3.5 rounded-md bg-[#090a0e] border border-[#232734] space-y-1">
          <p className="text-xs text-[#cbd5e1] leading-relaxed">
            Are you sure you want to delete <span className="font-bold text-white">"{itemName}"</span>?
          </p>
          {message && <p className="text-[11px] text-[#8b92a0]">{message}</p>}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-md bg-[#161822] hover:bg-[#232734] border border-[#232734] text-[#8b92a0] hover:text-white text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold transition flex items-center gap-1.5 shadow-lg shadow-red-600/20 active:scale-95"
          >
            <Trash2 size={15} /> Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}
