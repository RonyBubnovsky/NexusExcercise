// Alert – success / error message banner with slide-down animation.

export default function Alert({ type = 'error', message, onDismiss }) {
  if (!message) return null;

  return (
    <div className={`alert alert-${type}`}>
      <span style={{ flex: 1 }}>{message}</span>
      {onDismiss && (
        <button className="btn-ghost btn-sm" onClick={onDismiss} aria-label="Dismiss">
          ✕
        </button>
      )}
    </div>
  );
}
