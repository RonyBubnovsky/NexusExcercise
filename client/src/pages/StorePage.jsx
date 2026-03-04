// StorePage – lists all available (unsold) coupons for customers.
// Each card has a Buy button that opens a confirm dialog, then shows the coupon value on success.

import { useEffect, useState } from 'react';
import { getAvailableProducts, purchaseProduct } from '../services/api';
import ConfirmModal from '../components/ConfirmModal';

export default function StorePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Confirm-purchase modal state
  const [buyTarget, setBuyTarget] = useState(null);
  const [purchasing, setPurchasing] = useState(false);

  // Purchase result modal state
  const [purchaseResult, setPurchaseResult] = useState(null);
  const [purchasedProduct, setPurchasedProduct] = useState(null);

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

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleConfirmPurchase = async () => {
    if (!buyTarget) return;
    setPurchasing(true);
    setError(null);
    try {
      const data = await purchaseProduct(buyTarget.id);
      const result = data.data || data;
      setPurchaseResult(result);
      setPurchasedProduct(buyTarget);
      setBuyTarget(null);
      // Remove the purchased product from the list
      setProducts((prev) => prev.filter((p) => p.id !== buyTarget.id));
    } catch (err) {
      setBuyTarget(null);
      setError(err.response?.data?.message || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) return <div className="loading">Loading products…</div>;

  return (
    <div>
      <h1>Coupon Store</h1>

      {error && <div className="error-msg">{error}</div>}

      {products.length === 0 && !purchaseResult ? (
        <p>No coupons available right now. Check back later!</p>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <div className="product-card" key={product.id}>
              {product.image_url && (
                <img src={product.image_url} alt={product.name} />
              )}
              <h3>{product.name}</h3>
              <p className="description">{product.description}</p>
              <p className="price">${Number(product.price).toFixed(2)}</p>
              <button
                className="btn btn-success"
                style={{ marginTop: 8, width: '100%' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setBuyTarget(product);
                }}
              >
                Buy Now
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Confirm purchase modal */}
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

      {/* Purchase success overlay with coupon value */}
      {purchaseResult && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1001,
            background: '#fff',
            borderRadius: 10,
            padding: 24,
            maxWidth: 420,
            width: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            textAlign: 'center',
          }}
        >
          <h3 style={{ marginBottom: 8, color: '#27ae60' }}>
            Purchase Successful!
          </h3>
          <p style={{ color: '#555', marginBottom: 12 }}>
            Your coupon for <strong>{purchasedProduct?.name}</strong>:
          </p>
          {purchaseResult.value_type === 'IMAGE' ? (
            <img
              src={purchaseResult.value}
              alt="Coupon"
              style={{ maxWidth: '100%', borderRadius: 6, marginBottom: 12 }}
            />
          ) : (
            <div className="coupon-value" style={{ marginBottom: 12 }}>
              {purchaseResult.value}
            </div>
          )}
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => {
              setPurchaseResult(null);
              setPurchasedProduct(null);
            }}
          >
            Close
          </button>
        </div>
      )}
      {/* Dark overlay behind success result */}
      {purchaseResult && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 1000,
          }}
          onClick={() => {
            setPurchaseResult(null);
            setPurchasedProduct(null);
          }}
        />
      )}
    </div>
  );
}
