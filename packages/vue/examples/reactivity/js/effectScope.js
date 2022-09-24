/*******************************************************************************
 * File: /packages/vue/examples/reactivity/js/effectScope.js
 * Project: vue-read
 * Created Date: 2022-09-24
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: effect范围域测试
*******************************************************************************/

import { effect, effectScope, reactive } from '../../../../reactivity/dist/reactivity.esmodule.js';

export default () => {
  // effectScope测试
  effectScopeTest();
}

function effectScopeTest() {
  const state = reactive({ name: '张三' });
  const scope = effectScope();

  // 运行
  scope.run(() => {
    effect(() => {
      app.innerHTML = `姓名：${state.name}`;
    });

    // 停止范围域中所有 effect
    scope.stop();

    // 一秒后更新响应式对象
    // 这时候因为已经停止了 effect 依赖收集，所以视图不会触发更新
    setTimeout(() => {
      state.name = '李四';
    }, 1000);

  });


}