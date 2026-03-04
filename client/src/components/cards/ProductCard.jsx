// ProductCard – store-facing coupon card with image, price, and Buy button.

export default function ProductCard({ product, onBuy }) {
  return (
    <div className="card">
      {product.image_url && (
        <img src={product.image_url} alt={product.name} />
      )}
      <h3>{product.name}</h3>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
        {product.description}
      </p>
      <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-success)' }}>
        ${Number(product.price).toFixed(2)}
      </p>
      <button
        className="btn btn-success btn-block"
        style={{ marginTop: 'var(--space-4)' }}
        onClick={() => onBuy(product)}
      >
        Buy Now
      </button>
    </div>
  );
}
