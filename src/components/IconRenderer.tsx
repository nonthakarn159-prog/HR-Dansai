import {
  Award,
  BookOpen,
  Building2,
  CalendarCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  HeartHandshake,
  Link2,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import type { ServiceIconKey } from '../types/cms.ts';

interface IconRendererProps {
  name: ServiceIconKey;
  className?: string;
}

/**
 * แปลงชื่อไอคอนจาก CMS เป็นคอมโพเนนต์ Lucide Icon
 */
export function IconRenderer({ name, className = 'w-5 h-5' }: IconRendererProps) {
  switch (name) {
    case 'CalendarCheck':
      return <CalendarCheck className={className} aria-hidden="true" />;
    case 'FileText':
      return <FileText className={className} aria-hidden="true" />;
    case 'Wallet':
      return <Wallet className={className} aria-hidden="true" />;
    case 'Award':
      return <Award className={className} aria-hidden="true" />;
    case 'GraduationCap':
      return <GraduationCap className={className} aria-hidden="true" />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} aria-hidden="true" />;
    case 'Users':
      return <Users className={className} aria-hidden="true" />;
    case 'ClipboardList':
      return <ClipboardList className={className} aria-hidden="true" />;
    case 'BookOpen':
      return <BookOpen className={className} aria-hidden="true" />;
    case 'Building2':
      return <Building2 className={className} aria-hidden="true" />;
    case 'HeartHandshake':
      return <HeartHandshake className={className} aria-hidden="true" />;
    case 'Link2':
    default:
      return <Link2 className={className} aria-hidden="true" />;
  }
}

export const SERVICE_ICON_OPTIONS: { key: ServiceIconKey; label: string }[] = [
  { key: 'CalendarCheck', label: 'ปฏิทิน / การลา' },
  { key: 'Wallet', label: 'เงินเดือน / การเงิน' },
  { key: 'ClipboardList', label: 'ประเมินผล / แบบฟอร์ม' },
  { key: 'Users', label: 'ทะเบียนประวัติบุคลากร' },
  { key: 'HeartHandshake', label: 'สวัสดิการ' },
  { key: 'GraduationCap', label: 'อบรมและพัฒนา' },
  { key: 'Award', label: 'เครื่องราช / เกียรติคุณ' },
  { key: 'FileText', label: 'เอกสาร / คู่มือ' },
  { key: 'ShieldCheck', label: 'ระเบียบ / กฎหมาย' },
  { key: 'BookOpen', label: 'คลังความรู้' },
  { key: 'Building2', label: 'โครงสร้างองค์กร' },
  { key: 'Link2', label: 'ลิงก์ระบบภายนอก' },
];
