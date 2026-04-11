'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { href: '/', label: 'Dashboard', icon: '⬡', exact: true },
    { href: '/candidates', label: 'Candidates', icon: '👥' },
];

export default function Sidebar() {
    const pathname = usePathname();

    function isActive(href, exact) {
        if (exact) return pathname === href;
        return pathname.startsWith(href);
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">🤖</div>
                <div>
                    <div className="sidebar-logo-text">Recruit AI</div>
                    <div className="sidebar-logo-sub">MVP v1.0</div>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="sidebar-section-label">Navigation</div>
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`nav-link ${isActive(item.href, item.exact) ? 'active' : ''}`}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-badge">
                    <div className="sidebar-badge-dot" />
                    <div className="sidebar-badge-text">Admin Mode</div>
                </div>
            </div>
        </aside>
    );
}
