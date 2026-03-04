// AdminDashboardPage – admin panel showing all coupons and a create form.
// Requires a valid JWT token passed as prop.

import { useEffect, useState } from 'react';
import {
  adminGetAllProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
} from '../services/api';

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
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const fetchProducts = async () => {
    try {
      const data = await adminGetAllProducts(token);
      setProducts(Array.isArray(data) ? data : data.data || []);
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

      {/* --- Edit Modal --- */}
      {editingId && (
        <div className="admin-form" style={{ border: '2px solid #4a90d9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Edit Coupon</h2>
            <button className="btn" onClick={() => setEditingId(null)}>Cancel</button>
          </div>
          <form onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            try {
              const payload = {};
              if (editForm.name) payload.name = editForm.name;
              if (editForm.description) payload.description = editForm.description;
              if (editForm.image_url) payload.image_url = editForm.image_url;
              if (editForm.cost_price !== '') payload.cost_price = Number(editForm.cost_price);
              if (editForm.margin_percentage !== '') payload.margin_percentage = Number(editForm.margin_percentage);
              if (editForm.value_type) payload.value_type = editForm.value_type;
              if (editForm.value) payload.value = editForm.value;
              await adminUpdateProduct(token, editingId, payload);
              setEditingId(null);
              setSuccessMsg('Coupon updated successfully!');
              setLoading(true);
              await fetchProducts();
            } catch (err) {
              setError(err.response?.data?.message || 'Failed to update coupon');
            }
          }}>
            <div className="form-group">
              <label>Name</label>
              <input name="name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Image URL</label>
              <input name="image_url" value={editForm.image_url} onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Cost Price ($)</label>
                <input name="cost_price" type="number" step="0.01" min="0" value={editForm.cost_price} onChange={(e) => setEditForm({ ...editForm, cost_price: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Margin (%)</label>
                <input name="margin_percentage" type="number" step="0.01" min="0" value={editForm.margin_percentage} onChange={(e) => setEditForm({ ...editForm, margin_percentage: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
              <div className="form-group">
                <label>Value Type</label>
                <select name="value_type" value={editForm.value_type} onChange={(e) => setEditForm({ ...editForm, value_type: e.target.value })}>
                  <option value="STRING">STRING</option>
                  <option value="IMAGE">IMAGE</option>
                </select>
              </div>
              <div className="form-group">
                <label>Coupon Value / URL</label>
                <input name="value" value={editForm.value} onChange={(e) => setEditForm({ ...editForm, value: e.target.value })} />
              </div>
            </div>
            <button className="btn btn-primary" type="submit">Save Changes</button>
          </form>
        </div>
      )}

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
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                {!p.is_sold && (
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: 12, padding: '6px 12px' }}
                    onClick={() => {
                      setEditingId(p._id);
                      setEditForm({
                        name: p.name || '',
                        description: p.description || '',
                        image_url: p.image_url || '',
                        cost_price: p.cost_price ?? '',
                        margin_percentage: p.margin_percentage ?? '',
                        value_type: p.value_type || 'STRING',
                        value: p.value || '',
                      });
                      setSuccessMsg(null);
                      setError(null);
                    }}
                  >
                    Edit
                  </button>
                )}
                <button
                  className="btn btn-danger"
                  style={{ fontSize: 12, padding: '6px 12px' }}
                  onClick={async () => {
                    if (!window.confirm(`Delete "${p.name}"?`)) return;
                    try {
                      await adminDeleteProduct(token, p._id);
                      setSuccessMsg('Coupon deleted successfully!');
                      setLoading(true);
                      await fetchProducts();
                    } catch (err) {
                      setError(err.response?.data?.message || 'Failed to delete coupon');
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
