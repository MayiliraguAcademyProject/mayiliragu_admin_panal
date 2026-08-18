import Toast from './Toast';
export interface ToastContainerItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContainerProps {
  toasts: ToastContainerItem[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 pointer-events-none">
      {toasts.map((item) => (
        <div key={item.id} className="pointer-events-auto">
          <Toast
            id={item.id}
            type={item.type}
            message={item.message}
            onClose={() => onRemove(item.id)}
          />
        </div>
      ))}
    </div>
  );
}
