import { Outlet, ScrollRestoration } from 'react-router-dom';
import { CityModal } from '@/components/layout/CityModal';
import { Toaster } from '@/components/ui';

export default function RootLayout() {
  return (
    <>
      <Outlet />
      <CityModal />
      <Toaster />
      <ScrollRestoration />
    </>
  );
}
