const variants = {
  Completed: 'badge-success',
  Ready: 'badge-success',
  Demo: 'badge-warning',
};

export default function StatusBadge({ status }) {
  return <span className={`badge ${variants[status] ?? ''}`}>{status}</span>;
}
