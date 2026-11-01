import { ScreenScrollView } from '@/feature/common/components/screen';
import { LanguageList } from '@/feature/settings/components/language-list';

export default function LanguageScreen() {
  return (
    <ScreenScrollView>
      <LanguageList />
    </ScreenScrollView>
  );
}
