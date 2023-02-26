/*
 * File: /src/index.ts
 * Project: @vue/compiler-dom
 * Created Date: 2023-02-11
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: Vue浏览器DOM编译
 */

import { baseCompile, baseParse } from "@vue/compiler-core";
import { transformStyle } from "./transforms/transformStyle";
import { transformVHtml } from "./transforms/vHtml";
import { transformModel } from "./transforms/vModel";
import { transformShow } from "./transforms/vShow";
import { transformVText } from "./transforms/vText";

// 模板编译
export const compile = template => {
  return baseCompile(template, {
    nodeTransforms: [transformStyle],
    directiveTransforms: {
      html: transformVHtml,
      text: transformVText,
      model: transformModel,
      show: transformShow
    }
  });
}

// 模板解析
export const parse = template => {
  return baseParse(template);
}

export * from '@vue/compiler-core';
