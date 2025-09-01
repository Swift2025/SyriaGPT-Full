// src/app/[lang]/settings/page.tsx
import type { Metadata } from 'next';
import { getDictionary } from '../../../../get-dictionary';
import { Locale } from '../../../../i18n-config';
import SettingsPageClient from './SettingsPageClient'; // استيراد مكون العميل

// دالة ديناميكية لإنشاء بيانات الميتا المترجمة
export async function generateMetadata({ params: { lang } }: { params: { lang: Locale } }): Promise<Metadata> {
  const dictionary = await getDictionary(lang);
  const t = dictionary.settingsPage.metadata;
  return {
    title: t.title,
    description: t.description,
  };
}

// مكون الصفحة (خادم)
export default async function SettingsPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dictionary = await getDictionary(lang);
  return <SettingsPageClient dictionary={dictionary} />;
}