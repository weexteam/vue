/* @flow */

import { def } from 'core/util/index'
import { hasOwn, isPlainObject } from 'shared/util'
import { updateRecycleListData } from 'weex/util/index'

function watchArray (vm, $el, array) {
  if (!Array.isArray(array)) {
    return
  }
  array.forEach(item => {
    if (!isPlainObject(item) || hasOwn(item, '[[Watched]]')) {
      return
    }
    vm.$watch(() => {
      let str
      for (const k in item) {
        str = item[k]
      }
      return str
    }, () => {
      updateRecycleListData($el, item, array.indexOf(item))
    }, { deep: true })
    def(item, '[[Watched]]', true)
  })
}

export default {
  name: 'recycle-list',
  render (h: Function) {
    const parent = this.$options.parent
    const bindingKey = this.$attrs.bindingKey
    if (parent && bindingKey && !hasOwn(this.$options, '[[Watched]]')) {
      def(this.$options, '[[Watched]]', true)
      parent.$watch(bindingKey, newList => {
        def(this.$options, '[[UseCache]]', true)
      }, { deep: true })

      const listData = this.$attrs.listData
      if (listData) {
        watchArray(parent, this.$el, listData)
      }
      parent.$watch(bindingKey, (newList, old) => {
        watchArray(parent, this.$el, newList)
        updateRecycleListData(this.$el, newList)
      })
    }

    if (this.$el && hasOwn(this.$options, '[[UseCache]]')) {
      def(this.$options, '[[UseCache]]', false)
      return this.$el
    }
    return h('weex:recycle-list', this.$slots.default)
  }
}
