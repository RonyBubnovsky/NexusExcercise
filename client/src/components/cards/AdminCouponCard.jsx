// AdminCouponCard – admin view of a coupon with pricing details, edit/delete actions.

export default function AdminCouponCard({ coupon, onEdit, onDelete }) {
  return (
    <div className="card card-static">
      {coupon.image_url && <img src={coupon.image_url} alt={coupon.name} />}

      <h3 style={{ marginBottom: 'var(--space-1)' }}>{coupon.name}</h3>

      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
        {coupon.description}
      </p>

      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
        Cost: ${Number(coupon.cost_price).toFixed(2)} · Margin: {coupon.margin_percentage}%
      </p>

      <p style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-success)', marginBottom: 'var(--space-3)' }}>
        ${Number(coupon.minimum_sell_price).toFixed(2)}
      </p>

      <span className={`badge ${coupon.is_sold ? 'badge-sold' : 'badge-available'}`}>
        {coupon.is_sold ? 'Sold' : 'Available'}
      </span>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
        {!coupon.is_sold && (
          <button className="btn btn-primary btn-sm" onClick={() => onEdit(coupon)}>
            Edit
          </button>
        )}
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(coupon)}>
          Delete
        </button>
      </div>
    </div>
  );
}
