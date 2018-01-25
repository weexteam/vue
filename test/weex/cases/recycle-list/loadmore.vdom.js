({
  type: 'recycle-list',
  attr: {
    append: 'tree',
    listData: [1, 2, 3, 4, 5],
    index: 'i',
    alias: 'num'
  },
  event: ['loadmore'],
  children: [{
    type: 'cell-slot',
    attr: { append: 'tree' },
    classList: ['center'],
    children: [{
      type: 'div',
      classList: ['center', 'panel'],
      children: [{
        type: 'text',
        classList: ['text'],
        attr: {
          value: { '@binding': 'num' }
        }
      }]
    }]
  }]
})
