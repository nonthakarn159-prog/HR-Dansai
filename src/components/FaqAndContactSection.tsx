import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Mail,
  MapPin,
  Phone,
  Send,
} from 'lucide-react';
import type { FaqItem, InquiryItem, SiteSettings } from '../types/cms.ts';
import { submitPublicInquiry } from '../utils/cmsClient.ts';

interface FaqAndContactSectionProps {
  faqs: FaqItem[];
  settings: SiteSettings;
  onInquirySubmitted?: (inquiry: InquiryItem) => void;
}

interface FormErrors {
  fullName?: string;
  contact?: string;
  topic?: string;
  message?: string;
}

/**
 * ส่วนคำถามที่พบบ่อย (FAQ) และแบบฟอร์มติดต่อ / แจ้งเรื่องงานบุคคลพร้อม Validation
 */
export function FaqAndContactSection({
  faqs,
  settings,
  onInquirySubmitted,
}: FaqAndContactSectionProps) {
  const visibleFaqs = useMemo(
    () => [...faqs].filter((f) => f.visible).sort((a, b) => a.order - b.order),
    [faqs]
  );

  const [openFaqId, setOpenFaqId] = useState<string | null>(visibleFaqs[0]?.id || null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [contact, setContact] = useState('');
  const [department, setDepartment] = useState('');
  const [topic, setTopic] = useState('สอบถามสิทธิสวัสดิการ');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  const validateForm = (): FormErrors => {
    const nextErrors: FormErrors = {};
    const trimmedName = fullName.trim();
    const trimmedContact = contact.trim();
    const trimmedMessage = message.trim();

    if (trimmedName.length < 3) {
      nextErrors.fullName = 'กรุณากรอกชื่อ-นามสกุล อย่างน้อย 3 ตัวอักษร';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneDigits = trimmedContact.replace(/[-\s]/g, '');
    const phoneRegex = /^0\d{8,9}$/;
    if (!emailRegex.test(trimmedContact) && !phoneRegex.test(phoneDigits)) {
      nextErrors.contact = 'กรุณากรอกอีเมล หรือเบอร์โทรศัพท์ 9-10 หลักให้ถูกต้อง';
    }

    if (!topic) {
      nextErrors.topic = 'กรุณาเลือกหัวข้อที่ต้องการติดต่อ';
    }

    if (trimmedMessage.length < 10) {
      nextErrors.message = 'กรุณาระบุรายละเอียดอย่างน้อย 10 ตัวอักษร เพื่อให้เจ้าหน้าที่ตรวจสอบได้ครบถ้วน';
    }

    return nextErrors;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmittedTicket(null);

    const validation = validateForm();
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitPublicInquiry({
        fullName: fullName.trim(),
        contact: contact.trim(),
        department: department.trim(),
        topic,
        message: message.trim(),
      });

      if (!result.ok) {
        throw new Error(result.error || 'ไม่สามารถส่งข้อมูลได้ในขณะนี้');
      }

      setSubmittedTicket(result.inquiry?.ticketCode || 'HR-RECEIVED');
      if (result.inquiry && onInquirySubmitted) {
        onInquirySubmitted(result.inquiry);
      }
      setFullName('');
      setContact('');
      setDepartment('');
      setMessage('');
      setErrors({});
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการส่งข้อมูล');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-14 lg:py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Part 1: FAQ Accordion */}
        <div id="faq" className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-4">
            <p className="text-sm font-medium text-blue-800 mb-2">
              03. คำถามที่พบบ่อย (FAQ)
            </p>
            <h2
              className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3"
              style={{ textWrap: 'balance' }}
            >
              ข้อสงสัยยอดนิยมเกี่ยวกับงานบุคคล
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              รวบรวมคำตอบสำหรับขั้นตอนการยื่นใบลา การขอหนังสือรับรอง และการเบิกจ่ายสวัสดิการของบุคลากร
            </p>
          </div>

          <div className="lg:col-span-8 space-y-3">
            {visibleFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full px-5 py-4 min-h-[56px] flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-slate-50/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-700"
                  >
                    <div className="pr-2">
                      <span className="block text-xs text-blue-800 font-medium mb-0.5">
                        {faq.category}
                      </span>
                      <span className="font-display text-sm sm:text-base font-semibold text-slate-900">
                        {faq.question}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-500 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#0F2D5C]' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-sm sm:text-base text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Hairline Divider */}
        <hr className="border-slate-200" />

        {/* Part 2: Contact & Inquiry Form with Validation */}
        <div id="contact" className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Contact Information */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <p className="text-sm font-medium text-blue-800 mb-2">
                04. ติดต่อสอบถามและแจ้งเรื่อง
              </p>
              <h2
                className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3"
                style={{ textWrap: 'balance' }}
              >
                ส่งคำร้องหรือสอบถามเจ้าหน้าที่งานบุคคล
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                บุคลากรสามารถส่งคำขอหนังสือรับรอง แจ้งปัญหาการใช้งานระบบ หรือปรึกษาเรื่องสวัสดิการได้โดยตรงผ่านแบบฟอร์มนี้
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#0F2D5C] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold text-slate-500">สถานที่ติดต่อ</p>
                  <p className="text-sm text-slate-800 mt-0.5">
                    {settings.divisionName} {settings.organizationName}
                  </p>
                  <p className="text-sm text-slate-600">{settings.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#0F2D5C] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold text-slate-500">โทรศัพท์ภายใน / เวลาราชการ</p>
                  <p className="text-sm text-slate-800 font-mono-num mt-0.5">{settings.phone}</p>
                  <p className="text-xs text-slate-500">{settings.officeHours}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#0F2D5C] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold text-slate-500">อีเมลติดต่อ</p>
                  <p className="text-sm text-slate-800 font-mono-num mt-0.5">{settings.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Validated Inquiry Form */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
            {submittedTicket && (
              <div
                role="alert"
                className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-900"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-sm">
                  <p className="font-semibold">ส่งคำร้องถึงงานบริหารและพัฒนาทรัพยากรบุคคลเรียบร้อยแล้ว</p>
                  <p className="text-emerald-800 mt-0.5">
                    รหัสอ้างอิงเรื่อง:{' '}
                    <span className="font-mono-num font-semibold">{submittedTicket}</span>{' '}
                    เจ้าหน้าที่จะตรวจสอบและติดต่อกลับในเวลาราชการ
                  </p>
                </div>
              </div>
            )}

            {submitError && (
              <div
                role="alert"
                className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3 text-red-900"
              >
                <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm font-medium">{submitError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="inq-name" className="block text-sm font-medium text-slate-800 mb-1.5">
                    ชื่อ-นามสกุล <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="inq-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors((p) => ({ ...p, fullName: undefined }));
                    }}
                    placeholder="เช่น นายสมชาย ใจดี"
                    aria-invalid={Boolean(errors.fullName)}
                    className={`w-full px-3.5 py-2.5 min-h-[44px] rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 ${
                      errors.fullName
                        ? 'border-red-500 focus:ring-red-500/20'
                        : 'border-slate-300 focus:border-blue-700 focus:ring-blue-700/15'
                    }`}
                  />
                  {errors.fullName && (
                    <p className="mt-1.5 text-xs text-red-700 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{errors.fullName}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="inq-contact" className="block text-sm font-medium text-slate-800 mb-1.5">
                    เบอร์โทร หรือ อีเมลติดต่อกลับ <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="inq-contact"
                    type="text"
                    value={contact}
                    onChange={(e) => {
                      setContact(e.target.value);
                      if (errors.contact) setErrors((p) => ({ ...p, contact: undefined }));
                    }}
                    placeholder="08x-xxx-xxxx หรือ email@dansai.ac.th"
                    aria-invalid={Boolean(errors.contact)}
                    className={`w-full px-3.5 py-2.5 min-h-[44px] rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 ${
                      errors.contact
                        ? 'border-red-500 focus:ring-red-500/20'
                        : 'border-slate-300 focus:border-blue-700 focus:ring-blue-700/15'
                    }`}
                  />
                  {errors.contact && (
                    <p className="mt-1.5 text-xs text-red-700 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{errors.contact}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="inq-dept" className="block text-sm font-medium text-slate-800 mb-1.5">
                    แผนกวิชา / ฝ่ายงาน
                  </label>
                  <input
                    id="inq-dept"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="เช่น แผนกวิชาช่างยนต์ / งานการเงิน"
                    className="w-full px-3.5 py-2.5 min-h-[44px] rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15"
                  />
                </div>

                <div>
                  <label htmlFor="inq-topic" className="block text-sm font-medium text-slate-800 mb-1.5">
                    หัวข้อเรื่อง <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="inq-topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3.5 py-2.5 min-h-[44px] rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15"
                  >
                    <option value="สอบถามสิทธิสวัสดิการ">สอบถามสิทธิสวัสดิการ</option>
                    <option value="หนังสือรับรอง/ก.พ.7">ขอหนังสือรับรอง / แก้ไข ก.พ.7</option>
                    <option value="การลาและเวลาปฏิบัติราชการ">การลาและเวลาปฏิบัติราชการ</option>
                    <option value="ประเมินผลการปฏิบัติงาน PA">ประเมินผลการปฏิบัติงาน (PA)</option>
                    <option value="แจ้งปัญหาลิงก์บริการ">แจ้งปัญหาลิงก์บริการ / รหัสผ่าน</option>
                    <option value="อื่นๆ">เรื่องอื่นๆ</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="inq-message" className="block text-sm font-medium text-slate-800 mb-1.5">
                  รายละเอียดที่ต้องการติดต่อ <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="inq-message"
                  rows={4}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (errors.message) setErrors((p) => ({ ...p, message: undefined }));
                  }}
                  placeholder="ระบุรายละเอียดเรื่องที่ต้องการสอบถาม หรือเอกสารที่ต้องการขอรับบริการ..."
                  aria-invalid={Boolean(errors.message)}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 ${
                    errors.message
                      ? 'border-red-500 focus:ring-red-500/20'
                      : 'border-slate-300 focus:border-blue-700 focus:ring-blue-700/15'
                  }`}
                />
                {errors.message && (
                  <p className="mt-1.5 text-xs text-red-700 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{errors.message}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] text-sm font-medium text-white bg-[#0F2D5C] hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                  <span>{submitting ? 'กำลังส่งข้อมูล...' : 'ส่งเรื่องถึงงานบุคคล'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
