import React from 'react'

const MARK = (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="1" y="1" width="30" height="30" rx="8" fill="#10b981" />
    <path d="M21 11.4a7.4 7.4 0 1 0 0 9.2" stroke="#052e22" strokeWidth="3.4" strokeLinecap="round" fill="none" />
  </svg>
)

export const Icon = () => MARK

export const Logo = () => (
  <span className="gm-logo">
    <span className="gm-logo__mark">{MARK}</span>
    <span className="gm-logo__text">
      <span className="gm-logo__name">CMS</span>
      <span className="gm-logo__sub">Content Management</span>
    </span>
  </span>
)

export default Logo