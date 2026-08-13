Use `SankeyChart` to show how a total flows between stages and outcomes. The chart observes its container and recalculates its layout when its width changes.

## Vue example

```vue
<script setup>
import { SankeyChart } from '@chatwoot/viz'

const data = {
  nodes: [
    {
      id: 'handled',
      label: 'Handled',
      count: 9,
      color: 'var(--handled-color)',
    },
    {
      id: 'resolved',
      label: 'Resolved by Captain',
      count: 3,
      color: '#038574',
    },
  ],
  links: [
    {
      source: 'handled',
      target: 'resolved',
      value: 3,
    },
  ],
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

## Data

- `nodes` contains objects with `id`, `label`, `count`, and optional `color`.
- `links` connects nodes with `source`, `target`, and `value`.
- A source or target can be a node id, zero-based node index, or node object.
- Link values control ribbon thickness and must be positive.
- Node values can be inferred from their links when `count` is omitted.
- The graph must be directed and acyclic.

```json
{
  "nodes": [
    {
      "id": "handled",
      "label": "Handled",
      "count": 9,
      "color": "var(--handled-color)"
    },
    {
      "id": "resolved",
      "label": "Resolved by Captain",
      "count": 3,
      "color": "#038574"
    },
    {
      "id": "handed_off",
      "label": "Handed off",
      "count": 6,
      "color": "#915930"
    }
  ],
  "links": [
    { "source": "handled", "target": "resolved", "value": 3 },
    { "source": "handled", "target": "handed_off", "value": 6 }
  ]
}
```

## Colors and labels

Node and link colors accept raw CSS colors or custom properties such as `var(--handled-color)`. A link without a color uses its target node color with reduced opacity.

- Set `showLabelBackground` to `false` to remove label surfaces.
- Use `formatValue` to customize displayed counts.
- Use `nodeWidth` and `nodePadding` to tune the layout.

## Item clicks

Nodes, their labels, and link ribbons use one `onItemClick` callback. The ribbons include a wider transparent hit target so thin flows remain easy to select. Mouse clicks, Enter, and Space all invoke the callback.

```vue
<script setup>
function openFlowDetails(payload) {
  if (payload.itemType === 'node') {
    // payload.item is the original node object.
  } else {
    // payload.item is the original link object.
  }
}
</script>

<template>
  <SankeyChart :data="data" @item-click="openFlowDetails" />
</template>
```

Every payload contains `itemType`, `item`, `value`, `formattedValue`, `index`, and the native `event`. Node payloads add `id` and `label`; link payloads add the original `source` and `target` nodes plus their ids and labels.

<details>
<summary>Custom field names</summary>

Use accessors when your application has a different data shape.

```vue
<SankeyChart
  :data="data"
  :node-id="(node) => node.key"
  :node-label="(node) => node.name"
  :node-value="(node) => node.total"
  :node-color="(node) => node.fill"
  :link-value="(link) => link.amount"
/>
```

</details>
