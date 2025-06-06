
import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFFFFF', // White background
          borderRadius: '4px', 
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24" 
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#64748B" // Current primary color: hsl(206 14% 47%)
          strokeWidth="2.5" // Slightly thicker for better visibility at small sizes
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="20" height="5" x="2" y="3" rx="1" />
          <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
          <path d="M10 12h4" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
