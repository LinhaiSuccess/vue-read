/*
 * File: /src/helpers/renderList.ts
 * Project: @vue/runtime-core
 * Created Date: 2023-01-01
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 列表渲染
 * Description: v-for 指令编译后的操作
 */

import { isArray, isNumber, isObject, isString } from "@vue/shared";

// 列表渲染函数
export const renderList = (source, renderItem) => {
  // 虚拟节点列表
  let ret = [];

  if (isArray(source) || isString(source)) {
    // 是数组或字符串
    ret = new Array(source.length);
    // 遍历响应式对象
    for (let i = 0, l = source.length; i < l; i++) {
      // 遍历数组每一项并接收虚拟节点
      ret[i] = renderItem(source[i], i);
    }
  } else if (isNumber(source)) {
    // 是数值，变成数组
    ret = new Array(source);
    // 循环并接收虚拟节点
    for (let i = 0; i < source; i++) {
      ret[i] = renderItem(i + 1, i);
    }

  } else if (isObject(source)) {
    // 获取对象全部的key
    const keys = Object.keys(source);
    // 创建于对象属性个数一样多的数组
    ret = new Array(keys.length);
    // 遍历，一直到最后一个key，将对象的每个值分别传递给回调函数，接收 vnode
    for (let i = 0, l = keys.length; i < l; i++) {
      const key = keys[i];
      ret[i] = renderItem(source[key], key);
    }
  } else {
    ret = [];
  }
  return ret;
}

