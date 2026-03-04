// PurchaseSuccessModal – overlay showing coupon value after a successful purchase.
// Supports STRING (code display) and IMAGE (image display) value types.

export default function PurchaseSuccessModal({ result, productName, onClose }) {
  if (!result) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="modal-overlay" onClick={onClose} />

      {/* Content */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1001,
        }}
      >
        <div className="modal-content" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3, 12px)' }}>🎉</div>
          <h3 style={{ color: 'var(--color-success, #10b981)', marginBottom: 'var(--space-2, 8px)' }}>
            Purchase Successful!
          </h3>
          <p style={{ color: 'var(--color-text-secondary, #64748b)', marginBottom: 'var(--space-5, 20px)' }}>
            Your coupon for <strong>{productName}</strong>
          </p>

          {result.value_type === 'IMAGE' ? (
            <img
              src={result.value}
              alt="Coupon"
              style={{
                maxWidth: '100%',
                borderRadius: 'var(--radius-md, 10px)',
                marginBottom: 'var(--space-5, 20px)',
              }}
            />
          ) : (
            <div className="coupon-value" style={{ marginBottom: 'var(--space-5, 20px)' }}>
              {result.value}
            </div>
          )}

          <button className="btn btn-primary btn-block" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </>
  );
}
