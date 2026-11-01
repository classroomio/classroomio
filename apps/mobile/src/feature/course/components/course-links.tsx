import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';

import { Icon } from '@/feature/common/components/icon';
import {
  Item,
  ItemActions,
  ItemChevron,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from '@/feature/common/components/item';

export function CourseLinks({ children }: { children: ReactNode }) {
  return <ItemGroup>{children}</ItemGroup>;
}

type CourseLinkProps = { icon: LucideIcon; title: string; description?: string; onPress: () => void };

export function CourseLink({ icon, title, description, onPress }: CourseLinkProps) {
  return (
    <Item onPress={onPress} accessibilityLabel={description ? `${title}, ${description}` : title}>
      <ItemMedia variant="tile">
        <Icon icon={icon} size={19} tone="ink" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{title}</ItemTitle>
        {description ? <ItemDescription numberOfLines={1}>{description}</ItemDescription> : null}
      </ItemContent>
      <ItemActions>
        <ItemChevron />
      </ItemActions>
    </Item>
  );
}
