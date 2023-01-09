/*
 * File: /src/apiInject.ts
 * Project: @vue/runtime-core
 * Created Date: 2023-01-09
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 依赖注入
 * Description: 祖孙组件通信API
 */
import { isFunction } from "@vue/shared";
import { currentInstance } from "./component";

// 提供API
export function provide(key, value) {
  if (currentInstance == null) {
    // 当前实例为空，证明没有在 setup 中使用，直接返回
    console.warn('provide 必须在 setup 中使用');
    return;
  }
  // 获取当前实例上的 provides
  let provides = currentInstance.provides;
  // 获取父 provides
  const parentProvides = currentInstance.parent && currentInstance.parent.provides;
  // 若和父组件是相同对象，则基于原型创建新对象
  if (parentProvides === provides) {
    // 因为对象相同，如果自己往对象设置数据也会设置到祖宗那去，所以这里基于原型创建新对象，即可避免该问题
    provides = currentInstance.provides = Object.create(parentProvides);
  }
  // 设置值
  provides[key] = value;
}

// 注入
export function inject(key, defaultValue?, treatDefaultAsFactory = false) {
  if (currentInstance == null) {
    // 当前实例为空，证明没有在 setup 中使用，直接返回
    console.warn('provide 必须在 setup 中使用');
    return;
  }

  // 获取到父 provides
  const provides = currentInstance.parent && currentInstance.parent.provides;

  if (provides && (key in provides)) {
    // provides 中存在当前 key，将值返回
    return provides[key];
  } else if (arguments.length > 1) {
    // 若使用默认值并且为函数，则返回函数结果，否则返回默认值
    return treatDefaultAsFactory && isFunction(defaultValue) ? defaultValue.call(currentInstance.proxy) : defaultValue;
  }
}

