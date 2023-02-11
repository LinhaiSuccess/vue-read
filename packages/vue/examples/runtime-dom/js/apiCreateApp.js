/*******************************************************************************
 * File: /packages/vue/examples/runtime-dom/js/apiCreateApp.js
 * Project: vue-read
 * Created Date: 2023-02-11
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 组件挂载测试
*******************************************************************************/

import { createApp, h } from '../../../../runtime-dom/dist/runtime-dom.esmodule.js';

export default () => {
  // 测试
  test();
}

function test() {
  const ChildrenComponent = {
    render() {
      return h('span', { style: { color: 'red' } }, '子组件文本内容');
    }
  }
  const ParentComponent = {
    render() {
      return h('div', { style: { height: '100px', width: '800px', border: '2px solid black' } }, [h(ChildrenComponent)]);
    }
  }
  // 挂载到 app 中
  createApp(ParentComponent).mount(app);
}