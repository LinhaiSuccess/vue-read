/*
 * File: /src/componentEmits.ts
 * Project: @vue/runtime-core
 * Created Date: 2022-12-18
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 组件事件
 */

import { camelize, hyphenate, isFunction, toHandlerKey } from "@vue/shared";

// 组件事件函数
export function emit(instance, event, ...rawArgs) {
  let args = rawArgs;
  // 从 vnode 中取出属性
  const props = instance.vnode.props || {};
  // 看是否 v-model 监听
  const isModelListener = event.startsWith('update:');

  // 事件名称
  let handlerName;
  // event参数是用户传递的，是不属于我们的规范的，传递的可能是：login，需要转换为 onLogin
  // 而转换为 onLogin 后，可能在属性中找不到，那用户可能使用的是 串联式命名法，我们就通过串联式转换为驼峰，再转换为 onLogin
  let handler = props[(handlerName = toHandlerKey(event))] || props[(handlerName = toHandlerKey(camelize(event)))];
  if (!handler && isModelListener) {
    // 如果上面两次转换还是没找到，而且还是 v-model，就先将事件转换为 - 字符连接，再添加 on
    // toUser-login -> to-user-login
    handler = props[(handlerName = toHandlerKey(hyphenate(event)))];
  }

  // 执行并将参数传递过去
  if (handler) {
    if (isFunction(handler)) {
      args ? handler(...args) : handler();
    }
  }
}

