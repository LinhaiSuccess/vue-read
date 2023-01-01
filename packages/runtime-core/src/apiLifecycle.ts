/*
 * File: /src/apiLifecycle.ts
 * Project: @vue/runtime-core
 * Created Date: 2023-01-01
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 生命周期API
 * Description: 用于创建生命周期钩子、注入 hook 钩子、执行 hook
 */

import { currentInstance, LifecycleHooks, setCurrentInstance } from "./component";

// 注入 hook 钩子
const injectHook = (type, hook, target = currentInstance) => {
  // 当调用钩子函数时，会执行到这里，那么目标组件实例就是当前组件实例
  if (target) {
    // 从当前实例中取出当前类型对应的数组，若是不存在则代表第一次调用该钩子，则赋值空数组
    const hooks = target[type] || (target[type] = []);

    // 该函数会在不同时期执行，如 渲染前：onBeforeMount、渲染后：onMounted
    const wrappedHook = (...args) => {
      // 为什么要在闭包内重新设置当前实例？因为当前实例这个全局变量在执行完 setup 后我们就给设置为了null
      // 而在设置完 null 后才去触发的 onBeforeMount，但用户还真有可能在生命周期函数内去调用 getCurrentInstance
      // 所以我们不能直接 push 到 hooks 中，而是需要先用一个闭包，在执行前重新设置当前组件实例
      setCurrentInstance(target);
      // 执行钩子函数
      const res = args ? hook(...args) : hook();
      // 重新设置回 null
      setCurrentInstance(null);
      return res;
    }
    // 将包装后的函数放入 组件实例 数组中
    hooks.push(wrappedHook);

    // 返回闭包
    return wrappedHook;
  }
}

// 创建 hook
const createHook = lifecycle => {
  // 返回闭包函数
  return (hook, target = currentInstance) => {
    // 返回注入钩子
    return injectHook(lifecycle, hook, target);
  }
}

// 执行 createHook，并传递不同枚举类型，接收返回的函数
export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)
export const onMounted = createHook(LifecycleHooks.MOUNTED)
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE)
export const onUpdated = createHook(LifecycleHooks.UPDATED)
export const onBeforeUnmount = createHook(LifecycleHooks.BEFORE_UNMOUNT)
export const onUnmounted = createHook(LifecycleHooks.UNMOUNTED)