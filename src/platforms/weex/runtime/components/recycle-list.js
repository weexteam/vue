/* @flow */

import { def, warn, noop } from 'core/util/index'
import { hasOwn, isPlainObject } from 'shared/util'

function watchArray (parentVm: Component, vm: Component, array: Array<any>): Function {
  if (!Array.isArray(array)) {
    return noop
  }
  const unwatches: Array<Function> = array.map((item, index) => {
    if (!isPlainObject(item) || hasOwn(item, '[[Watched]]')) {
      return noop
    }
    def(item, '[[Watched]]', true)
    return parentVm.$watch(() => {
      let str
      for (const k in item) {
        str = item[k]
      }
      return str
    }, () => {
      const updateListItem = vm.$el.updateData || ((i, x) => {
        warn(`Failed to update list item data at ${i}!`)
      })
      updateListItem.call(vm.$el, array.indexOf(item), item)
    }, { deep: true })
  })
  return () => {
    unwatches.forEach(unwatch => unwatch())
  }
}

export default {
  name: 'recycle-list',
  render (h: Function) {
    if (this._vnode && hasOwn(this.$options, '[[UseCache]]')) {
      def(this.$options, '[[UseCache]]', false)
      return this._vnode
    }

    const parent = this.$options.parent
    const bindingKey = this.$attrs.bindingKey
    if (parent && bindingKey && !hasOwn(this.$options, '[[Watched]]')) {
      def(this.$options, '[[Watched]]', true)
      parent.$watch(bindingKey, newList => {
        def(this.$options, '[[UseCache]]', true)
      }, { deep: true, immediate: true })

      const listData = this.$attrs.listData
      if (listData) {
        watchArray(parent, this, listData)
      }
      parent.$watch(bindingKey, (newList, old) => {
        this.$nextTick(() => {
          // TODO: diff array
          const updateList = this.$el.setListData || (_ =>
            warn('Failed to update list data!')
          )
          updateList.call(this.$el, newList)
        })
        watchArray(parent, this, newList)
      })
    }
    return h('weex:recycle-list', this.$slots.default)
  },
  renderError (h: Function, err: Error) {
    return h('text', {
      style: {
        fontSize: '36px',
        color: '#FF0000'
      },
      value: err.toString()
    })
  }
}
