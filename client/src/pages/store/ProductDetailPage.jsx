// ProductDetailPage – single coupon detail view with purchase option.
// Kept for direct-link access (/product/:id).

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductById, purchaseProduct } from '../../services/api';
import PurchaseSuccessModal from '../../components/modals/PurchaseSuccessModal';
import Loader from '../../components/ui/Loader';
import Alert from '../../components/ui/Alert';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProductById(id);
        setProduct(data.data || data);
      } catch (err) {
        setError(err.response?.data?.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handlePurchase = async () => {
    setPurchasing(true);
    setError(null);
    try {
      const data = await purchaseProduct(id);
      setPurchaseResult(data.data || data);
    } catch (err) {
      setError(err.response?.data?.message || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) return <Loader />;
  if (error && !product) return <Alert type="error" message={error} />;

  return (
    <div>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 'var(--space-4)' }}>
        ← Back to Store
      </Link>

      <div className="card card-static" style={{ maxWidth: 500 }}>
        {product.image_url && <img src={product.image_url} alt={product.name} />}
        <h2>{product.name}</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
          {product.description}
        </p>
        <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-success)', marginBottom: 'var(--space-4)' }}>
          ${Number(product.price).toFixed(2)}
        </p>

        <Alert type="error" message={error} />

        <button
          className="btn btn-success btn-block"
          onClick={handlePurchase}
          disabled={purchasing}
        >
          {purchasing ? 'Processing…' : 'Buy Now'}
        </button>
      </div>

      <PurchaseSuccessModal
        result={purchaseResult}
        productName={product?.name}
        onClose={() => setPurchaseResult(null)}
      />
    </div>
  );
}
