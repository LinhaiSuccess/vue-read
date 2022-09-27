/*
 * File: /src/nodeOps.ts
 * Project: @vue/runtime-dom
 * Created Date: 2022-09-27
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: DOM节点操作处理
 * Description: 针对浏览器的渲染操作
 */

export const nodeOps = {
  // 创建文本
  createText(text) {
    return document.createTextNode(text);
  },
  // 创建元素
  createElement(tagName) {
    return document.createElement(tagName);
  },
  // 插入
  insert(child, parent, anchor = null) {
    parent.insertBefore(child, anchor);
  },
  // 移除节点
  remove(child) {
    const parent = child.parentNode;
    parent && parent.removeChild(child);
  },
  // 设置文本
  setText(node, text) {
    node.nodeValue = text;
  },
  // 设置元素文本
  setElementText(el, text) {
    el.textContent = text;
  }
}

