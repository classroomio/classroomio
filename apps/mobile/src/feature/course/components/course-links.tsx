import type { ReactNode } from 'react';

import type { AppIcon } from '@/feature/common/components/icon';
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
import { IconTile, type IconTileTone } from '@/feature/common/components/icon-tile';

export function CourseLinks({ children }: { children: ReactNode }) {
  return <ItemGroup>{children}</ItemGroup>;
}

type CourseLinkProps = {
  icon: AppIcon;
  /** Fill of the icon tile, a theme colour. */
  tone?: IconTileTone;
  title: string;
  description?: string;
  onPress: () => void;
};

export function CourseLink({ icon, tone, title, description, onPress }: CourseLinkProps) {
  return (
    <Item onPress={onPress} accessibilityLabel={description ? `${title}, ${description}` : title}>
      <ItemMedia>
        <IconTile icon={icon} tone={tone} />
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
