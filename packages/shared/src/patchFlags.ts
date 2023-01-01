/*
 * File: /src/patchFlags.ts
 * Project: @vue/shared
 * Created Date: 2023-01-01
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 更新标识
 * Description: 靶向更新标识
 */

export const enum PatchFlags {
  // 动态文本节点变化
  TEXT = 1,
  // 动态 class 变化
  CLASS = 1 << 1,
  // 动态 样式 变化
  STYLE = 1 << 2,
  // 动态 属性(除class/style) 变化
  PROPS = 1 << 3,
  // 有 key，需完整diff
  FULL_PROPS = 1 << 4,
  // 挂载过事件
  HYDRATE_EVENTS = 1 << 5,
  // 稳定序列，子节点顺序不会发生变化
  STABLE_FRAGMENT = 1 << 6,
  // 子节点有 key 的 Fragment
  KEYED_FRAGMENT = 1 << 7,
  // 子节点没有 key 的 Fragment
  UNKEYED_FRAGMENT = 1 << 8,
  // 进行 非props比较，ref比较
  NEED_PATCH = 1 << 9,
  // 动态插槽
  DYNAMIC_SLOTS = 1 << 10,
  // 模板根级别的注释（仅适用于开发人员的标志）
  DEV_ROOT_FRAGMENT = 1 << 11,
  // 表示静态节点，内容变化，不比较儿子
  HOISTED = -1,
  // 表示 diff 算法应该结束
  BAIL = -2
}
