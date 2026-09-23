'use client'

import { Link, useConfig } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

const MARK = (
  <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="1" y="1" width="30" height="30" rx="8" fill="#10b981" />
    <path d="M21 11.4a7.4 7.4 0 1 0 0 9.2" stroke="#052e22" strokeWidth="3.4" strokeLinecap="round" fill="none" />
  </svg>
)

export const NavBrand = () => {
  const {
    config: { routes },
  } = useConfig()
  const pathname = usePathname()
  const dashUrl = formatAdminURL({ adminRoute: routes.admin })
  const isDashboard = pathname === routes.admin

  return (
    <div className="gm-nav-brand">
      <Link className="gm-nav-brand__link" href={dashUrl} prefetch={false}>
        <span className="gm-nav-brand__mark">{MARK}</span>
        <span className="gm-nav-brand__text">
          <span className="gm-nav-brand__name">Greenman CMS</span>
          <span className="gm-nav-brand__sub">Content Management System</span>
        </span>
      </Link>
      <Link
        className={isDashboard ? 'gm-nav-dash gm-nav-dash--active' : 'gm-nav-dash'}
        href={dashUrl}
        prefetch={false}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="7.5" height="9" rx="2" />
          <rect x="13.5" y="3" width="7.5" height="5.5" rx="2" />
          <rect x="13.5" y="12" width="7.5" height="9" rx="2" />
          <rect x="3" y="15.5" width="7.5" height="5.5" rx="2" />
        </svg>
        <span>Dashboard</span>
      </Link>
    </div>
  )
}

export default NavBrand