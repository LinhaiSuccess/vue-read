/*
 * File: /src/patchProp.ts
 * Project: @vue/runtime-dom
 * Created Date: 2022-10-15
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 浏览器的DOM属性操作API
 * Description: 对属性的对比操作
 */

import { isOn } from '@vue/shared';
import { patchAttr } from "./modules/attr";
import { patchClass } from "./modules/class";
import { patchEvent } from "./modules/event";
import { patchStyle } from "./modules/style";

// 属性对比
export const patchProp = (el, key, prevValue, nextValue) => {
  if (key === 'class') {
    // 对 class 属性的操作
    patchClass(el, nextValue);
  } else if (key === 'style') {
    // 对样式的操作
    patchStyle(el, prevValue, nextValue);
  } else if (isOn(key)) {
    // on 开头，后面的一个字母是大写，比如：onClick，则认为是个事件
    patchEvent(el, key, nextValue);
  } else if (key === 'innerHTML' || key === 'textContent') {
    // 是 v-html 和 v-text，这俩不能直接当属性用，应该直接设置值
    el[key] = nextValue == null ? '' : nextValue;
  } else {
    // 普通属性
    patchAttr(el, key, nextValue);
  }
}
