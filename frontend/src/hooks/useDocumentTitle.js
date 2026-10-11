import { useEffect } from 'react';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ShowTime` : 'ShowTime — Movie & event tickets';
  }, [title]);
}
