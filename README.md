# @chatwoot/viz

Small, responsive chart components for Vue 3.5+. Built for Chatwoot with accessible interactions, rich HTML tooltips, and no runtime charting dependency.

## Install

```sh
pnpm add @chatwoot/viz
```

Import the stylesheet once, then import the charts you need:

```js
import '@chatwoot/viz/style.css'
```

```vue
<script setup>
import { LineChart } from '@chatwoot/viz'

const data = {
  categories: ['Week 1', 'Week 2', 'Week 3'],
  series: [{ id: 'resolved', label: 'Resolved', data: [12, 29, 23] }],
}
</script>

<template>
  <LineChart :data="data" aria-label="Resolved conversations by week" />
</template>
```

## Documentation

- [Overview and development](./playground/docs/index.md)
- [BarChart](./playground/docs/bar.md)
- [HeatmapChart](./playground/docs/heatmap.md)
- [LineChart](./playground/docs/line.md)
- [PercentageChart](./playground/docs/percentage.md)
- [SankeyChart](./playground/docs/sankey.md)

## Agent skill

Install the [`chatwoot-viz` skill](./skills/chatwoot-viz/SKILL.md) to teach a
compatible coding agent how to choose, configure, theme, and test these charts:

```sh
npx skills add chatwoot/viz --skill chatwoot-viz
```

## Playground

```sh
pnpm install
pnpm dev
```

Open `/` for the chart gallery or `/bar`, `/heatmap`, `/line`, `/percentage`, and `/sankey` for editable stories.

## License

[MIT](./LICENSE)
