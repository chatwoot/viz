Use `SankeyChart` to show how a total flows between stages and outcomes.

## Data

- `nodes` contains objects with `id`, `label`, `count`, and optional `color`.
- `links` connects nodes with `source`, `target`, and `value`.
- A source or target can be a node id, zero-based node index, or node object.
- Link values control ribbon thickness and must be positive.
- The graph must be directed and acyclic.

```json
{
  "nodes": [
    { "id": "handled", "label": "Handled", "count": 9 },
    { "id": "resolved", "label": "Resolved", "count": 3 }
  ],
  "links": [{ "source": "handled", "target": "resolved", "value": 3 }]
}
```

## Colors

Node and link colors accept raw CSS colors or custom properties such as `var(--resolved-color)`. A link without a color uses its target node color with reduced opacity.

```vue
<SankeyChart :data="data" aria-label="Conversation resolution flow" />
```

The chart observes its container and recalculates its layout when the available width changes.
