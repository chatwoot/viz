const sampleData = {
  nodes: [
    {
      id: 'conversations_handled',
      label: 'Handled',
      count: 239,
      color: 'var(--sankey-handled-color)',
    },
    {
      id: 'resolved_by_captain',
      label: 'Resolved by Captain',
      count: 130,
      color: 'var(--sankey-captain-color)',
    },
    {
      id: 'handed_off',
      label: 'Handed off',
      count: 46,
      color: '#915930',
    },
    {
      id: 'closed_with_team',
      label: 'Closed with team',
      count: 63,
      color: '#60646c',
    },
    {
      id: 'reopened_within_7_days',
      label: 'Reopened in 7d',
      count: 33,
      color: '#ca244e',
    },
    {
      id: 'stayed_closed',
      label: 'Stayed closed',
      count: 33,
      color: 'var(--sankey-captain-color)',
    },
    {
      id: 'handoff_reason_unsupported_request',
      label: 'Unsupported request',
      count: 14,
      color: '#915930',
    },
    {
      id: 'handoff_reason_customer_request',
      label: 'Customer request',
      count: 8,
      color: '#915930',
    },
    {
      id: 'other_reasons',
      label: 'Other reasons',
      count: 24,
      color: '#915930',
    },
  ],
  links: [
    { source: 'conversations_handled', target: 'resolved_by_captain', value: 130 },
    { source: 'conversations_handled', target: 'handed_off', value: 46 },
    { source: 'conversations_handled', target: 'closed_with_team', value: 63 },
    { source: 'resolved_by_captain', target: 'reopened_within_7_days', value: 33 },
    { source: 'resolved_by_captain', target: 'stayed_closed', value: 97 },
    { source: 'handed_off', target: 'handoff_reason_unsupported_request', value: 14 },
    { source: 'handed_off', target: 'handoff_reason_customer_request', value: 8 },
    { source: 'handed_off', target: 'other_reasons', value: 24 },
  ],
}

export const DEFAULT_DATA = JSON.stringify(sampleData, null, 2)
