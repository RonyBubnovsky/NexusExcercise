// AdminDashboardPage – create coupons, view/edit/delete all coupons.

import { useEffect, useState, useCallback } from 'react';
import {
  adminGetAllProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
} from '../../services/api';
import PageHeader from '../../components/layout/PageHeader';
import AdminCouponCard from '../../components/cards/AdminCouponCard';
import ConfirmModal from '../../components/modals/ConfirmModal';
import Loader from '../../components/ui/Loader';
import Alert from '../../components/ui/Alert';
import CouponForm from './CouponForm';

const EMPTY = {
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
  const [successMsg, setSuccessMsg] = useState(null);

  // Create form
  const [form, setForm] = useState(EMPTY);
  const [creating, setCreating] = useState(false);

  // Edit form
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  // If any API call returns 401 or fails to send (e.g. invalid token chars), force logout
  const handleAuthError = useCallback((err) => {
    if (err.response?.status === 401 || !err.response) {
      onLogout();
      return true;
    }
    return false;
  }, [onLogout]);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await adminGetAllProducts(token);
      setProducts(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(err.response?.data?.message || 'Failed to load products');
      }
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // --- Create ---
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    clearMessages();
    try {
      await adminCreateProduct(token, {
        name: form.name,
        description: form.description,
        image_url: form.image_url || undefined,
        cost_price: Number(form.cost_price),
        margin_percentage: Number(form.margin_percentage),
        value_type: form.value_type,
        value: form.value,
      });
      setForm(EMPTY);
      setSuccessMsg('Coupon created successfully!');
      setLoading(true);
      await fetchProducts();
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(err.response?.data?.message || 'Failed to create coupon');
      }
    } finally {
      setCreating(false);
    }
  };

  // --- Edit ---
  const startEdit = (coupon) => {
    clearMessages();
    setEditingId(coupon._id);
    setEditForm({
      name: coupon.name || '',
      description: coupon.description || '',
      image_url: coupon.image_url || '',
      cost_price: coupon.cost_price ?? '',
      margin_percentage: coupon.margin_percentage ?? '',
      value_type: coupon.value_type || 'STRING',
      value: coupon.value || '',
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    clearMessages();
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
      if (!handleAuthError(err)) {
        setError(err.response?.data?.message || 'Failed to update coupon');
      }
    }
  };

  // --- Delete ---
  const handleDelete = async () => {
    const id = deleteTarget._id;
    setDeleteTarget(null);
    clearMessages();
    try {
      await adminDeleteProduct(token, id);
      setSuccessMsg('Coupon deleted successfully!');
      setLoading(true);
      await fetchProducts();
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(err.response?.data?.message || 'Failed to delete coupon');
      }
    }
  };

  // --- Delete All ---
  const handleDeleteAll = async () => {
    setShowDeleteAll(false);
    setDeletingAll(true);
    clearMessages();
    let deleted = 0;
    for (const p of products) {
      try {
        await adminDeleteProduct(token, p._id);
        deleted++;
      } catch (err) {
        if (handleAuthError(err)) return;
      }
    }
    setDeletingAll(false);
    setSuccessMsg(`Deleted ${deleted} of ${products.length} coupons.`);
    setLoading(true);
    await fetchProducts();
  };

  const clearMessages = () => { setError(null); setSuccessMsg(null); };

  return (
    <div>
      <PageHeader title="Admin Dashboard">
        <button className="btn btn-danger" onClick={onLogout}>Logout</button>
      </PageHeader>

      <Alert type="error" message={error} onDismiss={() => setError(null)} />
      <Alert type="success" message={successMsg} onDismiss={() => setSuccessMsg(null)} />

      {/* --- Create Section --- */}
      <div className="section">
        <h2 className="section-header">Create New Coupon</h2>
        <CouponForm
          values={form}
          onChange={(field, val) => setForm((p) => ({ ...p, [field]: val }))}
          onSubmit={handleCreate}
          submitting={creating}
          submitText="Create Coupon"
        />
      </div>

      {/* --- Edit Section --- */}
      {editingId && (
        <div className="section" style={{ borderLeft: '3px solid var(--color-primary)' }}>
          <h2 className="section-header">Edit Coupon</h2>
          <CouponForm
            values={editForm}
            onChange={(field, val) => setEditForm((p) => ({ ...p, [field]: val }))}
            onSubmit={handleUpdate}
            submitting={false}
            submitText="Save Changes"
            onCancel={() => setEditingId(null)}
          />
        </div>
      )}

      {/* --- Coupon List --- */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h2>All Coupons ({products.length})</h2>
        {products.length > 0 && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setShowDeleteAll(true)}
            disabled={deletingAll}
          >
            {deletingAll ? 'Deleting…' : 'Delete All'}
          </button>
        )}
      </div>

      {loading ? (
        <Loader text="Loading coupons…" />
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <AdminCouponCard
              key={p._id}
              coupon={p}
              onEdit={startEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Delete Coupon"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <ConfirmModal
        isOpen={showDeleteAll}
        title="Delete All Coupons"
        message={`This will permanently delete all ${products.length} coupons. Are you sure?`}
        confirmText="Delete All"
        danger
        onCancel={() => setShowDeleteAll(false)}
        onConfirm={handleDeleteAll}
      />
    </div>
  );
}
