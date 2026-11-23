import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/feature/common/components/item';
import { Switch } from '@/feature/common/components/switch';

type ToggleRowProps = {
  label: string;
  description?: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
};

/** A settings row with a label, an optional description and a switch. */
export function ToggleRow({ label, description, value, disabled = false, onValueChange }: ToggleRowProps) {
  return (
    <Item>
      <ItemContent>
        <ItemTitle numberOfLines={2}>{label}</ItemTitle>
        {description ? <ItemDescription numberOfLines={3}>{description}</ItemDescription> : null}
      </ItemContent>
      <ItemActions>
        <Switch value={value} disabled={disabled} onValueChange={onValueChange} accessibilityLabel={label} />
      </ItemActions>
    </Item>
  );
}
