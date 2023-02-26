/*
 * File: /src/transforms/vBind.ts
 * Project: @vue/compiler-core
 * Created Date: 2023-02-26
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 转换 bind 指令
 */

import { createObjectProperty } from "../ast";

export const transformBind = (dir, _node) => {
  const { exp } = dir;
  return {
    props: [createObjectProperty(dir.arg, exp)]
  }
}