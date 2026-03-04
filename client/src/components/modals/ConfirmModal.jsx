// ConfirmModal – reusable confirmation dialog built with react-modal.
// Props: isOpen, title, message, onConfirm, onCancel,
//        confirmText, cancelText, danger

import Modal from 'react-modal';

Modal.setAppElement('#root');

const overlayStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const contentStyle = {
  position: 'relative',
  inset: 'auto',
  maxWidth: 440,
  width: '90%',
  padding: 'var(--space-6, 24px)',
  borderRadius: 'var(--radius-lg, 14px)',
  border: 'none',
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
  background: '#fff',
};

export default function ConfirmModal({
  isOpen,
  title = 'Confirm',
  message = 'Are you sure?',
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onCancel}
      style={{ overlay: overlayStyle, content: contentStyle }}
      shouldCloseOnOverlayClick
    >
      <h3 style={{ margin: '0 0 12px', fontSize: '1.125rem', fontWeight: 600 }}>
        {title}
      </h3>
      <p style={{ margin: '0 0 24px', color: 'var(--color-text-secondary, #64748b)', lineHeight: 1.6 }}>
        {message}
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button className="btn btn-outline" onClick={onCancel}>
          {cancelText}
        </button>
        <button
          className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
