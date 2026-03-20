import { useEffect } from 'react';

export interface KeyboardShortcuts {
  onCreateBatch?: () => void;
  onSaveNotes?: () => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  onDeleteBatch?: () => void;
}

export const useKeyboardShortcuts = ({
  onCreateBatch,
  onSaveNotes,
  onNavigateUp,
  onNavigateDown,
  onDeleteBatch,
}: KeyboardShortcuts) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && onCreateBatch) {
        e.preventDefault();
        onCreateBatch();
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 's' && onSaveNotes) {
        e.preventDefault();
        onSaveNotes();
      }

      if (e.key === 'ArrowUp' && onNavigateUp) {
        e.preventDefault();
        onNavigateUp();
      }

      if (e.key === 'ArrowDown' && onNavigateDown) {
        e.preventDefault();
        onNavigateDown();
      }

      if (e.key === 'Delete' && onDeleteBatch) {
        e.preventDefault();
        onDeleteBatch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCreateBatch, onSaveNotes, onNavigateUp, onNavigateDown, onDeleteBatch]);
};
