/*
 * File: /src/componentPublicInstance.ts
 * Project: @vue/runtime-core
 * Created Date: 2022-12-18
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 公共实例
 */

import { shallowReadonly, toRaw } from '@vue/reactivity';
import { hasOwn } from "@vue/shared";
import { queueJob } from './scheduler';

// 公共属性映射表
export const publicPropertiesMap = {
  $: i => i,
  $el: i => i.vnode.el,
  $data: i => i.data,
  $props: i => shallowReadonly(i.props),
  $attrs: i => shallowReadonly(i.attrs),
  $slots: i => shallowReadonly(i.slots),
  $refs: i => shallowReadonly(i.refs),
  $emit: i => i.emit,
  $options: i => i.type,
  $forceUpdate: i => i.f || (i.f = () => queueJob(i.update))
};

// 公共实例代理处理
// 这里的逻辑就是 instance.proxy 的处理
export const PublicInstanceProxyHandlers = {
  // 取值时，可能取的是 setup、也可能取的是 data，也可能是 props 的，也可能是 attrs 的
  // 所以我们要判断谁里面有这个属性，然后给用户返回
  // 注意：Vue3中模板取值顺序为：setup返回值、data、属性

  // 代理的是 instance.ctx 上下文，而上下文的 _ 属性就是 instance
  get({ _: instance }, key) {
    const { data, props, setupState, ctx } = instance;

    // key只要不是 $ 开头的，就从这里面找
    if (key[0] !== "$") {
      if (hasOwn(setupState, key)) {
        // setup 返回了该属性，使用 setup 的
        return setupState[key];
      } else if (data && hasOwn(data, key)) {
        // data 上有该属性，使用 data 的
        return data[key];
      } else if (props && hasOwn(props, key)) {
        // 组件属性上有该属性，使用 props 的
        return props[key];
      } else if (ctx && hasOwn(ctx, key)) {
        // 上下文上有该属性，使用 ctx 的
        return ctx[key];
      }
    }
    // 到了这里，证明取的值都不是上面的，我们看看取的是不是公共属性上的值，比如：this.$attrs
    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
  },
  // 设置值时要判断，组件属性 props 的值不能被修改，setupState 和 data 以及其他都可以修改
  set({ _: instance }, key, value) {
    const { data, props, setupState, ctx } = instance;

    if (hasOwn(setupState, key)) {
      // setupState 中有该属性， 给 setupState 设置值
      setupState[key] = value;
      return true;
    } else if (data && hasOwn(data, key)) {
      // data 中有该属性， 给 data 设置值
      data[key] = value;
      return true;
    } else if (props && hasOwn(props, key)) {   // 只有这里直接返回 false，不再走下面的返回
      // 是组件属性，不允许修改值
      console.warn('试图尝试改变 prop ', key);
      return false;
    }
    // 如果 key 是使用 $ 开头，并且 $ 后面的名字在组件实例中也包含，就证明要修改 公共属性，肯定是不允许的
    if (key[0] === '$' && key.slice(1) in instance) {
      console.warn(`试图尝试更改 公共属性 ${key}，以$开头的属性是保留的和只读的`);
    } else {
      // 虽然是 $ 开头，但是不是 公共属性，允许修改
      ctx[key] = value
    }
    return true;
  }
}

// 创建渲染上下文
export const createRenderContext = instance => {
  const target = {};
  // 通过属性访问器添加属性，属性key就叫 _
  Object.defineProperty(target, '_', {
    configurable: true,     // 允许该属性特性被修改甚至从对象被删除
    enumerable: false,      // 该属性不可枚举
    get: () => instance
  });

  // 将公共属性映射表中所有属性都代理一遍
  Object.keys(publicPropertiesMap).forEach(key => {
    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: false,
      get: () => publicPropertiesMap[key](instance)
    });
  });

  return target;
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
