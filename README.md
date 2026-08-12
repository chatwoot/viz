# @chatwoot/viz

Tiny, responsive SVG chart components for Vue 3.5 and newer, built for Chatwoot.

The first component is a dependency-free Sankey chart for directed acyclic
flows. Its data shape follows the familiar
[Unovis Sankey format](https://unovis.dev/docs/networks-and-flows/Sankey/): an
array of node data and an array of links whose `source` and `target` refer to
those nodes.

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
`chatwoot-viz:sankey-data` in localStorage.

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
import { SankeyChart } from '@chatwoot/viz'
import '@chatwoot/viz/style.css'

const data = {
  nodes: [
    { id: 'handled', label: 'Handled', count: 9, color: 'var(--handled-color)' },
    { id: 'resolved', label: 'Resolved by Captain', count: 3, color: '#038574' },
  ],
  links: [{ source: 'handled', target: 'resolved', value: 3 }],
}
</script>

<template>
  <SankeyChart :data="data" aria-label="Conversation resolution flow" />
</template>

<style scoped>
.cw-viz-sankey {
  --handled-color: #4747c2;
}
</style>
```

### Data

`data.nodes` accepts arbitrary objects. By default, the component reads `id`,
`label`, `count`, and `color`. `data.links` reads `source`, `target`, `value`,
and optional `color`.

- `source` and `target` can be a node id, a zero-based node index, or a node
  object.
- `value` controls ribbon thickness. Values must be positive numbers.
- Node values are inferred from their links when `count`/`value` is omitted.
- `color` accepts any SVG color, including raw hex values and `var(--token)`.
- The graph must be directed and acyclic.

The accessors can be replaced when an application uses different field names:

```vue
<SankeyChart
  :data="data"
  :node-id="(node) => node.key"
  :node-label="(node) => node.name"
  :node-value="(node) => node.total"
  :node-color="(node) => node.fill"
  :link-value="(link) => link.amount"
  :link-color="(link) => link.fill"
/>
```

### Props

| Prop                  | Default                                 | Purpose                                                     |
| --------------------- | --------------------------------------- | ----------------------------------------------------------- |
| `data`                | required                                | `{ nodes, links }` Sankey data                              |
| `height`              | `340`                                   | SVG layout height                                           |
| `width`               | `960`                                   | Initial/SSR width before the container is measured          |
| `nodeWidth`           | `10`                                    | Node bar width                                              |
| `nodePadding`         | `28`                                    | Vertical gap between nodes in a column                      |
| `nodeId`              | `node => node.id`                       | Node id accessor                                            |
| `nodeLabel`           | `node => node.label ?? node.id`         | Visible label accessor                                      |
| `nodeValue`           | `node => node.count ?? node.value ?? 0` | Displayed node value accessor                               |
| `nodeColor`           | `node => node.color`                    | Node color or accessor                                      |
| `linkValue`           | `link => link.value ?? 1`               | Link value accessor                                         |
| `linkColor`           | `link => link.color`                    | Link color or accessor; falls back to the target node color |
| `formatValue`         | locale number formatting                | Label value formatter                                       |
| `showLabelBackground` | `true`                                  | Draw label backgrounds; non-terminal labels include borders |
| `ariaLabel`           | `Sankey diagram`                        | Accessible chart name                                       |

The chart observes its own container and recalculates horizontal positions as
the available width changes. No sizing utility is required.

### CSS variables

```css
.cw-viz-sankey {
  --cw-viz-sankey-node-color: #4747c2;
  --cw-viz-sankey-node-resolved-color: #038574;
  --cw-viz-sankey-link-opacity: 0.2;
  --cw-viz-sankey-link-hover-opacity: 0.34;
  --cw-viz-sankey-node-opacity: 1;
  --cw-viz-sankey-label-color: #60646c;
  --cw-viz-sankey-label-value-color: #1c2024;
  --cw-viz-sankey-label-background: #fcfcfd;
  --cw-viz-sankey-label-border-color: #ebebef;
  --cw-viz-sankey-label-font-size: 13px;
}
```

Node-specific fallback variables are derived from ids. For example, the node id
`resolved` reads `--cw-viz-sankey-node-resolved-color` before the global node
color. A `color` supplied by the node or `nodeColor` accessor takes precedence.

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
