// StorePage – customer-facing grid of available coupons.
// Buy button on each card → ConfirmModal → PurchaseSuccessModal.

import { useEffect, useState } from 'react';
import { getAvailableProducts, purchaseProduct } from '../../services/api';
import ProductCard from '../../components/cards/ProductCard';
import ConfirmModal from '../../components/modals/ConfirmModal';
import PurchaseSuccessModal from '../../components/modals/PurchaseSuccessModal';
import PageHeader from '../../components/layout/PageHeader';
import Loader from '../../components/ui/Loader';
import Alert from '../../components/ui/Alert';

export default function StorePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [buyTarget, setBuyTarget] = useState(null);
  const [purchasing, setPurchasing] = useState(false);

  const [purchaseResult, setPurchaseResult] = useState(null);
  const [purchasedName, setPurchasedName] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getAvailableProducts();
      setProducts(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!buyTarget) return;
    setPurchasing(true);
    setError(null);
    try {
      const data = await purchaseProduct(buyTarget.id);
      const result = data.data || data;
      setPurchaseResult(result);
      setPurchasedName(buyTarget.name);
      setProducts((prev) => prev.filter((p) => p.id !== buyTarget.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Purchase failed');
    } finally {
      setBuyTarget(null);
      setPurchasing(false);
    }
  };

  if (loading) return <Loader text="Loading coupons…" />;

  return (
    <div>
      <PageHeader title="Coupon Store" subtitle={`${products.length} coupons available`} />

      <Alert type="error" message={error} onDismiss={() => setError(null)} />

      {products.length === 0 && !purchaseResult ? (
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <p>No coupons available right now. Check back later!</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onBuy={setBuyTarget}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={buyTarget !== null}
        title="Confirm Purchase"
        message={
          buyTarget
            ? `Buy "${buyTarget.name}" for $${Number(buyTarget.price).toFixed(2)}?`
            : ''
        }
        confirmText={purchasing ? 'Processing…' : 'Buy'}
        cancelText="Cancel"
        onConfirm={handleConfirmPurchase}
        onCancel={() => !purchasing && setBuyTarget(null)}
      />

      <PurchaseSuccessModal
        result={purchaseResult}
        productName={purchasedName}
        onClose={() => setPurchaseResult(null)}
      />
    </div>
  );
}
