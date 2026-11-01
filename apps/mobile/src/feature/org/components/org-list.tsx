import { Check } from 'lucide-react-native';

import type { AccountOrganization } from '@/feature/account/types/account';
import { Avatar } from '@/feature/common/components/avatar';
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
import { ROLE_NAME_KEYS } from '@/feature/org/constants/roles';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { orgCatalog } from '@/feature/org/translations/catalog';

type OrgListProps = {
  organizations: AccountOrganization[];
  activeOrgId?: string | null;
  onSelect: (org: AccountOrganization) => void;
};

export function OrgList({ organizations, activeOrgId, onSelect }: OrgListProps) {
  const t = useTranslations(orgCatalog);

  return (
    <ItemGroup>
      {organizations.map((org) => (
        <Item key={org.id} onPress={() => onSelect(org)} accessibilityState={{ selected: org.id === activeOrgId }}>
          <ItemMedia>
            <Avatar name={org.name} uri={org.avatarUrl} shape="square" size={40} />
          </ItemMedia>
          <ItemContent>
            <ItemTitle numberOfLines={1}>{org.name}</ItemTitle>
            <ItemDescription>{t((org.roleId && ROLE_NAME_KEYS[org.roleId]) || 'roleMember')}</ItemDescription>
          </ItemContent>
          <ItemActions>
            {org.id === activeOrgId ? <Icon icon={Check} size={18} tone="primary" /> : <ItemChevron />}
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  );
}
