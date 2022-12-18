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
  elementRender();
}

// 文本渲染
function textRender() {
  render(h(Text, 'hello world'), app);

  // 1秒后修改文本内容
  setTimeout(() => {
    render(h(Text, '你好世界'), app);
  }, 1000);
}

// 元素渲染
function elementRender() {
  render(
    h('div',
      { style: { background: 'red' }, onClick: e => console.log('单击事件执行', e) },
      [h('p', { key: 0 }, 'p1'), h('p', { key: 1 }, 'p2')])
    , app);

  // 3秒后
  // div的背景颜色改成蓝色，移除事件
  //  修改p1的值、p2元素替换为h1元素、新增h2元素
  setTimeout(() => {
    render(
      h('div',
        { style: { background: 'blue' } },
        [
          h('p', { key: 2 }, 'p1的值'),
          h('h1', { key: 3 }, 'h1的值'),
          h('h2', { key: 4, style: { color: 'red' } }, [h('span', 'h2的span值')])
        ]
      ), app);
  }, 3000);
}