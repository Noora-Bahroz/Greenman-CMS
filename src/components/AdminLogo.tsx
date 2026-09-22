import React from 'react'

const MARK = (
  <svg
    width="28"
    height="28"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="1" y="1" width="30" height="30" rx="8" fill="#10b981" />
    <path
      d="M9 22.5V9.5h5.2c3.1 0 5.3 1.9 5.3 4.9 0 2.4-1.4 3.9-3.3 4.5L20.5 22h-4.3l-3.6-4.2h-1v3.7H9Zm3.4-6.5h1.7c1.2 0 2-.7 2-1.7s-.8-1.7-2-1.7h-1.7v3.4Z"
      fill="#052e22"
    />
  </svg>
)

export const Icon = () => MARK

export const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    {MARK}
    <span
      style={{
        fontSize: '17px',
        fontWeight: 800,
        letterSpacing: '-0.02em',
        color: 'var(--theme-text)',
      }}
    >
      Greenman CMS
    </span>
  </div>
)

export default Logo