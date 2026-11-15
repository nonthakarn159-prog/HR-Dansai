import { useState } from 'react';
import { ArrowLeft, ExternalLink, Menu, Settings2, X } from 'lucide-react';
import type { NavbarItem } from '../types/cms.ts';

interface NavbarProps {
  brandTitle: string;
  menuItems: NavbarItem[];
  isAdminMode: boolean;
  onToggleAdmin: () => void;
  onExitAdmin: () => void;
}

/**
 * แถบเมนูนำทางด้านบน (Top Navigation Bar)
 * รองรับเมนูที่ปรับแต่งได้จากระบบหลังบ้าน (CMS) และเมนู Hamburger บนมือถือ
 */
export function Navbar({
  brandTitle,
  menuItems,
  isAdminMode,
  onToggleAdmin,
  onExitAdmin,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleMenus = [...menuItems]
    .filter((item) => item.visible)
    .sort((a, b) => a.order - b.order);

  const handleNavClick = (item: NavbarItem) => {
    setMobileOpen(false);
    if (isAdminMode) {
      onExitAdmin();
      if (item.type === 'anchor') {
        setTimeout(() => {
          const el = document.querySelector(item.href);
          el?.scrollIntoView({ behavior: 'smooth' });
        }, 60);
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Logo + Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            if (isAdminMode) {
              e.preventDefault();
              onExitAdmin();
            }
          }}
          className="inline-flex items-center gap-2.5 font-display text-base sm:text-lg font-semibold tracking-tight text-[#0F2D5C] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded-md px-1 -ml-1"
        >
          <img
            src="assets/aistudio/01ecb920-6706-49b0-99cc-541878dd9c36_c6f4a6e0.png"
            alt="โลโก้งานบริหารและพัฒนาทรัพยากรบุคคล วิทยาลัยการอาชีพด่านซ้าย"
            className="w-10 h-10 object-contain shrink-0"
          />
          <span>{brandTitle}</span>
        </a>

        {/* Zone 2: Dynamic Single-Line Nav Links (Desktop) */}
        {!isAdminMode ? (
          <nav
            aria-label="เมนูหลัก"
            className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600 overflow-x-auto"
          >
            {visibleMenus.map((item) =>
              item.type === 'external' ? (
                <a
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0F2D5C] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-blue-700"
                >
                  <span>{item.label}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                </a>
              ) : (
                <a
                  key={item.id}
                  href={item.href}
                  className="text-slate-600 hover:text-[#0F2D5C] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-blue-700"
                >
                  {item.label}
                </a>
              )
            )}
          </nav>
        ) : (
          <div className="hidden lg:flex items-center text-sm font-medium text-slate-600 whitespace-nowrap">
            ระบบจัดการเว็บไซต์สำเร็จรูป (Admin CMS)
          </div>
        )}

        {/* Zone 3: Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          {isAdminMode ? (
            <button
              type="button"
              onClick={onExitAdmin}
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-sm font-medium text-[#0F2D5C] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>ดูหน้าเว็บไซต์จริง</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleAdmin}
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-sm font-medium text-white bg-[#0F2D5C] hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            >
              <Settings2 className="w-4 h-4" aria-hidden="true" />
              <span>จัดการระบบ</span>
            </button>
          )}

          {!isAdminMode && (
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'ปิดเมนูนำทาง' : 'เปิดเมนูนำทาง'}
              className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && !isAdminMode && (
        <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-3 space-y-1">
          {visibleMenus.map((item) =>
            item.type === 'external' ? (
              <a
                key={item.id}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleNavClick(item)}
                className="flex items-center justify-between px-3 min-h-[44px] text-base font-medium text-slate-700 hover:text-[#0F2D5C] hover:bg-slate-50 rounded-lg transition-colors"
              >
                <span>{item.label}</span>
                <ExternalLink className="w-4 h-4 text-slate-400" aria-hidden="true" />
              </a>
            ) : (
              <a
                key={item.id}
                href={item.href}
                onClick={() => handleNavClick(item)}
                className="flex items-center px-3 min-h-[44px] text-base font-medium text-slate-700 hover:text-[#0F2D5C] hover:bg-slate-50 rounded-lg transition-colors"
              >
                {item.label}
              </a>
            )
          )}
        </div>
      )}
    </header>
  );
}
