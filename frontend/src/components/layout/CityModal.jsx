import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { listCities } from '@/api/catalog.api';
import { qk } from '@/api/queryKeys';
import { useUiStore } from '@/store/uiStore';
import { ErrorState, Modal, Skeleton } from '@/components/ui';

export function CityPicker({ onPick }) {
  const city = useUiStore((s) => s.city);
  const q = useQuery({ queryKey: qk.cities, queryFn: listCities, staleTime: 10 * 60 * 1000 });
  if (q.isLoading) return <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-11" />)}</div>;
  if (q.isError) return <ErrorState error={q.error} onRetry={q.refetch} title="Couldn't load cities" />;
  const items = q.data?.items || [];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((c) => (
        <button
          key={c.name}
          type="button"
          onClick={() => onPick(c.name)}
          aria-pressed={city === c.name}
          className={`flex h-11 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-colors ${city === c.name ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-ink-200 bg-white text-ink-800 hover:border-brand-600'}`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}

export function CityModal() {
  const { cityModalOpen, closeCityModal, setCity } = useUiStore();
  return (
    <Modal open={cityModalOpen} onClose={closeCityModal} title="Choose your city" footer={<button type="button" onClick={() => setCity(null)} className="text-sm font-semibold text-ink-600 hover:text-ink-900">Show all cities</button>}>
      <p className="mb-3 flex items-center gap-1.5 text-sm text-ink-500"><MapPin className="h-4 w-4" aria-hidden="true" /> We'll show movies, events and venues near you.</p>
      <CityPicker onPick={setCity} />
    </Modal>
  );
}
