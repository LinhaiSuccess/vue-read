/*
 * File: /src/component.ts
 * Project: @vue/runtime-core
 * Created Date: 2022-12-18
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 组件处理
 * Description: 用于处理：创建组件实例、创建setup上下文、处理setup结果
 */

import { proxyRefs, reactive, shallowReadonly, toRaw } from "@vue/reactivity";
import { isFunction, isObject } from "@vue/shared";
import { emit } from "./componentEmits";
import { initProps } from "./componentProps";
import { createRenderContext, PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";

// 创建组件实例
export const createComponentInstance = (vnode, parent) => {
  const instance = {
    type: vnode.type,                   // 组件类型（在组件中 type 就是 VueComponment）
    parent,                             // 父组件
    ctx: {},                            // 组件实例上下文
    data: null,                         // 用户组件内的 data（兼容Vue2）
    vnode,                              // vnode 节点
    isMounted: false,                   // 是否挂载
    propsOptions: vnode.type.props,     // 用户传递的 props（组件属性的类型定义）
    props: {},                          // 组件属性（响应式）
    attrs: {},                          // 元素属性（非响应式）
    proxy: null,                        // 组件实例的代理
    render: null,                       // 组件内的 render 函数
    subTree: null,                      // 渲染的组件内容
    update: null,                       // 更新组件时调用，是保存的 effect 的 run 方法
    next: null,                         // 下一个虚拟节点
    setupState: {},                     // setup 的返回值
    emit: () => { },                    // emit事件函数
    slots: {},                          // 插槽
    // 父子组件通信提供对象
    provides: parent ? parent.provides : Object.create(null)
  };
  // 添加组件实例上下文（创建新代理对象给当前上下文）
  instance.ctx = createRenderContext(instance);
  // 添加事件 emit 到组件实例
  instance.emit = emit.bind(null, instance);
  return instance;
}

// 创建 setup 上下文
export const createSetupContext = instance => {
  // 事件（发布订阅模式）
  return { emit: instance.emit, attrs: instance.attrs, slots: instance.slots };
}

// 设置组件
export const setupComponent = instance => {
  const { props, children } = instance.vnode;
  // 初始化属性（将原始属性分类为 props、attrs ）
  initProps(instance, props);
  // 初始化插槽
  initSlots(instance, children);
  // 设置有状态的组件
  setupStatefulComponent(instance);
}

// 设置有状态的组件
const setupStatefulComponent = instance => {
  const { type } = instance.vnode;
  // 添加代理对象
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);

  // setup 统一入口的处理
  const setup = type.setup;
  if (setup) {
    // 设置当前组件实例（setup执行之前设置，用户可以使用，setup执行完后给设置空）
    setCurrentInstance(instance);

    // 执行 setup 函数，获取返回值
    // setup 参数为：（ props, context({ emit,attrs, slots }) ）
    const setupResult = setup(shallowReadonly(instance.props), createSetupContext(instance));

    // 当前组件 setup 已执行完，将当前实例全局变量设置为null
    setCurrentInstance(null);

    // 处理setup结果
    handleSetupResult(instance, setupResult);
  } else {
    // 完成组件设置
    finishComponentSetup(instance);
  }
}

// 处理setup结果
const handleSetupResult = (instance, setupResult) => {
  if (isFunction(setupResult)) {
    // 是函数，render函数直接使用这里的函数
    instance.render = setupResult;
  } else if (isObject(setupResult)) {
    // 是对象，保存到 组件实例 中
    // 因为在模板中是不需要 .value 的，所以我们需要先脱 ref
    instance.setupState = proxyRefs(setupResult);
    // 将 setupState 中的所有属性给 ctx，否则在 render 函数中通过 with(_ctx) 无法直接使用属性
    exposeSetupStateOnRenderContext(instance);
  }
  // 完成组件设置
  finishComponentSetup(instance);
}

// 完成组件设置
const finishComponentSetup = instance => {
  // 如果处理 setup 结果时没有 render，则代表 setup 返回的是对象
  if (!instance.render) {
    // 若注册了运行时编译且组件内也没有渲染函数，则就地编译
    if (compile && !instance.type.render) {
      // 取出用户组件内的 template 属性，里面存放的就是 html 模板字符串
      const template = instance.type.template;
      if (template) {
        // 将编译后的render函数给用户组件的render
        instance.type.render = compile(template);
      }
    }
    // 将用户的渲染函数挂载到组件实例中
    instance.render = instance.type.render;
  }

  // 兼容Vue2（本项目只兼容Vue2的 data，不去兼容 mounted、methods等等）
  applyOptions(instance);
}

// 应用 Options
const applyOptions = instance => {
  // 取出组件对象
  const { type } = instance;
  // 这里的 data 就是用户组件内的响应式对象
  const data = type.data;
  if (data) {
    if (!isFunction(data)) {
      console.warn('data 选项必须是个函数');
      return;
    }
    // data 中返回的就是一个对象，所以直接使用 reactive 变成响应式对象
    // 将 data 中的 this 指向改为 instance.proxy（组件实例代理对象）
    instance.data = reactive(data.call(instance.proxy));
  }
}

// 将组件 setup 返回的数据全部放到上下文中
// 虽然在 render 函数通过 ctx 可以获取到 setup 返回的内容，但是那是通过代理拿到的，如果通过 with(ctx) 包裹，也是无法直接使用的，所以这里需要放 ctx 中
export const exposeSetupStateOnRenderContext = instance => {
  const { ctx, setupState } = instance;
  // 因为 setupState 是 shallowReadonly 返回的响应式对象，所以需要通过 toRaw 拿到源对象
  Object.keys(toRaw(setupState)).forEach(key => {
    // 通过 属性访问器 代理，
    Object.defineProperty(ctx, key, {
      enumerable: true,               // 让属性可以枚举出来
      configurable: true,             // 允许该属性特性被修改甚至从对象被删除
      get: () => setupState[key],
    });
  });
}

// 注册运行时渲染
let compile;
export const registerRuntimeCompiler = _compile => compile = _compile;

// 当前实例（正在执行的组件实例）
export let currentInstance = null;

// 设置当前组件实例
export const setCurrentInstance = instance => currentInstance = instance;

// 获取当前组件实例
export const getCurrentInstance = () => currentInstance;

// 生命周期钩子枚举
export const enum LifecycleHooks {
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
  BEFORE_UNMOUNT = 'bum',
  UNMOUNTED = 'um'
}