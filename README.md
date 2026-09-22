# InfluenceHub

Expo (React Native + TypeScript) app for InfluenceHub — an Indian influencer-marketing
marketplace connecting brands and creators through escrow-held payments.

See **`CLAUDE.md`** for architecture and conventions, and **`SPRINTS.md`** for the build plan and
progress tracker. `prompt.md` is the full product/screen specification.

## Development

```bash
npm install
npm start          # Metro bundler — press a/i/w for Android/iOS/web, or scan with Expo Go
npm run android
npm run ios
npm run web

npm run lint
npm run typecheck
npm test
npm run format
```

Routes live under `src/app` (Expo Router, file-based). Reusable UI primitives are in
`src/components/ui`, composite domain components in `src/components/domain`, and API/auth/query
setup in `src/lib`.
