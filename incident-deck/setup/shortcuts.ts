import { defineShortcutsSetup } from '@slidev/types'
// The narration layer owns Space. Preserve Slidev's other shortcuts.
export default defineShortcutsSetup((_nav, base) => base.filter(shortcut =>
  typeof shortcut.key !== 'string' || !['space', ' '].includes(shortcut.key.toLowerCase()),
))
