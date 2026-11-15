/**
 * โครงสร้างข้อมูล (TypeScript Types) สำหรับระบบจัดการเนื้อหา (CMS)
 * งานบริหารและพัฒนาทรัพยากรบุคคล วิทยาลัยการอาชีพด่านซ้าย
 */

export type ServiceIconKey =
  | 'CalendarCheck'
  | 'FileText'
  | 'Wallet'
  | 'Award'
  | 'GraduationCap'
  | 'ShieldCheck'
  | 'Users'
  | 'ClipboardList'
  | 'BookOpen'
  | 'Building2'
  | 'HeartHandshake'
  | 'Link2';

export interface NavbarItem {
  id: string;
  label: string;
  href: string;
  type: 'anchor' | 'external';
  visible: boolean;
  order: number;
}

export interface HrService {
  id: string;
  title: string;
  category: string;
  description: string;
  url: string;
  icon: ServiceIconKey;
  updatedAt: string;
  requiredDocs: string;
  visible: boolean;
  order: number;
}

export interface NewsItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  imageUrl: string;
  publishedAt: string;
  author: string;
  featured: boolean;
  visible: boolean;
  attachmentUrl?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  visible: boolean;
  order: number;
}

export interface SiteSettings {
  brandTitle: string;
  divisionName: string;
  organizationName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  officeHours: string;
  phone: string;
  email: string;
  address: string;
  evaluationCycle: string;
}

export interface InquiryItem {
  id: string;
  fullName: string;
  contact: string;
  department: string;
  topic: string;
  message: string;
  status: 'pending' | 'resolved';
  createdAt: string;
  ticketCode: string;
}

export interface CmsPayload {
  navbarMenus: NavbarItem[];
  services: HrService[];
  news: NewsItem[];
  faqs: FaqItem[];
  siteSettings: SiteSettings;
}
