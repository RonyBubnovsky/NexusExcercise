// ConfirmModal – reusable confirmation dialog built with react-modal.
// Replace window.confirm() with a styled React modal.
//
// Props:
//   isOpen    (bool)     – whether the modal is visible
//   title     (string)   – modal heading
//   message   (string)   – body text / question
//   onConfirm (function) – called when user clicks "Confirm"
//   onCancel  (function) – called when user clicks "Cancel" or closes modal
//   confirmText (string) – label for confirm button (default: "Confirm")
//   cancelText  (string) – label for cancel button  (default: "Cancel")
//   danger    (bool)     – if true, confirm button is red (destructive action)

import Modal from 'react-modal';

// Bind modal to the app root for accessibility (screen readers)
Modal.setAppElement('#root');

const overlayStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const contentStyle = {
  position: 'relative',
  inset: 'auto',
  maxWidth: 420,
  width: '90%',
  padding: '24px',
  borderRadius: '10px',
  border: 'none',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
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
      shouldCloseOnOverlayClick={true}
    >
      <h3 style={{ margin: '0 0 12px', fontSize: 18 }}>{title}</h3>
      <p style={{ margin: '0 0 20px', color: '#555', lineHeight: 1.5 }}>{message}</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button
          className="btn"
          style={{ background: '#e0e0e0', color: '#333' }}
          onClick={onCancel}
        >
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
