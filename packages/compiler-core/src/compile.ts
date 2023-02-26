/*
 * File: /src/compile.ts
 * Project: @vue/compiler-core
 * Created Date: 2023-02-26
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 模板编译
 * Description: 主要提供模板编译功能，将字符串模板解析成抽象语法树并生成创建虚拟节点代码
 */

import { generate } from "./codegen";
import { baseParse } from "./parse";
import { transform } from "./transform";
import { transformElement } from "./transforms/transformElement";
import { transformSlotOutlet } from "./transforms/transformSlotOutlet";
import { transformText } from "./transforms/transformText";
import { transformBind } from "./transforms/vBind";
import { transformFor } from "./transforms/vFor";
import { transformIf } from "./transforms/vIf";
import { transformModel } from "./transforms/vModel";
import { transformOn } from "./transforms/vOn";

// 基本编译
export const baseCompile = (template, options) => {
  // 将模板转化为抽象语法树
  const ast = baseParse(template);
  // 获取节点转换和指令转换
  const [nodeTransforms, directiveTransforms] = getBaseTransformPreset();
  // 对语法树进行一些预先处理
  transform(ast, {
    // 将跨平台转换API与DOM转换API合并
    nodeTransforms: [...nodeTransforms as any, ...options.nodeTransforms],
    directiveTransforms: Object.assign(directiveTransforms, options.directiveTransforms)
  });
  // 生成最终代码
  return generate(ast);
}

// 基本转换解析
export const getBaseTransformPreset = () => {
  return [
    [
      transformIf,
      transformFor,
      transformSlotOutlet,
      transformElement,
      transformText
    ],
    {
      on: transformOn,
      bind: transformBind,
      model: transformModel
    }
  ];
}

