/*
 * File: /src/index.ts
 * Project: @vue/shared
 * Created Date: 2022-09-15
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 共享模块
 * Description: 各模块都需要的公共API
 */

// 是否对象
export const isObject = value => {
  return typeof value === 'object' && value !== null;
}

// 是否数组
export const isArray = Array.isArray;

// 是否自身属性
const hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasOwn = (value, key) => {
  // 防止对象上真有 hasOwnProperty 的属性，我们直接使用原型链上的函数
  return hasOwnProperty.call(value, key);
}