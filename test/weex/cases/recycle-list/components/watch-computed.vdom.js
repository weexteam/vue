({
  type: 'recycle-list',
  attr: {
    append: 'tree',
    listData: [
      { start: 1 },
      { start: 2 },
      { start: 3 }
    ],
    alias: 'item',
    index: 'i'
  },
  children: [{
    type: 'cell-slot',
    attr: { append: 'tree' },
    children: [{
      type: 'div',
      attr: {
        '@isComponentRoot': true,
        '@componentProps': {
          start: { '@binding': 'item.start' }
        }
      },
      children: [{
        type: 'text',
        classList: ['output'],
        attr: {
          value: [
            'f(',
            { '@binding': 'x' },
            ', ',
            { '@binding': 'y' },
            ') = ',
            { '@binding': 'result' }
          ]
        }
      }, {
        type: 'div',
        classList: ['btn-group'],
        children: [{
          type: 'text',
          classList: ['btn'],
          event: ['click'],
          attr: {
            value: 'x++'
          }
        }, {
          type: 'text',
          classList: ['btn'],
          event: ['click'],
          attr: {
            value: 'y++'
          }
        }]
      }]
    }]
  }]
})
