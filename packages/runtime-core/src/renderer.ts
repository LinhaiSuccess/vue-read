/*
 * File: /src/renderer.ts
 * Project: @vue/runtime-core
 * Created Date: 2022-09-27
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 渲染器
 * Description: 组件渲染的核心文件
 */

import { ShapeFlags } from '@vue/shared';
import { getSequence } from './utils/sequence';
import { isSameVnode, normalizeVNode, Text } from './vnode';

/**
 * 创建渲染器
 *  与平台无关，渲染过程由 renderOptions 来决定，可能是DOM操作实现、也可能是 canvas 或小程序的实现
 * @param renderOptions 渲染选项
 */
export function createRenderer(renderOptions) {
  // 将渲染操作中的API取出，并重新命名
  const {
    insert: hostInsert,
    remove: hostRemove,
    setText: hostSetText,
    createText: hostCreateText,
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    patchProp: hostPatchProp,
  } = renderOptions;

  // 渲染函数
  const render = (vnode, container) => {
    if (vnode == null) {
      // 节点为空，自动卸载组件
      if (container._vnode) {
        // 确实有旧节点，卸载删除掉
        unmount(container._vnode);
      }
    } else {
      // 执行 patch（初始化或更新）
      patch(container._vnode || null, vnode, container);
    }
    // 将当前 vnode 保存到元素对象中
    container._vnode = vnode;
  }

  // 打补丁（核心函数，包含初始化、更新、diff全量对比）
  const patch = (oldVnode, newVnode, container, anchor = null) => {
    if (oldVnode === newVnode) {
      // 两个节点一样，没必要对比，直接返回
      return;
    }
    const { type, shapeFlag } = newVnode;
    // 根据不同形状执行不同逻辑
    switch (type) {
      case Text:
        // 执行文本处理
        processText(oldVnode, newVnode, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 执行元素处理
          processElement(oldVnode, newVnode, container, anchor);
        }
    }
  }

  // 卸载
  const unmount = vnode => {
    // 移除DOM元素
    hostRemove(vnode.el);
  }

  // 文本处理
  const processText = (oldVnode, newVnode, container) => {
    if (oldVnode == null) {
      // 初次渲染，插入纯文本字符串内容
      hostInsert(newVnode.el = hostCreateText(newVnode.children), container);
    } else {
      // 复用DOM元素（没必要移除再创建，提高了浏览器性能）
      const el = (newVnode.el = oldVnode.el);
      if (oldVnode.children !== newVnode.children) {
        // 内容确实变化了，更新字符串
        hostSetText(el, newVnode.children)
      }
    }
  }

  // 元素处理
  const processElement = (oldVnode, newVnode, container, anchor) => {
    // 旧节点为空则初次挂载元素，否则就对比更新元素
    oldVnode == null ? mountElement(newVnode, container, anchor) : patchElement(oldVnode, newVnode);
  }

  // 挂载元素
  const mountElement = (vnode, container, anchor) => {
    const { type, props, children, shapeFlag } = vnode;
    // 创建元素，并挂载到 vnode 中
    const el = vnode.el = hostCreateElement(type);
    // 添加子元素
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 设置文本内容
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 递归挂载子节点
      mountChildren(children, el);
    }
    // 添加属性
    if (props) {
      for (const key in props) {
        // 添加属性
        hostPatchProp(el, key, null, props[key]);
      }
    }
    // 插入到容器元素中
    hostInsert(el, container, anchor);
  }

  // 挂载子元素
  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      // 当前节点可能是字符串，将节点转换为 Text 标识的虚拟节点
      const child = children[i] = normalizeVNode(children[i])
      // 递归继续 patch
      patch(null, child, container, null);
    }
  }

  // 对比更新元素
  const patchElement = (oldVnode, newVnode) => {
    // 元素复用
    const el = newVnode.el = oldVnode.el;
    // 取出属性
    const oldProps = oldVnode.props || {};
    const newProps = newVnode.props || {};
    // 属性对比
    patchProps(oldProps, newProps, el);
    // diff比较子元素
    patchChildren(oldVnode, newVnode, el);
  }

  // 属性更新
  const patchProps = (oldProps, newProps, el) => {
    if (oldProps !== newProps) {
      // 将新属性覆盖掉旧属性
      for (const key in newProps) {
        hostPatchProp(el, key, oldProps[key], newProps[key]);
      }

      // 循环旧属性，因为可能出现新属性不存在，而旧属性存在，这时需要移除该属性
      for (const key in oldProps) {
        if (newProps[key] == null) {
          hostPatchProp(el, key, oldProps[key], void 0);
        }
      }
    }
  }

  // 卸载子节点
  const unmountChildren = (children) => {
    children && children.forEach(unmount);
  }

  // diff比较子元素
  const patchChildren = (oldVnode, newVnode, el) => {
    // 取出子节点
    const oldChild = oldVnode.children;
    const newChild = newVnode.children;
    // 取出形状
    const oldFlag = oldVnode.shapeFlag;
    const newFlag = newVnode.shapeFlag;

    if (newFlag & ShapeFlags.TEXT_CHILDREN) {
      if (oldFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 新孩子=文本 旧孩子=数组：卸载旧孩子
        unmountChildren(oldChild);
      }
      if (oldChild !== newChild) {
        // 新孩子=文本 旧孩子=文本：更新文本
        // 新孩子=文本 旧孩子=空：更新文本
        // 设置新文本 或 更新文本
        hostSetElementText(el, newChild);
      }
    } else {
      if (oldFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (newFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 新孩子=数组 旧孩子=数组：diff全量对比
          // 注意：这里的新孩子数组内，可能不是虚拟节点，需要将数组内节点转换为 vnode
          for (const i in newChild) {
            newChild[i] = normalizeVNode(newChild[i]);
          }
          // diff全量对比
          patchKeyedChildren(oldChild, newChild, el);
        } else {
          // 新孩子不是数组，到了这里，就只有为空的可能
          // 将旧孩子卸载掉
          unmountChildren(oldChild);
        }
      } else {
        if (oldFlag & ShapeFlags.TEXT_CHILDREN) {
          // 新孩子=数组 旧孩子=文本
          // 清空文本
          hostSetElementText(el, '');
        }
        if (newFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 进行挂载
          mountChildren(newChild, el);
        }
      }
    }
  }

  // diff全量对比
  const patchKeyedChildren = (oldChild, newChild, el) => {
    // 从左边开始对比，新节点数组和旧节点数组有任何一方到头则停止循环
    let i = 0;
    // 两个节点的索引长度
    let e1 = oldChild.length - 1;
    let e2 = newChild.length - 1;

    // 从头往尾比较
    // 循环条件：有一方结束则停止循环
    while (i <= e1 && i <= e2) {
      const n1 = oldChild[i];
      const n2 = newChild[i];
      if (isSameVnode(n1, n2)) {
        // 节点相同（标签名和key都相同），递归比较两者的属性和子节点
        patch(n1, n2, el);
      } else {
        // 节点不相同，停止比较
        break;
      }
      i++;
    }

    // 从尾往头比较
    while (i <= e1 && i <= e2) {
      const n1 = oldChild[e1];
      const n2 = newChild[e2];
      if (isSameVnode(n1, n2)) {
        // 节点相同（标签名和key都相同），递归比较两者的属性和子节点
        patch(n1, n2, el);
      } else {
        // 节点不相同，停止比较
        break;
      }
      e1--;
      e2--;
    }

    // 同序列挂载 & 同序列卸载
    // 经过上面的两步，已经有了明确的指向，根据指向即可判断是否有要新增或卸载的节点
    if (i > e1) {
      // i > e1 证明新节点比旧节点多，这里执行新增节点
      if (i <= e2) {
        while (i <= e2) {
          // e2下一个位置
          const nextPos = e2 + 1;
          // 参照物，看是往前插入还是往后插入
          const anchor = nextPos < newChild.length ? newChild[nextPos].el : null;
          // 新增元素
          patch(null, newChild[i], el, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      // i > e2 证明旧节点比新节点多，这里执行删除节点
      if (i <= e1) {
        while (i <= e1) {
          // 卸载节点
          unmount(oldChild[i]);
          i++;
        }
      }
    }

    // 乱序比对
    // 虽然新旧节点在同一个索引不一致，但还是可以复用的，思路就是放入 Map 中，直接映射寻找
    let s1 = i;
    let s2 = i;

    // 映射表，存放新节点，方便去里面找，做节点复用，结构为：{ key: index }
    const keyToNewIndexMap = new Map();
    for (let i = s2; i <= e2; i++) {
      keyToNewIndexMap.set(newChild[i].key, i);
    }

    // 新节点的总个数
    // 根据新节点中间乱序部分的结尾和开始的差值+1得出新节点的总个数
    const toBePatched = e2 - s2 + 1;
    // 创建一个数组，存放 新的位置对应老的位置，长度为新节点的总个数，默认全填充0
    const newIndexToOldIndex = new Array(toBePatched).fill(0);

    // 循环旧节点去映射表中找，看旧节点中有没有，如果有则比较差异，如果没有就添加到列表中
    // 旧节点有，新节点没有则要删除
    for (let i = s1; i <= e1; i++) {
      // 乱序中旧节点的孩子
      const oldVNode = oldChild[i];
      // 根据key从映射表中获取相同key的节点
      const newIndex = keyToNewIndexMap.get(oldVNode.key);
      if (newIndex == null) {
        // 新节点映射表中没有找到相同key的节点，证明新节点没有这个，那么就把当前旧节点卸载掉
        unmount(oldVNode);
      } else {
        // 对比前，将当前节点记录一下，证明已经比对过了
        // 通过 newIndex - s2 算出在乱序中的索引
        // 数组的值 = i，而 i 有可能是0，所以永远都 +1
        // 执行后 newIndexToOldIndex 中的结果就是：
        //      对比过的节点：对应的值为 当前节点在旧节点所在的位置+1
        //      未对比过的节点：对应的值为 0
        newIndexToOldIndex[newIndex - s2] = i + 1;
        // 从新节点中找到了相同key的节点，那就 递归对比差异
        patch(oldVNode, newChild[newIndex], el);
      }
    }

    // 移动位置
    // 经过上面的乱序对比后，虽然乱序节点得到了复用，但是位置依旧是老的，因为是通过映射表实现的，所以需要移动正确的位置
    // 获取 最长递增子序列（存放的是 newIndexToOldIndex 中不需要插入或移动的索引）
    // vue3优化：使用 最长递增子序列 计算出哪些不需要插入或调整位置，否则浪费性能
    // 比如当前 newIndexToOldIndex 为 [5, 3, 4, 0]，那么 increment 经过 最长递增子序列 计算过的值会是 [1, 2]
    // 代表着 newIndexToOldIndex 的索引 1号 和 0号 不用动，跳过即可
    const increment = getSequence(newIndexToOldIndex);
    // 定义 最长递增子序列 i 索引，因为这里是倒序，所以这里也需要倒着取值
    let incrementI = increment.length - 1;

    // 倒序循环
    // toBePatched 当索引来用，所以 -1
    for (let i = toBePatched - 1; i >= 0; i--) {
      // 获取乱序中最后一个节点索引
      const index = i + s2;
      // 把节点取出来
      const current = newChild[index];
      // 取出参照物（就是当前取出的节点右侧的节点元素当做参照物）
      const anchor = index + 1 < newChild.length ? newChild[index + 1].el : null;

      // 从 newIndexToOldIndex 中找一下，看是否已经对比过，没有对比过则创建
      if (newIndexToOldIndex[i] === 0) {
        // 创建
        patch(null, current, el, anchor);
      } else {
        // 当前 i 索引如果不等于最长递增子序列中记载的索引则插入或移动，否则就略过
        if (i !== increment[incrementI]) {
          // 已对比过，插入（根据参照物移动位置）
          hostInsert(current.el, el, anchor);
        } else {
          // 最长递增子序列索引自减
          incrementI--;
        }
      }
    }
  }

  return {
    render
  }
}