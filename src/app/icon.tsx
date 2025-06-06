
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
          borderRadius: '4px', // Rounded corners for the background
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24" // Scaled to fit within 32x32 with some padding
          height="24"
          viewBox="0 -960 960 960" // Original viewBox from Material Symbols
          fill="#64748B" // App's primary color
        >
          <path d="M200-120v-600q0-33 23.5-56.5T280-800h400q33 0 56.5 23.5T760-720v600L480-300 200-120Zm80-73 200-73 200 73v-527H280v527Zm0 0v-527 527Z"/>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
