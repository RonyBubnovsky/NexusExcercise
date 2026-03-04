// FormField – labeled form input wrapper.
// Keeps form markup DRY across create/edit forms.

export default function FormField({ label, children }) {
  return (
    <div className="form-field">
      <label>{label}</label>
      {children}
    </div>
  );
}
