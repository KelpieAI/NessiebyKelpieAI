interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export const ConfirmDialog = ({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false,
}: ConfirmDialogProps) => {
  return (
    <div className="cd-overlay" onClick={onCancel}>
      <div className="cd-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="cd-title">{title}</h3>
        <p className="cd-message">{message}</p>
        <div className="cd-actions">
          <button className="btn secondary" onClick={onCancel}>{cancelText}</button>
          <button
            className="btn"
            onClick={onConfirm}
            style={isDestructive ? { background: 'var(--danger)', color: '#fff' } : undefined}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};