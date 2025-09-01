import { getDictionary } from '../../../../get-dictionary';
import { Locale } from '../../../../i18n-config';
import IntelligentQAClient from './IntelligentQAClient';

export default async function IntelligentQAPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <IntelligentQAClient dictionary={dictionary} />;
}
