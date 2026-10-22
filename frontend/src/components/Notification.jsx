export default function Notification({ notification }) {
  if (!notification) return null;

  const typeMap = {
    success: 'toast--success',
    error: 'toast--error',
    info: 'toast--info',
  };

  return (
    <div className="toast-container">
      <div className={`toast ${typeMap[notification.type] ?? 'toast--info'}`}>
        {notification.msg}
      </div>
    </div>
  );
}
