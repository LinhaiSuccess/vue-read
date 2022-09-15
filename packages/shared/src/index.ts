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