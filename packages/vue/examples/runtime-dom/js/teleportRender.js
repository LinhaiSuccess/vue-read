/*******************************************************************************
 * File: /packages/vue/examples/runtime-dom/js/teleportRender.js
 * Project: vue-read
 * Created Date: 2023-01-08
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: Teleport 传送门渲染测试
*******************************************************************************/
import { Fragment, h, ref, render, Teleport } from '../../../../runtime-dom/dist/runtime-dom.esmodule.js';

export default () => {
  // 测试
  test();
}

function test() {
  const VueComponent = {
    setup() {
      const pos = ref(true);
      // 2秒后变化位置
      setInterval(() => pos.value = !pos.value, 2000);

      return { pos };
    },
    render() {
      // 如果 pos 为真，则渲染到 app，否则渲染到 root
      return h(Teleport, { to: this.pos ? '#app' : '#root' },
        h('ul', [
          h('li', 'li1'),
          h('li', 'li2'),
          h('li', 'li3')
        ])
      );
    }
  }

  render(h(Fragment, [getRootNode(), h(VueComponent)]), app);
}

// 获取 root 节点
function getRootNode() {
  return h('div', { id: 'root', style: { width: '600px', height: '300px', background: 'lightgray' } });
}