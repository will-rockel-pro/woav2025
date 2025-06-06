
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
  // Accent color from your theme: HSL(267, 33%, 64%) which is approximately #A382C7
  const accentColor = '#A382C7';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: accentColor,
          borderRadius: '4px', // Keep the rounded corners for a softer look
        }}
      >
        {/* No icon, just a solid color background */}
      </div>
    ),
    {
      ...size,
    }
  )
}
