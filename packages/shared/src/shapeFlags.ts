/*
 * File: /src/shapeFlags.ts
 * Project: @vue/shared
 * Created Date: 2022-09-27
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 虚拟节点形态标识
 * Description: 
 *    用于标识虚拟节点是什么形态，如：是元素、是状态组件、是函数式组件、或是文本
 *    这里使用位运算来描述，我们可以通过位或运算来组合形状，判断时再通过位与运算可以很方便的判断出是否包含想要的形状
 */

export const enum ShapeFlags {
  ELEMENT = 1,                            // 元素 = 1
  FUNCTIONAL_COMPONENT = 1 << 1,          // 函数式组件 = 2
  STATEFUL_COMPONENT = 1 << 2,            // 状态组件 = 4
  TEXT_CHILDREN = 1 << 3,                 // 文本子节点 = 8
  ARRAY_CHILDREN = 1 << 4,                // 数组子节点 = 16
  SLOTS_CHILDREN = 1 << 5,                // 插槽子节点 = 32
  TELEPORT = 1 << 6,                      // 传送门 = 64
  SUSPENSE = 1 << 7,                      // 等待异步组件 = 128
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,   // 是KeepAlive组件 = 256
  COMPONENT_KEPT_ALIVE = 1 << 9,          // KeepAlive组件 = 512
  // 组件（状态组件和函数组件的组合）
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT
}

