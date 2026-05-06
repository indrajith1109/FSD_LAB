const Toast = ({ toast, onClose }) => {
  if (!toast) return null

  return (
    <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
      <span>{toast.message}</span>
      <button type="button" className="ghost" onClick={onClose}>
        Dismiss
      </button>
    </div>
  )
}

export default Toast

