import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import SankeyChart from './SankeyChart.vue'

const data = {
  nodes: [
    { id: 'handled', label: 'Handled', count: 9, color: '#5b5bd6' },
    {
      id: 'captain',
      label: 'Resolved by Captain',
      count: 3,
      color: 'var(--captain-color)',
    },
    { id: 'team', label: 'Handed off', count: 6, color: '#a15c1b' },
    { id: 'closed', label: 'Stayed closed', count: 3, color: '#009688' },
  ],
  links: [
    { source: 'handled', target: 'captain', value: 3 },
    { source: 0, target: 2, value: 6 },
    { source: 'captain', target: 'closed', value: 3, color: '#81d8cf' },
  ],
}

afterEach(() => vi.unstubAllGlobals())

describe('SankeyChart', () => {
  it('renders proportional nodes and links from Unovis-compatible data', () => {
    const wrapper = mount(SankeyChart, {
      props: { data, height: 320, width: 720 },
    })

    expect(wrapper.get('svg').attributes('viewBox')).toBe('0 0 720 320')
    expect(wrapper.findAll('.cw-viz-sankey__node')).toHaveLength(4)
    expect(wrapper.findAll('.cw-viz-sankey__link')).toHaveLength(3)
    expect(
      wrapper
        .findAll('.cw-viz-sankey__link')
        .every((link) => !link.attributes('d').includes('NaN')),
    ).toBe(true)
    expect(wrapper.text()).toContain('Resolved by Captain')
    expect(wrapper.text()).toContain('9')

    const captain = wrapper.get('[data-node-id="captain"] .cw-viz-sankey__node')
    const handled = wrapper.get('[data-node-id="handled"] .cw-viz-sankey__node')
    expect(captain.attributes('fill')).toBe('var(--captain-color)')
    expect(Number(handled.attributes('height'))).toBeGreaterThan(
      Number(captain.attributes('height')),
    )
  })

  it('accepts object endpoints and accessor overrides', () => {
    const [source, target] = [
      { key: 'a', total: 4 },
      { key: 'b', total: 4 },
    ]
    const wrapper = mount(SankeyChart, {
      props: {
        data: {
          nodes: [source, target],
          links: [{ source, target, amount: 4 }],
        },
        nodeId: (node) => node.key,
        nodeLabel: (node) => node.key.toUpperCase(),
        nodeValue: (node) => node.total,
        linkValue: (link) => link.amount,
        nodeColor: '#123456',
        linkColor: 'var(--flow-color)',
      },
    })

    expect(wrapper.get('[data-source="a"][data-target="b"]').attributes('fill')).toBe(
      'var(--flow-color)',
    )
    expect(wrapper.get('[data-node-id="a"] .cw-viz-sankey__node').attributes('fill')).toBe(
      '#123456',
    )
    expect(wrapper.text()).toContain('A')
  })

  it('infers displayed node values from links when nodes omit counts', () => {
    const wrapper = mount(SankeyChart, {
      props: {
        data: {
          nodes: [
            { id: 'source', label: 'Source' },
            { id: 'target', label: 'Target' },
          ],
          links: [{ source: 'source', target: 'target', value: 4 }],
        },
      },
    })

    expect(wrapper.get('[data-node-id="source"] .cw-viz-sankey__label-value').text()).toBe('4')
    expect(wrapper.get('[data-node-id="target"] .cw-viz-sankey__label-value').text()).toBe('4')
  })

  it('removes the outer border from labels in the terminal column', () => {
    const wrapper = mount(SankeyChart, { props: { data } })

    expect(
      wrapper.get('[data-node-id="closed"] .cw-viz-sankey__label-background').classes(),
    ).toContain('cw-viz-sankey__label-background--terminal')
    expect(
      wrapper.get('[data-node-id="captain"] .cw-viz-sankey__label-background').classes(),
    ).not.toContain('cw-viz-sankey__label-background--terminal')
  })

  it('geometrically centers label text', () => {
    const wrapper = mount(SankeyChart, { props: { data } })

    expect(wrapper.get('.cw-viz-sankey__label-text').attributes('dominant-baseline')).toBe(
      'central',
    )
    expect(wrapper.get('.cw-viz-sankey__label-value').attributes('dominant-baseline')).toBe(
      'central',
    )
  })

  it('calls onItemClick for nodes and their labels', async () => {
    const onItemClick = vi.fn()
    const wrapper = mount(SankeyChart, { props: { data, onItemClick } })
    const captain = wrapper.get('[data-node-id="captain"]')

    expect(captain.attributes('role')).toBe('button')
    expect(captain.attributes('tabindex')).toBe('0')
    await captain.get('.cw-viz-sankey__label').trigger('click')

    expect(onItemClick).toHaveBeenCalledOnce()
    expect(onItemClick.mock.calls[0][0]).toMatchObject({
      formattedValue: '3',
      id: 'captain',
      index: 1,
      item: data.nodes[1],
      itemType: 'node',
      label: 'Resolved by Captain',
      value: 3,
    })
    expect(onItemClick.mock.calls[0][0].event).toBeInstanceOf(MouseEvent)
  })

  it('calls onItemClick for link ribbons with a wider hit target', async () => {
    const onItemClick = vi.fn()
    const wrapper = mount(SankeyChart, { props: { data, onItemClick } })
    const link = wrapper.findAll('.cw-viz-sankey__link-group')[2]

    expect(link.attributes('role')).toBe('button')
    expect(link.attributes('tabindex')).toBe('0')
    expect(link.get('.cw-viz-sankey__link-hit-area').exists()).toBe(true)
    await link.get('.cw-viz-sankey__link-hit-area').trigger('click')
    await link.trigger('keydown', { key: ' ' })

    expect(onItemClick).toHaveBeenCalledTimes(2)
    expect(onItemClick.mock.calls[0][0]).toMatchObject({
      formattedValue: '3',
      index: 2,
      item: data.links[2],
      itemType: 'link',
      source: data.nodes[1],
      sourceId: 'captain',
      sourceLabel: 'Resolved by Captain',
      target: data.nodes[3],
      targetId: 'closed',
      targetLabel: 'Stayed closed',
      value: 3,
    })
    expect(onItemClick.mock.calls[0][0].event).toBeInstanceOf(MouseEvent)
    expect(onItemClick.mock.calls[1][0].event).toBeInstanceOf(KeyboardEvent)
  })

  it('recalculates the layout when its container resizes', async () => {
    let observer
    const disconnect = vi.fn()
    vi.stubGlobal('requestAnimationFrame', (callback) => {
      callback()
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback) {
          this.callback = callback
          observer = this
        }

        observe() {}

        disconnect() {
          disconnect()
        }
      },
    )

    const wrapper = mount(SankeyChart, { props: { data, width: 720 } })
    observer.callback([{ contentRect: { width: 480 } }])
    await nextTick()

    expect(wrapper.get('svg').attributes('viewBox')).toBe('0 0 480 340')
    wrapper.unmount()
    expect(disconnect).toHaveBeenCalledOnce()
  })

  it('reports cyclic input instead of producing an invalid layout', () => {
    const wrapper = mount(SankeyChart, {
      props: {
        data: {
          nodes: [{ id: 'a' }, { id: 'b' }],
          links: [
            { source: 'a', target: 'b', value: 1 },
            { source: 'b', target: 'a', value: 1 },
          ],
        },
      },
    })

    expect(wrapper.text()).toContain('acyclic directed graph')
    expect(wrapper.find('.cw-viz-sankey__node').exists()).toBe(false)
  })

  it('reports links that cannot produce valid flow geometry', () => {
    const wrapper = mount(SankeyChart, {
      props: {
        data: {
          nodes: [{ id: 'a' }, { id: 'b' }],
          links: [{ source: 'a', target: 'missing', value: 1 }],
        },
      },
    })

    expect(wrapper.text()).toContain('references an unknown node')
    expect(wrapper.find('.cw-viz-sankey__link').exists()).toBe(false)
  })
})
