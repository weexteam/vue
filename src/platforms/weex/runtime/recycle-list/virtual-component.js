/* @flow */

// https://github.com/Hanks10100/weex-native-directive/tree/master/component

import { mergeOptions, isPlainObject, def, noop } from 'core/util/index'
import Watcher from 'core/observer/watcher'
import { initProxy } from 'core/instance/proxy'
import { initState, getData } from 'core/instance/state'
import { initRender } from 'core/instance/render'
import { initEvents } from 'core/instance/events'
import { initProvide, initInjections } from 'core/instance/inject'
import { initLifecycle, callHook } from 'core/instance/lifecycle'
import { initInternalComponent, resolveConstructorOptions } from 'core/instance/init'
import { registerComponentHook, updateComponentData } from '../../util/index'

let uid = 0

// override Vue.prototype._init
function initVirtualComponent (options: Object = {}) {
  const vm: Component = this
  const componentId = options.componentId

  // virtual component uid
  vm._uid = componentId || `virtual-component-${uid++}`

  // a flag to avoid this being observed
  vm._isVue = true
  // vm._isVirtualComponent = true
  // merge options
  if (options && options._isComponent) {
    // optimize internal component instantiation
    // since dynamic options merging is pretty slow, and none of the
    // internal component options needs special treatment.
    initInternalComponent(vm, options)
  } else {
    vm.$options = mergeOptions(
      resolveConstructorOptions(vm.constructor),
      options || {},
      vm
    )
  }

  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    initProxy(vm)
  } else {
    vm._renderProxy = vm
  }

  vm._self = vm
  initLifecycle(vm)
  initEvents(vm)
  initRender(vm)
  callHook(vm, 'beforeCreate')
  initInjections(vm) // resolve injections before data/props
  initState(vm)
  initProvide(vm) // resolve provide after data/props
  callHook(vm, 'created')

  // send initial data to native
  const _data = vm.$options.data
  const data = typeof _data === 'function'
    ? getData(_data, vm)
    : _data || {}
  if (isPlainObject(data)) {
    updateComponentData(String(vm._uid), data)
  }

  registerComponentHook(String(vm._uid), 'lifecycle', 'attach', () => {
    callHook(vm, 'beforeMount')

    const updateComponent = () => {
      vm._update(vm._vnode, false)
    }
    new Watcher(vm, updateComponent, noop, null, true)

    // watch all keys in data and send mutation to native
    Object.keys(data).forEach(key => {
      vm.$watch(key, (newValue) => {
        updateComponentData(String(vm._uid), { [key]: newValue })
      }, { deep: true })
    })

    vm._isMounted = true
    callHook(vm, 'mounted')
  })

  registerComponentHook(componentId, 'lifecycle', 'detach', () => {
    vm.$destroy()
  })
}

// override Vue.prototype._update
function updateVirtualComponent (vnode?: VNode) {
  const vm: Component = this
  const componentId = vm.$options.componentId
  if (vm._isMounted) {
    callHook(vm, 'beforeUpdate')
  }
  vm._vnode = vnode
  if (vm._isMounted && componentId) {
    // TODO: data should be filtered and without bindings
    const data = Object.assign({}, vm._data)
    updateComponentData(componentId, data, () => {
      callHook(vm, 'updated')
    })
  }
}

function initVirtualComponentTemplate (options: Object = {}) {
  const vm: Component = this

  // virtual component template uid
  vm._uid = `virtual-component-template-${uid++}`

  // a flag to avoid this being observed
  vm._isVue = true
  // merge options
  if (options && options._isComponent) {
    // optimize internal component instantiation
    // since dynamic options merging is pretty slow, and none of the
    // internal component options needs special treatment.
    initInternalComponent(vm, options)
  } else {
    vm.$options = mergeOptions(
      resolveConstructorOptions(vm.constructor),
      options || {},
      vm
    )
  }

  vm._self = vm
  initEvents(vm)
  initRender(vm)
  initState(vm)

  this.registerVirtualComponent()
}

// listening on native callback
export function resolveVirtualComponent (vnode: MountedComponentVNode): VNode {
  const BaseCtor = vnode.componentOptions.Ctor
  const VirtualComponent = BaseCtor.extend({})
  VirtualComponent.prototype._init = initVirtualComponent
  VirtualComponent.prototype._update = updateVirtualComponent

  vnode.componentOptions.Ctor = BaseCtor.extend({
    methods: {
      registerVirtualComponent () {
        const vm: Component = this
        def(vm, '_virtualComponents', {})

        registerComponentHook(
          String(vm._uid),
          'lifecycle',
          'create',

          // create virtual component
          (componentId, propsData) => {
            const subVm = new VirtualComponent({
              componentId,
              propsData
            })
            subVm._uid = componentId
            if (vm._virtualComponents) {
              vm._virtualComponents[componentId] = subVm
            }
          }
        )
      },
      destroyVirtualComponents () {
        delete this._virtualComponents
      }
    }
  })
  vnode.componentOptions.Ctor.prototype._init = initVirtualComponentTemplate
  vnode.componentOptions.Ctor.prototype._update = noop
}

