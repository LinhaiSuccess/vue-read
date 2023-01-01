/*
 * File: /src/apiAsyncComponent.ts
 * Project: @vue/runtime-core
 * Created Date: 2023-01-01
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 异步组件的定义
 */
import { ref } from "@vue/reactivity";
import { isFunction } from '@vue/shared';
import { createVNode, Fragment } from './vnode';

export const defineAsyncComponent = source => {
  if (isFunction(source)) {
    // 如果是函数，则套进 loader 属性中
    source = { loader: source };
  }

  // 将参数解构出来
  const {
    loader,             // 加载函数
    loadingComponent,   // 加载中要渲染的组件
    errorComponent,     // 超时后要渲染的组件
    delay = 200,        // 要等待多久 loader 依旧没有加载出来才渲染 loadingComponent 组件
    timeout,            // 超时时间 超时后渲染 errorComponent 组件
    onError             // 如果 loader 函数返回错误，需要将错误信息和重试函数传递给该错误回调函数
  } = source;

  // 要渲染的组件，默认为null
  let resolvedComp = null;
  // 失败次数
  let retries = 0;
  // 重试函数（这里会是用户调用）
  const retry = () => {
    // 失败次数+1
    retries++;
    // 执行下面的 load 函数
    return load();
  };

  // load 函数声明，在这里执行用户的 loader 函数，若失败可以再次调用该函数重试
  const load = () => {
    return loader().catch(err => {
      // 用户的异步 Promise 执行错误
      if (onError) {
        // 传递了 onError 函数，返回 Promise
        return new Promise((resolve, reject) => {
          // userRetry 这个函数给用户，用户调用后，会再次执行 loader
          const userRetry = () => resolve(retry());
          // userFail 这个函数给用户，用户调用后返回错误信息
          const userFail = () => reject(err);
          // 调用用户的 onError 回调函数
          onError(err, userRetry, userFail, retries + 1);
        });
      }
    });
  }

  // 返回组件
  return {
    name: 'AsyncComponentWrapper',
    get __asyncResolved() {
      return resolvedComp
    },
    setup() {
      // 默认未加载
      const loaded = ref(false);
      // 错误
      const error = ref();
      // loading
      const delayed = ref(!!delay)

      if (delay) {
        // 延时放入宏任务队列
        // 修改 delayed 响应式变量会触发更新视图
        setTimeout(() => delayed.value = false, delay);
      }
      if (timeout != null) {
        // 设置超时，超时后则触发更新视图
        setTimeout(() => error.value = true, timeout);
      }

      // 当 load 的 Promise.resolve 后，将返回的组件给 resolvedComp，并且触发响应式变量
      load().then(comp => {
        // 执行 load 函数，将用户 resolve 的组件设置到 resolvedComp 中
        resolvedComp = comp;
        // 设置 加载响应式变量，触发视图更新
        loaded.value = true;
      }).catch(err => error.value = err);

      // setup 返回函数，组件渲染时则会调用当前 render 函数
      return () => {
        if (loaded.value && resolvedComp) {
          // 返回新组件虚拟节点
          return createVNode(resolvedComp);
        } else if (error.value && errorComponent) {
          // 返回错误组件
          return createVNode(errorComponent, { error: error.value });
        } else if (!delayed.value && loadingComponent) {
          // 返回加载组件
          return createVNode(loadingComponent);
        }
        // 返回片段
        return createVNode(Fragment);
      }
    }
  }
}
