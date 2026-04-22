import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// サイトアイコンのサイズとデザインに合わせたOGP画像
export const alt = 'Bouquet-Toss';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'serif',
        }}
      >
        {/* Lucide Flower Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="240"
          height="240"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f43f5e"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5"></path>
          <path d="M12 7.5V9"></path>
          <path d="M7.5 12H9"></path>
          <path d="M16.5 12H15"></path>
          <path d="M12 16.5V15"></path>
          <path d="m8 8 1.88 1.88"></path>
          <path d="M14.12 9.88 16 8"></path>
          <path d="m8 16 1.88-1.88"></path>
          <path d="M14.12 14.12 16 16"></path>
        </svg>
        
        <div style={{ marginTop: 40, fontWeight: 900, color: '#18181b', fontSize: 80 }}>
          Bouquet-Toss
        </div>
        <div style={{ marginTop: 10, color: '#71717a', fontSize: 30 }}>
          ブーケを投げるwebアプリ
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
