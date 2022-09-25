/*******************************************************************************
 * File: /packages/vue/examples/runtime-dom/js/watch.js
 * Project: vue-read
 * Created Date: 2022-09-25
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: watch测试
*******************************************************************************/

import { reactive, ref, watch } from '../../../../runtime-dom/dist/runtime-dom.esmodule.js';

export default () => {
  // watch测试
  cleanupWatch();
}

// 函数式watch测试
function functionWatch() {
  const state = reactive({ name: '张三' });

  watch(() => state.name, (newValue, oldValue) => {
    app.innerHTML = `reactive对象name属性发生变化 旧值: ${oldValue}, 新值: ${newValue}`
  });

  // 1秒后改变name
  setTimeout(() => {
    state.name = '李四';
  }, 1000);
}

// ref响应式变量watch测试
function refWatch() {
  const name = ref('张三');

  watch(name, (newValue, oldValue) => {
    app.innerHTML = `name发生变化 旧值: ${oldValue}, 新值: ${newValue}`;
  });

  // 1秒后改变name
  setTimeout(() => {
    name.value = '李四';
  }, 1000);
}

// reactive响应式对象watch测试
function reactiveWatch() {
  const state = reactive({ name: '张三' });

  watch(state, (newValue, oldValue) => {
    // 监听对象，新值和老值是没有区别的，因为都是同一个引用
    app.innerHTML = `reactive对象name属性发生变化 旧值: ${oldValue}, 新值: ${newValue}`;
  });

  // 1秒后改变name
  setTimeout(() => {
    state.name = '李四';
  }, 1000);
}

// 数组watch测试
function arrayWatch() {
  const arr = [ref('张三')];

  watch(arr, (oldValue, newValue) => {
    app.innerHTML = `数组元素发生变化 旧值: ${oldValue}, 新值: ${newValue}`;
  });

  // 1秒后改变数组元素的值
  setTimeout(() => {
    arr[0].value = '李四'
  }, 1000);
}

// 清理回调测试
function cleanupWatch() {
  // 模拟异步服务器请求
  let time = 1000;
  const requestData = () => {
    return new Promise(resolve => {
      (time => {
        setTimeout(() => {
          resolve('服务器响应时长为：' + time);
        }, time);
      })(time);
      time -= 500;
    });
  }

  const name = ref('张三');
  watch(name, async (newValue, oldValue, onCleanup) => {
    // 状态标识，只有等于 true 时才渲染
    let flag = true;
    // 传递回调函数，下一次监视改变后会执行传入的回调函数
    onCleanup(() => flag = false);
    // 请求获取服务器数据
    const data = await requestData();
    if (flag) {
      // 因为第二次已经将flag改为false，所以第一次不会再到这里了
      app.innerHTML = `name发生变化 旧值: ${oldValue}, 新值: ${newValue} <br/>`;
      app.innerHTML += data;
    }
  });

  // 下面两次修改，第一次进入监听请求服务器响应的比较慢，需要1秒，第二次监听请求服务器比较快，500毫秒即可返回
  // watch中使用了 onCleanup 函数，防止第二次将页面渲染后，第一次回来再次改为旧值
  name.value = '李四';
  name.value = '王五';
}