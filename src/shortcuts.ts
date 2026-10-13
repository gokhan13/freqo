/**
 * Single-character shortcuts (A/B/C, digits, Space) fire from anywhere on the page, which
 * gets in the way of speech input and of anyone who brushes the keyboard. They can be
 * switched off in Profile (WCAG 2.1.4). The setting is stored in Progress; App mirrors it here
 * so the players and editors need not be handed it one by one.
 */
let enabled = true;
export const setShortcuts = (on: boolean) => {
  enabled = on;
};
export const shortcutsOn = () => enabled;
