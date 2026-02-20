# CLAUDE.md

## Project

`vk-launch-params` — server-side library for verifying, parsing, and signing VK Mini App launch params.

## Stack

- **Runtime**: Bun (primary) + Node.js (compatible)
- **Language**: TypeScript
- **Test runner**: `bun:test`
- **Linter/formatter**: Biome
- **Bundler**: pkgroll (for publishing)

## Commands

```sh
bun test                  # run tests
bun run benchmarks/index.ts  # run benchmarks
bunx biome check src/     # lint
bunx pkgroll              # build dist/
```

## Architecture

### `src/index.ts`

All public functions. Bun-aware: `sha256Hash` uses `Bun.CryptoHasher` when running under Bun, falls back to Node's `createHmac`.

| Function | Description |
|---|---|
| `verifyLaunchParams(qs, secret)` | Returns `boolean` — verifies HMAC-SHA256 signature |
| `parseLaunchParams(qs)` | Returns typed `LaunchParams` — no verification |
| `verifyAndParseLaunchParams(qs, secret)` | Returns `LaunchParams \| false` |
| `signLaunchParams(params, secret)` | Returns signed query string — useful for testing |

### `src/types.ts`

TypeScript types: `LaunchParams`, `LaunchParamsPlatforms`, `LaunchParamsLanguages`, `LaunchParamsGroupRole`.

## Signing algorithm (VK spec)

1. Take all params except `sign`
2. Sort keys lexicographically
3. Encode as `key=encodeURIComponent(value)` joined by `&`
4. HMAC-SHA256 with client secret → base64url digest
5. Append `&sign=<digest>` to the query string

## Notes

- No `secretKey` pre-hashing optimization (unlike Telegram's `getBotTokenSecretKey`) — VK uses the raw client secret directly
- `vk_platform` type is `LaunchParamsPlatforms` — does **not** include bare `"android"`, use `"mobile_android"`
- Boolean params (`vk_is_app_user`, `vk_are_notifications_enabled`, `vk_is_favorite`) are serialized as `"1"`/`"0"` in query strings
