const lineData = {
  categories: [
    {
      id: 'jun-01-07',
      label: 'Jun 01 - 07',
    },
    {
      id: 'jun-08-14',
      label: 'Jun 08 - 14',
    },
    {
      id: 'jun-15-21',
      label: 'Jun 15 - 21',
    },
    {
      id: 'jun-22-30',
      label: 'Jun 22 - 30',
    },
  ],
  series: [
    {
      id: 'handled',
      label: 'Handled',
      color: '#d9d9e0',
      pointBorderColor: '#ebebef',
      pointColor: '#b9bbc6',
      valueColor: '#60646c',
      data: [30, 40, 35, 51],
    },
    {
      id: 'resolved',
      label: 'Resolved',
      color: '#009688',
      pointBorderColor: '#ccf3ee',
      data: [12, 29, 23, 39],
    },
  ],
}

const percentageData = {
  examples: [
    {
      id: 'credit-usage',
      segments: [
        {
          id: 'assistant',
          label: 'Assistant',
          value: 40,
          color: '#4747c2',
        },
        {
          id: 'tasks',
          label: 'Tasks',
          value: 30,
          color: '#ab4aba',
        },
        {
          id: 'copilot',
          label: 'Copilot',
          value: 30,
          color: '#009688',
        },
      ],
    },
    {
      id: 'storage',
      total: 500,
      segments: [
        {
          id: 'documents',
          label: 'Documents',
          value: 100,
          color: '#e5484d',
        },
        {
          id: 'music',
          label: 'Music',
          value: 30,
          color: '#f5a623',
        },
        {
          id: 'apps',
          label: 'Apps',
          value: 120,
          color: '#2f80ed',
        },
      ],
    },
    {
      id: 'rating-distribution',
      segments: [
        {
          id: 'excellent',
          label: 'Excellent',
          value: 62,
          color: '#3ecf4c',
          description: 'Based on 62 responses',
        },
        {
          id: 'good',
          label: 'Good',
          value: 27,
          color: '#6bd36e',
          description: 'Based on 27 responses',
        },
        {
          id: 'average',
          label: 'Average',
          value: 19,
          color: '#ffed55',
          description: 'Based on 19 responses',
        },
        {
          id: 'fair',
          label: 'Fair',
          value: 9,
          color: '#ffbf2f',
          description: 'Based on 9 responses',
        },
        {
          id: 'poor',
          label: 'Poor',
          value: 75,
          color: '#ffad28',
          description: 'Based on 75 responses',
        },
      ],
    },
  ],
}

const barData = {
  stacked: false,
  timeseries: true,
  categories: [
    {
      id: 'aug-01',
      label: '01-Aug',
    },
    {
      id: 'aug-02',
      label: '02-Aug',
    },
    {
      id: 'aug-03',
      label: '03-Aug',
    },
    {
      id: 'aug-04',
      label: '04-Aug',
    },
    {
      id: 'aug-05',
      label: '05-Aug',
    },
    {
      id: 'aug-06',
      label: '06-Aug',
    },
    {
      id: 'aug-07',
      label: '07-Aug',
    },
  ],
  series: [
    {
      id: 'resolution-time',
      label: 'Resolution Time',
      color: '#2f80ed',
      data: [
        {
          value: 747,
          formattedValue: '12 Hr 27 Min',
          description: 'Based on 14 conversations',
        },
        {
          value: 682,
          formattedValue: '11 Hr 22 Min',
          description: 'Based on 18 conversations',
        },
        {
          value: 795,
          formattedValue: '13 Hr 15 Min',
          description: 'Based on 11 conversations',
        },
        {
          value: 631,
          formattedValue: '10 Hr 31 Min',
        },
        {
          value: 714,
          formattedValue: '11 Hr 54 Min',
          description: 'Based on 16 conversations',
        },
        {
          value: 588,
          formattedValue: '9 Hr 48 Min',
          description: 'Based on 20 conversations',
        },
        {
          value: 659,
          formattedValue: '10 Hr 59 Min',
          description: 'Based on 17 conversations',
        },
      ],
    },
  ],
}

const heatmapData = {
  columns: Array.from({ length: 24 }, (_, hour) => ({
    id: `hour-${hour}`,
    label: `${String(hour).padStart(2, '0')}:00`,
  })),
  rows: [
    {
      id: '2026-08-06',
      label: 'Thursday',
      description: 'Aug 6, 2026',
      data: [3, 2, 1, 2, 2, 1, 0, 1, 0, 0, 3, 0, 2, 1, 3, 1, 4, 1, 3, 4, 5, 4, 4, 3],
    },
    {
      id: '2026-08-07',
      label: 'Friday',
      description: 'Aug 7, 2026',
      data: [3, 1, 2, 1, 1, 0, 1, 2, 0, 1, 0, 0, 0, 5, 1, 4, 3, 2, 5, 3, 2, 5, 2, 4],
    },
    {
      id: '2026-08-08',
      label: 'Saturday',
      description: 'Aug 8, 2026',
      data: [1, 3, 3, 2, 0, 2, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 3, 2, 0, 1, 1, 1, 2],
    },
    {
      id: '2026-08-09',
      label: 'Sunday',
      description: 'Aug 9, 2026',
      data: [0, 1, 1, 1, 1, 2, 0, 1, 0, 0, 0, 3, 3, 0, 1, 3, 2, 3, 0, 0, 2, 1, 0, 1],
    },
    {
      id: '2026-08-10',
      label: 'Monday',
      description: 'Aug 10, 2026',
      data: [1, 3, 1, 1, 1, 0, 0, 0, 0, 2, 1, 4, 3, 2, 5, 5, 3, 4, 4, 5, 1, 3, 5, 4],
    },
    {
      id: '2026-08-11',
      label: 'Tuesday',
      description: 'Aug 11, 2026',
      data: [3, 2, 3, 1, 2, 0, 0, 1, 0, 0, 1, 1, 5, 5, 4, 5, 3, 4, 5, 3, 3, 5, 3, 0],
    },
    {
      id: '2026-08-12',
      label: 'Wednesday',
      description: 'Aug 12, 2026',
      data: [5, 2, 2, 2, 1, 0, 0, 0, 1, 0, 2, 2, 5, 4, 2, 1, 4, 4, 3, 2, 4, 0, 0, 0],
    },
  ],
}

const sankeyData = {
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

export const DEFAULT_BAR_DATA = JSON.stringify(barData, null, 2)
export const DEFAULT_HEATMAP_DATA = JSON.stringify(heatmapData, null, 2)
export const DEFAULT_LINE_DATA = JSON.stringify(lineData, null, 2)
export const DEFAULT_PERCENTAGE_DATA = JSON.stringify(percentageData, null, 2)
export const DEFAULT_SANKEY_DATA = JSON.stringify(sankeyData, null, 2)
