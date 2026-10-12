export default function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="empty-state">
      {Icon && <Icon style={{ width: 40, height: 40 }} />}
      <span className="empty-state-title">{title}</span>
      {children && <span>{children}</span>}
      {action}
    </div>
  );
}
