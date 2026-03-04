// CouponForm – reusable create / edit form for coupons.
// Props:
//   values     – current form values object
//   onChange   – (field, value) handler
//   onSubmit   – form submit handler
//   submitting – disable button while saving
//   submitText – button label
//   onCancel   – (optional) show a Cancel button

import FormField from '../../components/ui/FormField';

export default function CouponForm({ values, onChange, onSubmit, submitting, submitText, onCancel }) {
  const set = (field) => (e) => onChange(field, e.target.value);

  return (
    <form onSubmit={onSubmit}>
      <FormField label="Name">
        <input value={values.name} onChange={set('name')} required />
      </FormField>

      <FormField label="Description">
        <textarea value={values.description} onChange={set('description')} />
      </FormField>

      <FormField label="Image URL">
        <input
          type="url"
          value={values.image_url}
          onChange={set('image_url')}
          placeholder="https://…"
          pattern="https://.*"
          title="Must start with https://"
          required
        />
      </FormField>

      <div className="form-row form-row-2">
        <FormField label="Cost Price ($)">
          <input
            type="number"
            step="0.01"
            min="0"
            value={values.cost_price}
            onChange={set('cost_price')}
            required
          />
        </FormField>
        <FormField label="Margin (%)">
          <input
            type="number"
            step="0.01"
            min="0"
            value={values.margin_percentage}
            onChange={set('margin_percentage')}
            required
          />
        </FormField>
      </div>

      <div className="form-row form-row-1-2">
        <FormField label="Value Type">
          <select value={values.value_type} onChange={set('value_type')}>
            <option value="STRING">STRING</option>
            <option value="IMAGE">IMAGE</option>
          </select>
        </FormField>
        <FormField label={values.value_type === 'IMAGE' ? 'Coupon Image URL' : 'Coupon Value'}>
          <input
            type={values.value_type === 'IMAGE' ? 'url' : 'text'}
            value={values.value}
            onChange={set('value')}
            placeholder={values.value_type === 'IMAGE' ? 'https://…' : 'ABCD-1234'}
            pattern={values.value_type === 'IMAGE' ? 'https://.*' : undefined}
            title={values.value_type === 'IMAGE' ? 'Must start with https://' : undefined}
            required
          />
        </FormField>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : submitText}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
