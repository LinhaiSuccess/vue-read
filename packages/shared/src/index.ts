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

// 是否字符串
export const isString = value => {
  return typeof value === 'string';
}

// 是否整数key
export const isIntegerKey = key => {
  // 是字符串 而且 排除 NaN 的情况 而且 不是负数 而且 转换为数组后再隐士转换为字符串是否与key相等
  return isString(key) && key !== 'NaN' && key[0] !== '-' && '' + parseInt(key, 10) === key;
}

// 新值和旧值是否相同
export const hasChanged = (value, oldValue) => !Object.is(value, oldValue)