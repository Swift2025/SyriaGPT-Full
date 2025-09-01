// src/app/[lang]/page.tsx
import { getDictionary } from '../../../get-dictionary';
import { Locale } from '../../../i18n-config';
import ChatPageClient from './components/ChatPageClient';

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <ChatPageClient dictionary={dictionary} />;
}