/*******************************************************************************
 * File: /packages/vue/examples/runtime-dom/js/vmodelDirective.js
 * Project: vue-read
 * Created Date: 2023-01-01
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 
 * Description: 
*******************************************************************************/

import {
  createBlock as _createBlock, createElementBlock as _createElementBlock, createElementVNode as _createElementVNode, Fragment as _Fragment, h, openBlock as _openBlock, reactive, render, toDisplayString as _toDisplayString, vModelText as _vModelText,
  watch, withDirectives as _withDirectives
} from '../../../../runtime-dom/dist/runtime-dom.esmodule.js';

export default () => {
  // elementTest();
  componentTest()
}

// 元素 v-model 测试
function elementTest() {
  const VueComponent = {
    setup() {
      const state = reactive({ name: '张三' });

      // 监听变量变化
      watch(() => state.name, value => console.log(value));
      // 2秒修改一次变量的值
      setInterval(() => state.name = 'hello', 2000);
      return { state }
    },
    render(_ctx) {
      /*
          <input type="text" v-model="state.name"/>
          <div>{{state.name}}</div>
      */
      const vnode = (_openBlock(), _createElementBlock(_Fragment, null, [
        _withDirectives(_createElementVNode("input", {
          type: "text",
          "onUpdate:modelValue": $event => ((_ctx.state.name) = $event)
        }, null, 8, ["onUpdate:modelValue"]), [
          [_vModelText, _ctx.state.name]
        ]),
        _createElementVNode("div", null, _toDisplayString(_ctx.state.name), 1)
      ], 64));
      return vnode;
    }
  };
  render(h(VueComponent), app);
}

// 组件 v-model 测试
function componentTest() {
  // 子节点
  const ChildrenComponent = {
    props: {
      firstName: String,
      lastName: String,
    },
    emits: ['update:firstName', 'update:lastName'],
    setup($props, { emit }) {
      // 一秒修改一次 v-model 的值
      setInterval(() => {
        emit('update:firstName', '涨' + String(Math.random()));
        emit('update:lastName', '停' + String(Math.random()));
      }, 1000);
    },
    render(_ctx) {
      return h('h1', _ctx.$props.firstName + _ctx.$props.lastName);
    }
  }

  // 父节点
  const ParentComponent = {
    setup() {
      const state = reactive({ firstName: '张', lastName: '三' });
      // 监听 firstName，子组件修改后，这边打印子组件修改后的结果
      watch(() => state.firstName, value => console.log(value));

      return { state }
    },
    render(_ctx) {
      /*
          <ChildrenComponent v-model:firstName="state.firstName" v-model:lastName="state.lastName"></ChildrenComponent>
      */
      const vnode = (_openBlock(), _createBlock(ChildrenComponent, {
        firstName: _ctx.state.firstName,
        "onUpdate:firstName": $event => ((_ctx.state.firstName) = $event),
        lastName: _ctx.state.lastName,
        "onUpdate:lastName": $event => ((_ctx.state.lastName) = $event)
      }, null, 8, ["firstName", "onUpdate:firstName", "lastName", "onUpdate:lastName"]));
      return vnode;
    }
  }

  render(h(ParentComponent), app);
}