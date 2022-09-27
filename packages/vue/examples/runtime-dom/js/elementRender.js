/*******************************************************************************
 * File: /packages/vue/examples/runtime-dom/js/elementRender.js
 * Project: vue-read
 * Created Date: 2022-09-27
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 元素渲染测试
*******************************************************************************/

import { h, render, Text } from '../../../../runtime-dom/dist/runtime-dom.esmodule.js';

export default () => {
  // 渲染测试
  textRender();
}

// 文本渲染
function textRender() {
  render(h(Text, 'hello world'), app);

  // 1秒后修改文本内容
  setTimeout(() => {
    render(h(Text, '你好世界'), app);
  }, 1000);
}