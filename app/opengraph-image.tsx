import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#050814',
          color: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
        }}
      >
        <div style={{ color: '#67e8f9', fontSize: 30 }}>Cloud & DevOps Engineer</div>
        <div style={{ fontSize: 82, fontWeight: 900, lineHeight: 1.05 }}>Jules Munyaneza</div>
        <div style={{ fontSize: 34, marginTop: 24, color: '#cbd5e1' }}>
          Reliable cloud platforms, CI/CD, IaC and observability.
        </div>
      </div>
    ),
    size,
  );
}
