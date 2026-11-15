import { ArrowRight, Clock, Layers, MessageSquareText, Newspaper, PhoneCall } from 'lucide-react';
import type { SiteSettings } from '../types/cms.ts';
import { SafeImage } from './SafeImage.tsx';

interface HeroSectionProps {
  settings: SiteSettings;
  activeServicesCount: number;
  activeNewsCount: number;
}

/**
 * ส่วน Hero Section พร้อมภาพประกอบองค์กรและแถบสรุปข้อมูลบริการ 4 คอลัมน์
 */
export function HeroSection({
  settings,
  activeServicesCount,
  activeNewsCount,
}: HeroSectionProps) {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/70 to-slate-50 border-b border-slate-200/80"
    >
      {/* Subtle architectural geometric backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:28px_28px] opacity-35"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-14 lg:pb-16">
        {/* 2-Column Balanced Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left Column: Core Proposition */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-sm font-medium text-blue-800 mb-3">
              {settings.divisionName} · {settings.organizationName}
            </p>

            <h1
              className="font-display font-bold tracking-tight text-slate-900 leading-[1.2] mb-5"
              style={{
                fontSize: 'clamp(1.875rem, 3.4vw, 3rem)',
                textWrap: 'balance',
              }}
            >
              {settings.heroTitle}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mb-8">
              {settings.heroSubtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#services"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] text-sm sm:text-base font-medium text-white bg-[#0F2D5C] hover:bg-blue-800 rounded-lg transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              >
                <span>{settings.heroPrimaryCta}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>

              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] text-sm sm:text-base font-medium text-[#0F2D5C] bg-white border border-slate-300 hover:border-blue-400 hover:bg-blue-50/40 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              >
                <MessageSquareText className="w-4 h-4 text-blue-700" aria-hidden="true" />
                <span>{settings.heroSecondaryCta}</span>
              </a>
            </div>
          </div>

          {/* Right Column: High-Impact 16:9 Architectural Photography */}
          <div className="lg:col-span-6">
            <div className="relative h-full min-h-[260px] sm:min-h-[340px] rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm">
              <SafeImage
                src="assets/images/hero_hr_office_1794754435803.jpg"
                alt="สำนักงานงานบริหารและพัฒนาทรัพยากรบุคคล วิทยาลัยการอาชีพด่านซ้าย"
                className="w-full h-full object-cover lg:h-full"
                fallbackTitle={settings.organizationName}
              />
              {/* Scrim & Glassmorphism Institutional Quick Card */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent p-5 sm:p-6">
                <div className="backdrop-blur-md bg-white/12 border border-white/20 rounded-lg px-4 py-3 text-white flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-blue-100">บริการบุคลากรแบบครบวงจร</p>
                    <p className="font-display text-sm sm:text-base font-semibold">
                      {settings.organizationName}
                    </p>
                  </div>
                  <div className="text-xs sm:text-sm text-blue-100 font-mono-num">
                    {settings.officeHours}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Summary Strip Below Hero Split */}
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1.5">
              <Layers className="w-4 h-4 text-blue-700" aria-hidden="true" />
              <span>ระบบบริการออนไลน์</span>
            </div>
            <p className="font-display text-2xl font-bold text-[#0F2D5C] font-mono-num">
              {activeServicesCount} <span className="text-sm font-normal text-slate-500">ระบบ</span>
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1.5">
              <Newspaper className="w-4 h-4 text-blue-700" aria-hidden="true" />
              <span>ประกาศประชาสัมพันธ์</span>
            </div>
            <p className="font-display text-2xl font-bold text-[#0F2D5C] font-mono-num">
              {activeNewsCount} <span className="text-sm font-normal text-slate-500">รายการ</span>
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1.5">
              <Clock className="w-4 h-4 text-blue-700" aria-hidden="true" />
              <span>รอบการประเมินปัจจุบัน</span>
            </div>
            <p className="font-display text-lg sm:text-xl font-bold text-slate-900 font-mono-num">
              {settings.evaluationCycle}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1.5">
              <PhoneCall className="w-4 h-4 text-blue-700" aria-hidden="true" />
              <span>สายตรงงานบุคคล</span>
            </div>
            <p className="font-display text-lg sm:text-xl font-bold text-slate-900 font-mono-num truncate">
              {settings.phone}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
