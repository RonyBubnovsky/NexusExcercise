// StorePage – lists all available (unsold) coupons for customers.
// Clicking a card opens the detail / purchase view.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAvailableProducts } from '../services/api';

export default function StorePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getAvailableProducts();
        setProducts(data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) return <div className="loading">Loading products…</div>;
  if (error) return <div className="error-msg">{error}</div>;

  return (
    <div>
      <h1>Coupon Store</h1>
      {products.length === 0 ? (
        <p>No coupons available right now. Check back later!</p>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <Link
              to={`/product/${product._id}`}
              key={product._id}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="product-card">
                {product.image_url && (
                  <img src={product.image_url} alt={product.name} />
                )}
                <h3>{product.name}</h3>
                <p className="description">{product.description}</p>
                <p className="price">
                  ${Number(product.minimum_sell_price).toFixed(2)}
                </p>
                <span className="badge badge-available">Available</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
