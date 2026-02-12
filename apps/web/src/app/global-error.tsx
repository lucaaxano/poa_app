'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="de">
      <body>
        <div style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#f8fafc',
        }}>
          <div style={{
            maxWidth: '28rem',
            width: '100%',
            textAlign: 'center',
            padding: '2rem',
            borderRadius: '1rem',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              margin: '0 auto 1rem',
              borderRadius: '50%',
              backgroundColor: '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
            }}>
              !
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Kritischer Fehler
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
              Die Anwendung konnte nicht geladen werden. Bitte versuchen Sie es erneut.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#ffffff',
                backgroundColor: '#0f172a',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
              }}
            >
              Seite neu laden
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
