// Loader – animated spinner shown while data is loading.

export default function Loader({ text = 'Loading…' }) {
  return (
    <div className="loader">
      <div className="spinner" />
      <span>{text}</span>
    </div>
  );
}
