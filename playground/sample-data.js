const sampleData = {
  nodes: [{ name: 'Website' }, { name: 'Email' }, { name: 'Inbox' }, { name: 'Resolved' }],
  links: [
    { source: 0, target: 2, value: 64 },
    { source: 1, target: 2, value: 36 },
    { source: 2, target: 3, value: 82 },
  ],
}

export const DEFAULT_DATA = JSON.stringify(sampleData, null, 2)
