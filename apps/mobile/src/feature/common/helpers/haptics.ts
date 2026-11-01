import * as Haptics from 'expo-haptics';

export function tapHaptic() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function selectionHaptic() {
  void Haptics.selectionAsync();
}

export function successHaptic() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function warningHaptic() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

export function errorHaptic() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}
