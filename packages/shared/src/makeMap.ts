/*
 * File: /src/makeMap.ts
 * Project: vue
 * Created Date: 2023-02-11
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 地图绘制
 */

// 隔开参数制作Map，并返回闭包函数
export const makeMap = (str, expectsLowerCase?) => {
  // 创建一个基于空的对象
  const map = Object.create(null);
  const list = str.split(',');
  // 指令为key，值为 true
  list.forEach(item => map[item] = true);

  // 返回当前值是否在map中存在
  return expectsLowerCase ? val => !!map[val.toLowerCase()] : val => !!map[val];
}