import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';

/** Whether this screen's native view has appeared on screen at least once (native stack `transitionEnd`). */
export function useHasAppeared() {
  const navigation = useNavigation();
  const [hasAppeared, setHasAppeared] = useState(false);

  useEffect(() => {
    if (hasAppeared) return;

    return navigation.addListener('transitionEnd' as never, () => setHasAppeared(true));
  }, [navigation, hasAppeared]);

  return hasAppeared;
}
