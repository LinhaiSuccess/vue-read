/*
 * File: /src/index.ts
 * Project: @vue/shared
 * Created Date: 2022-09-15
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 共享模块
 * Description: 各模块都需要的公共API
 */

// 导出形状
// 导出对比标识
export * from './patchFlags';
export * from './shapeFlags';

// 是否对象
export const isObject = value => typeof value === 'object' && value !== null;

// 是否数组
export const isArray = Array.isArray;

// 是否自身属性
const hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasOwn = (value, key) => {
  // 防止对象上真有 hasOwnProperty 的属性，我们直接使用原型链上的函数
  return hasOwnProperty.call(value, key);
}

// 是否字符串
export const isString = value => typeof value === 'string';

// 是否整数key
export const isIntegerKey = key => {
  // 是字符串 而且 排除 NaN 的情况 而且 不是负数 而且 转换为数组后再隐士转换为字符串是否与key相等
  return isString(key) && key !== 'NaN' && key[0] !== '-' && '' + parseInt(key, 10) === key;
}

// 新值和旧值是否相同
export const hasChanged = (value, oldValue) => !Object.is(value, oldValue);

// 是否函数
export const isFunction = value => typeof value === 'function';

// 是否数值
export const isNumber = value => typeof value === 'number';

// 是否 on（事件是 on 开头）
const onRE = /^on[^a-z]/;
export const isOn = key => onRE.test(key);

// 串联式转驼峰式
const camelizeReg = /-(\w)/g;
export const camelize = value => value.replace(camelizeReg, (_, s) => (s ? s.toUpperCase() : ''));

// 添加on前缀关键字
export const toHandlerKey = value => value ? `on${value[0].toUpperCase() + value.slice(1)}` : '';

// - 字符连接，toUser-login -> to-user-login
const hyphenateReg = /\B([A-Z])/g;
export const hyphenate = value => value.replace(hyphenateReg, "-$1").toLowerCase();

// 调用数组内的函数
export const invokeArrayFns = (fns, arg?) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i](arg);
  }
}