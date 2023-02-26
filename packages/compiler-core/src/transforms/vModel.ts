/*
 * File: /src/transforms/vModel.ts
 * Project: @vue/compiler-core
 * Created Date: 2023-02-26
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 转换 v-model
 */

import { createCompoundExpression, createObjectProperty, createSimpleExpression } from "../ast";

export const transformModel = dir => {
  // 这边的 arg 是 v-model 冒号后面的字符，如：v-model:value 
  const { exp, arg } = dir;
  // 如果没有参数，则使用 modelValue
  const propName = arg ? arg : createSimpleExpression('modelValue', true);
  // 事件名，如果有参数则使用参数，否则使用默认的 modelValue
  const eventName = arg ? `onUpdate:${arg.content}` : 'onUpdate:modelValue';
  // 创建符合表达式，子节点项为字符串回调（将事件的值给用户的表达式）
  const assignmentExp = createCompoundExpression([`$event => ((`, exp, `) = $event)`]);

  // 创建属性数组，添加两个对象属性
  const props = [
    // 如 modelValue表达式: age表达式
    createObjectProperty(propName, dir.exp),
    // 如 "onUpdate:modelValue": $event => (age表达式 = $event)
    createObjectProperty(eventName, assignmentExp)
  ];
  return { props };
}

