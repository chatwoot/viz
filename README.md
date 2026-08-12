# @chatwoot/viz

Tiny SVG chart components for Vue 3.5 and newer, built for Chatwoot.

The library is currently a scaffold. Its temporary `DummyChart` turns top-level
JSON fields into simple SVG bars, confirming that playground data reaches a
library component. No Sankey layout or drawing logic is included yet.

## Requirements

- Node.js 24.4.1 or newer
- pnpm 10.2.0
- Vue 3.5 or newer in consuming applications

## Development

```sh
pnpm install
pnpm dev
```

The Vite playground opens from the repository root. Its JSON editor validates
input as you type and stores the raw text under
`chatwoot-viz:sankey-data` in localStorage. The included node/link shape is an
illustrative fixture, not a committed public data API.

Useful commands:

```sh
pnpm build         # Build the ESM library into dist/
pnpm test          # Run Vitest and Vue Test Utils tests
pnpm test:watch    # Run tests in watch mode
pnpm lint          # Check JavaScript and Vue script blocks with Oxlint
pnpm format        # Format supported project files with Oxfmt
pnpm check         # Run all checks and the production build
```

## Usage

The package is not published yet. Once installed or linked locally:

```vue
<script setup>
import { DummyChart } from '@chatwoot/viz'

const data = {
  nodes: [],
  links: [],
}
</script>

<template>
  <DummyChart :data="data" />
</template>
```

`DummyChart` is disposable scaffold code and is not intended to define the
future Sankey component's API or data model.

## Packaging

`vite.config.js` has a single library entry at `src/index.js`, emits modern ESM,
and keeps Vue external as a peer dependency. `index.html` and `playground/` are
development inputs only and are not included in the package's `dist` output.

The setup follows the current official guidance for
[Vue tooling](https://vuejs.org/guide/quick-start.html),
[Vite library mode](https://vite.dev/guide/build.html#library-mode),
[Oxlint](https://oxc.rs/docs/guide/usage/linter.html),
[Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html), and
[Vue Test Utils](https://test-utils.vuejs.org/installation/).

## License

[MIT](./LICENSE)
