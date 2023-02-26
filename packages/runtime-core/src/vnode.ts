/*
 * File: /src/vnode.ts
 * Project: @vue/runtime-core
 * Created Date: 2022-09-27
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 虚拟节点（VNode）
 * Description: 
 *    因为JS操作DOM是有代价的，会触发浏览器的重绘或回流，甚至可能会触发无意义的DOM操作或发生循环插入元素
 *    为了提高性能，选择使用虚拟节点来代替真实DOM操作，虚拟节点就是一个JS对象，对象中描述了DOM元素的样子
 *    JS操作对象速度非常快，并且还可以通过diff算法对虚拟节点进行对比，排除无意义的更新和DOM元素复用
 *    当用户触发了新旧相同的值，或者循环N次对DOM操作也不会浪费性能，因为操作的都是虚拟节点，真正对DOM进行patch时也是一次的
 */

import { isReactive, isReadonly } from '@vue/reactivity';
import { isArray, isFunction, isNumber, isObject, isString, normalizeClass, normalizeStyle, ShapeFlags } from '@vue/shared';
import { isTeleport } from './components/Teleport';

// 文本标识
export const Text = Symbol('Text');
// Fragment 片段标识（多个虚拟节点将会成为该标识节点的子节点，这也是Vue3根节点可以是多个的原因）
export const Fragment = Symbol('Fragment');

// 创建虚拟节点
export const createVNode = (type, props = null, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) => {
  // 存在属性的话，则将 class 和 style 正常化
  if (props) {
    if (isReactive(props) || isReadonly(props)) {
      // 是 reactive 或只读，克隆一份
      props = Object.assign({}, props);
      // 取出 class 和 style
      let { class: klass, style } = props
      if (klass && !isString(klass)) {
        // 正常化 class
        props.class = normalizeClass(klass)
      }
      if (isObject(style)) {
        // 是对象，如果是响应式对象不是数组则克隆一份
        if ((isReactive(style) || isReadonly(style)) && !isArray(style)) {
          style = Object.assign({}, style);
        }
        // 正常化样式
        props.style = normalizeStyle(style);
      }
    }
  }

  // 形状
  const shapeFlag =
    // 如果类型是文本，就认为是元素
    isString(type) ? ShapeFlags.ELEMENT :
      // 如果类型是 Teleport，就认为是传送门
      isTeleport(type) ? ShapeFlags.TELEPORT :
        // 如果类型是对象，就认为是状态组件
        isObject(type) ? ShapeFlags.STATEFUL_COMPONENT :
          // 如果类型是 函数，则属于函数组件
          isFunction(type) ? ShapeFlags.FUNCTIONAL_COMPONENT : 0;

  return createBaseVNode(type, props, children, patchFlag, dynamicProps, shapeFlag, isBlockNode);
}

// 创建基本虚拟节点
export const createBaseVNode = (type, props = null, children = null, patchFlag = 0, dynamicProps = null, shapeFlag = type === Fragment ? 0 : ShapeFlags.ELEMENT, isBlockNode = false) => {
  // 虚拟节点
  const vnode = {
    __v_isVnode: true,                  // 虚拟节点标识
    el: null,                           // 对应的真实DOM，这里暂时为 null
    type,                               // 类型：如：'div'，或组件对象
    props,                              // 属性
    children,                           // 子节点
    shapeFlag,                          // 形状标识
    patchFlag,                          // 靶向更新标识
    dynamicProps,                       // 动态属性
    dynamicChildren: null,              // 动态子节点
    key: props && normalizeKey(props),  // key（从属性中获取 key）
  };

  if (children) {
    let type = 0;
    if (isArray(children)) {
      // 子节点是数组，将标识类型改为 array_children
      type = ShapeFlags.ARRAY_CHILDREN;
    } else if (isObject(children)) {
      // 子节点是对象，证明是插槽
      type = ShapeFlags.SLOTS_CHILDREN;
    } else {
      // 是字符串文本
      // 也可能是数字，因为 document.createTextNode() 只能放字符串，不能放数字，所以需要转换一下
      children = String(children);
      // 将标识类型改为 text_children
      type = ShapeFlags.TEXT_CHILDREN;
    }
    // 将标识追加上当前的形态
    vnode.shapeFlag |= type;
  }

  // 若是 block 已打开，而当前节点是动态节点，且当前节点非block节点，则添加
  if (currentBlock && (patchFlag > 0 || shapeFlag & ShapeFlags.COMPONENT) && !isBlockNode) {
    currentBlock.push(vnode);
  }

  // 返回虚拟节点
  return vnode;
}

// 正常化虚拟节点
export const normalizeVNode = child => {
  if (isString(child) || isNumber(child)) {
    // 是字符串 或 数值，创建 Text 虚拟节点
    return createVNode(Text, null, String(child));
  } else if (isArray(child)) {
    // 是数值，拷贝一份并创建 Fragment
    return createVNode(Fragment, null, child.slice());
  }
  return child;
}

/**
 * 判断是否虚拟节点
 * @param value 值
 * @returns 是否虚拟节点
 */
export const isVNode = value => !!(value && value.__v_isVnode);

// 虚拟节点是否相同（类型相同且key相同就认为相同）
export const isSameVnode = (vnode1, vnode2) => vnode1.type === vnode2.type && vnode1.key === vnode2.key;

// 正常化 key
const normalizeKey = ({ key }) => key != null ? key : null;

// block栈，作用于block嵌套
export const blockStack = [];
// 当前 block
export let currentBlock = null;
// 重新导出新名称，代表靶向更新中创建元素节点
export { createVNode as createElementVNode };
// 创建文本节点
export const createTextVNode = (text = ' ', flag = 0) => createVNode(Text, null, text, flag);

// 打开 block
export const openBlock = (disableTracking = false) => blockStack.push((currentBlock = disableTracking ? null : []));
// 关闭 block
export const closeBlock = () => {
  // 弹出最后一个 block
  blockStack.pop();
  // 取出栈中最后一个 block
  currentBlock = blockStack[blockStack.length - 1] || null;
}
// 设置block
export const setupBlock = vnode => {
  // 将收集的 block 节点设置到父节点的动态子节点中
  vnode.dynamicChildren = currentBlock;
  // 关闭 block
  closeBlock();
  // 栈中不为空，将当前虚拟节点收集
  currentBlock && currentBlock.push(vnode);
  return vnode;
}
// 创建 block
export const createBlock = (type, props?, children?, patchFlag?, dynamicProps?) => setupBlock(createVNode(type, props, children, patchFlag, dynamicProps, true));
// 创建元素 Block
export const createElementBlock = (type, props, children, patchFlag, dynamicProps, shapeFlag) => setupBlock(createBaseVNode(type, props, children, patchFlag, dynamicProps, shapeFlag, true));

// 转换为字符串
export const toDisplayString = value => {
  // 如果是字符串则直接返回、如果为空则返回空文本、如果是对象则转换为JSON字符串、如果是其他则转换为字符串
  return isString(value) ? value : value == null ? '' : isObject(value) ? JSON.stringify(value) : String(value);
}