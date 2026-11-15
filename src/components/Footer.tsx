import { LockKeyhole } from 'lucide-react';
import type { NavbarItem, SiteSettings } from '../types/cms.ts';

interface FooterProps {
  settings: SiteSettings;
  menuItems: NavbarItem[];
  onOpenAdmin: () => void;
}

/**
 * ส่วนท้ายเว็บไซต์ (Footer)
 * แสดงชื่อหน่วยงาน: งานบริหารและพัฒนาทรัพยากรบุคคล ฝ่ายบริหารทรัพยากร วิทยาลัยการอาชีพด่านซ้าย
 */
export function Footer({ settings, menuItems, onOpenAdmin }: FooterProps) {
  const visibleMenus = [...menuItems]
    .filter((m) => m.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <footer className="bg-[#0F2D5C] text-slate-200 border-t border-blue-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-blue-800/70">
          <div className="md:col-span-6 flex flex-col sm:flex-row items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-white p-1.5 shrink-0 shadow-xs">
              <img
                src="assets/aistudio/01ecb920-6706-49b0-99cc-541878dd9c36_c6f4a6e0.png"
                alt="ตราสัญลักษณ์งานบริหารและพัฒนาทรัพยากรบุคคล วิทยาลัยการอาชีพด่านซ้าย"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-lg font-semibold text-white">
                {settings.divisionName} {settings.organizationName}
              </h2>
              <p className="text-sm text-blue-100/90 leading-relaxed max-w-lg">
                ศูนย์กลางข้อมูลข่าวสาร ลิงก์บริการอิเล็กทรอนิกส์ และงานทะเบียนประวัติบุคลากร เพื่อการบริหารงานบุคคลที่มีประสิทธิภาพและโปร่งใส
              </p>
              <p className="text-xs text-blue-200/80 pt-1">{settings.address}</p>
            </div>
          </div>

          <div className="md:col-span-3 space-y-2.5">
            <h3 className="font-display text-sm font-semibold text-white">เมนูลัด</h3>
            <ul className="space-y-1.5 text-sm">
              {visibleMenus.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    target={item.type === 'external' ? '_blank' : undefined}
                    rel={item.type === 'external' ? 'noopener noreferrer' : undefined}
                    className="text-blue-100 hover:text-white transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3 space-y-2.5">
            <h3 className="font-display text-sm font-semibold text-white">ติดต่อ & ผู้ดูแลระบบ</h3>
            <p className="text-sm text-blue-100 font-mono-num">โทร: {settings.phone}</p>
            <p className="text-sm text-blue-100 font-mono-num">อีเมล: {settings.email}</p>
            <p className="text-xs text-blue-200">{settings.officeHours}</p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-100 hover:text-white underline underline-offset-4 cursor-pointer"
              >
                <LockKeyhole className="w-3.5 h-3.5" aria-hidden="true" />
                <span>เข้าสู่ระบบหลังบ้าน (Admin CMS)</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-blue-200/80">
          <p>
            © {new Date().getFullYear() + 543} งานบริหารและพัฒนาทรัพยากรบุคคล ฝ่ายบริหารทรัพยากร วิทยาลัยการอาชีพด่านซ้าย
          </p>
          <p>พัฒนาเพื่อให้บริการบุคลากรภายในองค์กร</p>
        </div>
      </div>
    </footer>
  );
}
