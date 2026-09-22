import * as migration_20260922_163243_baseline from './20260922_163243_baseline';

export const migrations = [
  {
    up: migration_20260922_163243_baseline.up,
    down: migration_20260922_163243_baseline.down,
    name: '20260922_163243_baseline'
  },
];
