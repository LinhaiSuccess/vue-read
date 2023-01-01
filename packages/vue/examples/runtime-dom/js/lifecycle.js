/*******************************************************************************
 * File: /packages/vue/examples/runtime-dom/js/lifecycle.js
 * Project: vue-read
 * Created Date: 2023-01-01
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 声明周期测试
 * Description: 生命周期只能在 setup 中使用，BeforeCreated 不需要了，因为 setup 就是
*******************************************************************************/

import {
  getCurrentInstance, h,
  onBeforeMount, onBeforeUnmount, onBeforeUpdate, onMounted, onUnmounted, onUpdated, ref, render
} from '../../../../runtime-dom/dist/runtime-dom.esmodule.js';

export default () => {
  test();
}

function test() {
  // 计时hook
  const useCounter = () => {
    const count = ref(1);
    const handle = () => count.value++;

    // 挂载前
    onBeforeMount(() => console.log('onBeforeMount', getCurrentInstance()));
    // 挂载
    onMounted(() => console.log('onMounted'));

    // 修改前
    onBeforeUpdate(() => console.log('onBeforeUpdate'));
    // 修改
    onUpdated(() => console.log('onUpdated'));

    // 销毁前
    onBeforeUnmount(() => console.log('onBeforeUnmount'));
    // 销毁
    onUnmounted(() => console.log('onUnmounted'));

    return { count, handle };
  }

  const VueComponent = {
    setup() {
      // 获取到计数器
      const { count, handle } = useCounter();

      return {
        count,
        handle
      }
    },
    render() {
      return h('h1', { onClick: this.handle }, `计数器：${this.count}`);
    }
  };

  render(h(VueComponent), app);

  // 6秒后卸载该组件
  setTimeout(() => render(h('div', '组件已卸载'), app), 6000);
}