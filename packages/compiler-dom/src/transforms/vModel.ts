/*
 * File: /src/transforms/vModel.ts
 * Project: @vue/compiler-dom
 * Created Date: 2023-02-26
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 转换 v-model 指令
 */

import { ElementTypes, findProp, NodeTypes, transformModel as baseTransform } from "@vue/compiler-core";
import { V_MODEL_DYNAMIC, V_MODEL_TEXT } from "../runtimeHelpers";

export const transformModel = (dir, node, context) => {
  // 调用 compiler-core 中的 transformModel 函数，接收返回值再进一步处理
  const baseResult = baseTransform(dir);
  // 如果 v-model 的基本转换后没有属性，或者类型是对象，则不需要继续下去（组件的 v-model 需要组件内自己去处理，属于事件）
  if (!baseResult.props.length || node.tagType === ElementTypes.COMPONENT) {
    return baseResult;
  }

  const { tag } = node;
  if (tag === 'input') {
    // 如果为 input 元素，则使用 v-model 文本
    let directiveToUse = V_MODEL_TEXT;
    const type = findProp(node, 'type');
    if (type && type.type === NodeTypes.DIRECTIVE) {
      // 如果 input 组件的类型为指令，则指令使用动态 v-model ( :type="type" )
      directiveToUse = V_MODEL_DYNAMIC;
    }

    // 给 needRuntime 属性添加 方法
    (baseResult as any).needRuntime = context.helper(directiveToUse);
  }

  // 将属性过滤一下，只保留属性类型为简单表达式并且内容为 modelValue 的
  // 注意：不能在生成 v-model 属性的时候只给一个，否则会导致组件使用 v-model 时没有对应属性
  baseResult.props = baseResult.props.filter(p => !(p.key.type === NodeTypes.SIMPLE_EXPRESSION && p.key.content === 'modelValue'));

  return baseResult;
}