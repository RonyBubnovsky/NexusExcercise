// ProductDetailPage – shows a single coupon and allows purchase.
// On successful purchase, the coupon value (STRING or IMAGE) is displayed.

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductById, purchaseProduct } from '../services/api';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getProductById(id);
        setProduct(data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handlePurchase = async () => {
    setPurchasing(true);
    setError(null);
    try {
      const data = await purchaseProduct(id);
      setPurchaseResult(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) return <div className="loading">Loading…</div>;
  if (error && !product) return <div className="error-msg">{error}</div>;

  // After successful purchase
  if (purchaseResult) {
    return (
      <div>
        <Link to="/" style={{ textDecoration: 'none' }}>
          ← Back to Store
        </Link>
        <div className="purchase-result">
          <h3>Purchase Successful!</h3>
          <p>Your coupon for <strong>{product.name}</strong>:</p>
          {purchaseResult.value_type === 'IMAGE' ? (
            <img
              src={purchaseResult.value}
              alt="Coupon"
              style={{ maxWidth: '100%', marginTop: 12, borderRadius: 6 }}
            />
          ) : (
            <div className="coupon-value">{purchaseResult.value}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link to="/" style={{ textDecoration: 'none', color: '#4a90d9' }}>
        ← Back to Store
      </Link>

      <div className="product-card" style={{ marginTop: 16 }}>
        {product.image_url && (
          <img src={product.image_url} alt={product.name} />
        )}
        <h2>{product.name}</h2>
        <p className="description">{product.description}</p>
        <p className="price">
          ${Number(product.minimum_sell_price).toFixed(2)}
        </p>

        {error && <div className="error-msg">{error}</div>}

        <button
          className="btn btn-success"
          onClick={handlePurchase}
          disabled={purchasing}
        >
          {purchasing ? 'Processing…' : 'Buy Now'}
        </button>
      </div>
    </div>
  );
}
