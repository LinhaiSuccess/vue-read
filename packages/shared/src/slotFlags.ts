/*
 * File: /src/slotFlags.ts
 * Project: @vue/shared
 * Created Date: 2023-02-26
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 插槽标识
 */

export const enum SlotFlags {
  STABLE = 1,     // 稳定插槽
  DYNAMIC = 2,    // 动态插槽（有 v-if 或 v-for 条件结构）
}