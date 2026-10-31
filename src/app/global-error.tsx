'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

const pageStyle = {
  minHeight: '100vh',
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  background: '#f8fafc',
  color: '#0f172a',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
} as const;

const cardStyle = {
  width: '100%',
  maxWidth: '420px',
  padding: '32px',
  borderRadius: '16px',
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  textAlign: 'center',
} as const;

const primaryButtonStyle = {
  width: '100%',
  padding: '10px 16px',
  borderRadius: '10px',
  border: 'none',
  background: '#0f172a',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
} as const;

const secondaryButtonStyle = {
  ...primaryButtonStyle,
  marginTop: '8px',
  background: 'transparent',
  border: '1px solid #cbd5e1',
  color: '#0f172a',
} as const;

/**
 * Last resort boundary: it replaces the root layout, so global styles, fonts and
 * the toast layer are gone. Everything here is inline on purpose — a fallback
 * that depends on the app's own CSS is not a fallback.
 */
export default function GlobalError({ error, retry }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[global] root layout failed', {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return (
    <html lang="es">
      <body style={{ margin: 0 }}>
        <title>Error crítico · helpth0</title>
        <div style={pageStyle}>
          <main style={cardStyle}>
            <h1 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>
              La aplicación se detuvo
            </h1>
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#64748b', margin: '0 0 8px' }}>
              Ocurrió un problema inesperado al cargar la aplicación. Podés reintentar o recargar
              la página.
            </p>
            {error.digest && (
              <p
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: '11px',
                  color: '#94a3b8',
                  margin: '0 0 20px',
                }}
              >
                Código de referencia: {error.digest}
              </p>
            )}
            <div style={{ marginTop: '16px' }}>
              <button type="button" onClick={() => retry()} style={primaryButtonStyle}>
                Reintentar
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={secondaryButtonStyle}
              >
                Recargar página
              </button>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
