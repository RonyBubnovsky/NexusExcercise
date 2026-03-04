// AdminDashboardPage – admin panel showing all coupons and a create form.
// Requires a valid JWT token passed as prop.

import { useEffect, useState } from 'react';
import { adminGetAllProducts, adminCreateProduct } from '../services/api';

const EMPTY_FORM = {
  name: '',
  description: '',
  image_url: '',
  cost_price: '',
  margin_percentage: '',
  value_type: 'STRING',
  value: '',
};

export default function AdminDashboardPage({ token, onLogout }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchProducts = async () => {
    try {
      const data = await adminGetAllProducts(token);
      setProducts(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        image_url: form.image_url || undefined,
        cost_price: Number(form.cost_price),
        margin_percentage: Number(form.margin_percentage),
        value_type: form.value_type,
        value: form.value,
      };
      await adminCreateProduct(token, payload);
      setForm(EMPTY_FORM);
      setSuccessMsg('Coupon created successfully!');
      // Refresh list
      setLoading(true);
      await fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create coupon');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Admin Dashboard</h1>
        <button className="btn btn-danger" onClick={onLogout}>
          Logout
        </button>
      </div>

      {/* --- Create Form --- */}
      <div className="admin-form">
        <h2>Create New Coupon</h2>
        {error && <div className="error-msg">{error}</div>}
        {successMsg && <div className="success-msg">{successMsg}</div>}
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Name</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Image URL (optional)</label>
            <input name="image_url" value={form.image_url} onChange={handleChange} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Cost Price ($)</label>
              <input
                name="cost_price"
                type="number"
                step="0.01"
                min="0"
                value={form.cost_price}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Margin (%)</label>
              <input
                name="margin_percentage"
                type="number"
                step="0.01"
                min="0"
                value={form.margin_percentage}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <div className="form-group">
              <label>Value Type</label>
              <select name="value_type" value={form.value_type} onChange={handleChange}>
                <option value="STRING">STRING</option>
                <option value="IMAGE">IMAGE</option>
              </select>
            </div>
            <div className="form-group">
              <label>Coupon Value / URL</label>
              <input name="value" value={form.value} onChange={handleChange} required />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={creating}>
            {creating ? 'Creating…' : 'Create Coupon'}
          </button>
        </form>
      </div>

      {/* --- Product list --- */}
      <h2>All Coupons ({products.length})</h2>
      {loading ? (
        <div className="loading">Loading…</div>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <div className="product-card" key={p._id}>
              {p.image_url && <img src={p.image_url} alt={p.name} />}
              <h3>{p.name}</h3>
              <p className="description">{p.description}</p>
              <p style={{ fontSize: 13, color: '#888' }}>
                Cost: ${Number(p.cost_price).toFixed(2)} &middot; Margin: {p.margin_percentage}%
              </p>
              <p className="price">
                Min Sell: ${Number(p.minimum_sell_price).toFixed(2)}
              </p>
              <span className={`badge ${p.is_sold ? 'badge-sold' : 'badge-available'}`}>
                {p.is_sold ? 'Sold' : 'Available'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
