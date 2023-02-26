/*
 * File: /src/index.ts
 * Project: vue
 * Created Date: 2023-02-11
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: Vue入口模块
 */

import { compile } from '@vue/compiler-dom';
import * as runtimeDom from '@vue/runtime-dom';
import { registerRuntimeCompiler } from '@vue/runtime-dom';
import { isString } from '@vue/shared';

// 将字符串模板编译为字符串代码并返回 render 函数
const compileToFunction = template => {
  if (!isString(template)) {
    return;
  }

  // 执行编译，拿到生成的字符串代码
  const { code } = compile(template);
  // 因为生成的代码执行时依赖 runtime-dom，所以需要将 runtime-dom 中所有API注入到函数中
  return new Function('Vue', code)(runtimeDom);
}

// 注册运行时编译
registerRuntimeCompiler(compileToFunction);

// 只将 runtime-dom 导出即可，因为 runtime-dom 中导出了 模板编译、响应式模块、共享模块
export * from '@vue/runtime-dom';
// 导出编译函数
export { compileToFunction as compile };
