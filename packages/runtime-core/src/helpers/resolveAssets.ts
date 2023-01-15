/*
 * File: /src/helpers/resolveAssets.ts
 * Project: @vue/runtime-core
 * Created Date: 2023-01-12
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 解决组件API
 * Description: 根据组件名称获取父组件内注册的组件
 */

import { camelize, capitalize } from '@vue/shared';
import { currentInstance } from '../component';
import { currentRenderingInstance } from './../componentRenderContext';

// 组件常量
export const COMPONENTS = 'components';

// 获取组件
export const resolveComponent = name => resolveAsset(COMPONENTS, name) || name;

// 根据组件名称获取组件
export const resolveAsset = (type, name) => {
  // 获取组件实例
  const instance = currentRenderingInstance || currentInstance;
  if (instance) {
    // 获取当前组件本身
    const Component = instance.type;
    // 拿到组件注册对象
    const registry = Component[type];
    // 通过原名称或驼峰获取子组件对象
    const res = registry && (registry[name] || registry[camelize(name)] || registry[capitalize(camelize(name))]);
    // 找到则返回
    if (res) {
      return res;
    }
  }
}

