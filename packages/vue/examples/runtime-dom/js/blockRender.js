/*******************************************************************************
 * File: /packages/vue/examples/runtime-dom/js/blockRender.js
 * Project: vue-read
 * Created Date: 2023-01-01
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 靶向更新测试
*******************************************************************************/

import {
  createElementBlock as _createElementBlock, createElementVNode as _createElementVNode, Fragment as _Fragment, h, openBlock as _openBlock, reactive, render, renderList as _renderList, toDisplayString as _toDisplayString
} from '../../../../runtime-dom/dist/runtime-dom.esmodule.js';

export default () => {
  forTest();
}

// 基本功能测试
function baseTest() {
  const VueComponent = {
    setup() {
      const state = reactive({
        name: '小明',
        hobby1: '编程',
        hobby2: '学习',
        href: 'www.xiaoming.com'
      });
      // 1秒后更新
      setTimeout(() => {
        state.name = 'xiaoming';
        state.href = 'www.xm.com';
      }, 1000);

      return { state }
    },
    render(_ctx) {
      /*
          <div>
              <h1>名字</h1>
              <span style="font-size: 36px; color:blue;">{{state.name}}</span>
              <h2>网址</h2>
              <a :href="state.href">点击访问</a>
          </div>

          <div>
              <h2>爱好</h2>
              <ul>
                  <li>{{state.hobby1}}</li>
                  <li>{{state.hobby2}}</li>
              </ul>
          </div>
      */

      const vnode = (_openBlock(), _createElementBlock(_Fragment, null, [
        _createElementVNode("div", null, [
          _createElementVNode("h1", null, "名字"),
          _createElementVNode("span", { style: { "font-size": "36px", "color": "blue" } }, _toDisplayString(_ctx.state.name), 1),
          _createElementVNode("h2", null, "网站"),
          _createElementVNode("a", {
            href: _ctx.state.href
          }, "点击访问", 8, ["href"])
        ]),
        _createElementVNode("div", null, [
          _createElementVNode("h2", null, "爱好："),
          _createElementVNode("ul", null, [
            _createElementVNode("li", null, _toDisplayString(_ctx.state.hobby1), 1),
            _createElementVNode("li", null, _toDisplayString(_ctx.state.hobby2), 1)
          ])
        ])
      ], 64));
      return vnode;
    }
  }

  render(h(VueComponent), app);
}

// if不稳定因素功能测试
function ifTest() {
  const VueComponent = {
    setup() {
      const state = reactive({
        name: '小明',
        flag: true
      });
      // 一秒后改变状态
      setTimeout(() => state.flag = false, 1000);

      return { state }
    },
    render(_ctx) {
      /*
          <div>
              <h1 v-if="state.flag">
                  <span><a href="javascript:void(0)">{{state.name}}</a></span>
              </h1>
              <h3 v-else>
                  <span><a href="javascript:void(0)">{{state.name}}</a></span>
              </h3>
          </div>
      */
      const vnode = (_openBlock(), _createElementBlock("div", null, [
        (_ctx.state.flag)
          ? (_openBlock(), _createElementBlock("h1", { key: 0 }, [
            _createElementVNode("span", null, [
              _createElementVNode("a", { href: "javascript:void(0)" }, _toDisplayString(_ctx.state.name), 1)
            ])
          ]))
          : (_openBlock(), _createElementBlock("h3", { key: 1 }, [
            _createElementVNode("span", null, [
              _createElementVNode("a", { href: "javascript:void(0)" }, _toDisplayString(_ctx.state.name), 1)
            ])
          ]))
      ]));

      return vnode;
    }
  };
  render(h(VueComponent), app);
}

// for不稳定因素功能测试
function forTest() {
  const VueComponent = {
    setup() {
      const state = reactive({ hobbys: ['唱歌', '睡觉', '跑步'] });
      // 一秒后添加游泳
      setTimeout(() => {
        state.hobbys.push('游泳')
      }, 1000);

      return { state }
    },
    render(_ctx) {
      /*
          <div>
              <h1 v-for="item in state.hobbys">{{item}}</h1>
          </div>
      */

      const vnode = (_openBlock(), _createElementBlock("div", null, [
        (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.state.hobbys, item => {
          return (_openBlock(), _createElementBlock("h1", null, _toDisplayString(item), 1))
        }), 256))
      ]));

      return vnode;
    }
  };
  render(h(VueComponent), app);
}
