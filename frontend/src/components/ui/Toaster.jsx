import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';

const tones = {
  success: ['border-ok-600/30', CheckCircle2, 'text-ok-600'],
  error: ['border-danger-600/30', XCircle, 'text-danger-600'],
  info: ['border-ink-200', Info, 'text-ink-500'],
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end">
      {toasts.map((t) => {
        const [border, Icon, iconCls] = tones[t.tone] || tones.info;
        return (
          <div key={t.id} className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white p-3.5 text-sm shadow-pop ${border}`}>
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconCls}`} aria-hidden="true" />
            <p className="flex-1 text-ink-800">{t.message}</p>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="text-ink-400 hover:text-ink-700">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
