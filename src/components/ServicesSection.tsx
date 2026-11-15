import { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  FileCheck2,
  Search,
  X,
} from 'lucide-react';
import type { HrService } from '../types/cms.ts';
import { IconRenderer } from './IconRenderer.tsx';

interface ServicesSectionProps {
  services: HrService[];
  onNotify: (message: string) => void;
}

/**
 * ส่วนศูนย์รวมลิงก์บริการงานบุคคล (HR Services Directory)
 * รองรับการค้นหา กรองตามหมวดหมู่ คัดลอกลิงก์ และดูรายละเอียดเอกสารประกอบ
 */
export function ServicesSection({ services, onNotify }: ServicesSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<HrService | null>(null);

  const visibleServices = useMemo(
    () => [...services].filter((s) => s.visible).sort((a, b) => a.order - b.order),
    [services]
  );

  const categories = useMemo(() => {
    const unique = Array.from(new Set(visibleServices.map((s) => s.category)));
    return ['ทั้งหมด', ...unique];
  }, [visibleServices]);

  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return visibleServices.filter((s) => {
      const matchCategory = activeCategory === 'ทั้งหมด' || s.category === activeCategory;
      const matchQuery =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [visibleServices, activeCategory, searchQuery]);

  const handleCopyUrl = async (service: HrService) => {
    try {
      const targetUrl = service.url.startsWith('#')
        ? `${window.location.origin}${window.location.pathname}${service.url}`
        : service.url;
      await navigator.clipboard.writeText(targetUrl);
      setCopiedId(service.id);
      onNotify(`คัดลอกลิงก์ "${service.title}" เรียบร้อยแล้ว`);
      setTimeout(() => setCopiedId((curr) => (curr === service.id ? null : curr)), 2000);
    } catch {
      onNotify('ไม่สามารถคัดลอกลิงก์อัตโนมัติได้ กรุณาเปิดลิงก์โดยตรง');
    }
  };

  return (
    <section id="services" className="py-14 lg:py-20 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header + Search */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-blue-800 mb-2">
              01. ศูนย์รวมลิงก์บริการงานบุคคล
            </p>
            <h2
              className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              ระบบบริการและแบบฟอร์มสำหรับบุคลากร
            </h2>
            <p className="text-slate-600 mt-2 text-base">
              เลือกระบบงานบุคคลที่ต้องการใช้งาน พร้อมตรวจสอบรายการเอกสารประกอบก่อนยื่นคำขอ
            </p>
          </div>

          <div className="w-full lg:w-80">
            <label htmlFor="service-search" className="sr-only">
              ค้นหาบริการงานบุคคล
            </label>
            <div className="relative">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="service-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาระบบบริการ เช่น ใบลา, เงินเดือน..."
                className="w-full pl-10 pr-4 py-2.5 min-h-[44px] bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15"
              />
            </div>
          </div>
        </div>

        {/* Interactive Category Filter Tabs */}
        <div
          role="tablist"
          aria-label="หมวดหมู่บริการงานบุคคล"
          className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-xl w-fit max-w-full mb-8"
        >
          {categories.map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-2 min-h-[38px] text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${
                  active
                    ? 'bg-white text-[#0F2D5C] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Service Cards Grid */}
        {filteredServices.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <p className="font-display text-base font-semibold text-slate-900 mb-1">
              ไม่พบบริการที่ตรงกับคำค้นหา
            </p>
            <p className="text-sm text-slate-500 mb-4">
              ลองล้างตัวกรองหรือค้นหาด้วยคำสำคัญอื่น เช่น เงินเดือน, ใบลา, ประเมินผล
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('ทั้งหมด');
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-[#0F2D5C] hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
            >
              แสดงบริการทั้งหมด
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredServices.map((service) => {
              const isExternal = service.url.startsWith('http');
              const isCopied = copiedId === service.id;

              return (
                <article
                  key={service.id}
                  className="group bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-100 text-[#0F2D5C] flex items-center justify-center shrink-0 group-hover:bg-[#0F2D5C] group-hover:text-white transition-colors duration-200">
                        <IconRenderer name={service.icon} className="w-5 h-5" />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(service)}
                        title="คัดลอกลิงก์บริการ"
                        aria-label={`คัดลอกลิงก์ ${service.title}`}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-[#0F2D5C] hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        {isCopied ? (
                          <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                        ) : (
                          <Copy className="w-4 h-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>

                    <h3 className="font-display text-base font-semibold text-slate-900 leading-snug mb-2">
                      {service.title}
                    </h3>

                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4">
                      {service.description}
                    </p>
                  </div>

                  <div>
                    {/* Unboxed Clean Metadata */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 pb-4 mb-4 border-b border-slate-100">
                      <span className="truncate">{service.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="whitespace-nowrap font-mono-num">
                        อัปเดต {service.updatedAt}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={service.url}
                        target={isExternal ? '_blank' : undefined}
                        rel={isExternal ? 'noopener noreferrer' : undefined}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[40px] text-xs sm:text-sm font-medium text-white bg-[#0F2D5C] hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <span>เปิดใช้งาน</span>
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      </a>

                      <button
                        type="button"
                        onClick={() => setSelectedService(service)}
                        className="inline-flex items-center justify-center gap-1 px-3 py-2 min-h-[40px] text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
                        <span>เอกสาร</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal รายละเอียดบริการและเอกสารที่ต้องใช้ */}
      {selectedService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-modal-title"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0F2D5C] flex items-center justify-center shrink-0">
                  <IconRenderer name={selectedService.icon} className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">
                    {selectedService.category} · อัปเดต {selectedService.updatedAt}
                  </p>
                  <h3
                    id="service-modal-title"
                    className="font-display text-lg font-semibold text-slate-900"
                  >
                    {selectedService.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                aria-label="ปิดหน้าต่าง"
                className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 mb-1">รายละเอียดบริการ</h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {selectedService.description}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-[#0F2D5C] mb-2">
                  เอกสารประกอบ / ข้อแนะนำการยื่นเรื่อง
                </h4>
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                  {selectedService.requiredDocs || 'ไม่มีเอกสารประกอบเพิ่มเติม'}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="px-4 py-2 min-h-[40px] text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                ปิด
              </button>
              <a
                href={selectedService.url}
                target={selectedService.url.startsWith('http') ? '_blank' : undefined}
                rel={selectedService.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                onClick={() => setSelectedService(null)}
                className="inline-flex items-center gap-2 px-5 py-2 min-h-[40px] text-sm font-medium text-white bg-[#0F2D5C] hover:bg-blue-800 rounded-lg transition-colors"
              >
                <span>ไปยังระบบบริการ</span>
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
