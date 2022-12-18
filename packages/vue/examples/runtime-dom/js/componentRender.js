/*******************************************************************************
 * File: /packages/vue/examples/runtime-dom/js/componentRender.js
 * Project: vue-read
 * Created Date: 2022-12-18
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 组件渲染
*******************************************************************************/

import { h, ref, render } from '../../../../runtime-dom/dist/runtime-dom.esmodule.js';

export default () => {
  // 渲染测试
  statefulComponentRender();
  // functionComponentRender();
}

// 状态组件渲染
function statefulComponentRender() {
  // ================================= 测试1 - data测试 =================================
  function test1() {
    const VueComponent = {
      data() {
        return {
          name: '海哥',
          money: 10000000000,
          unit: '亿',
          room: 600
        }
      },
      render() {
        // 一秒后，data 内的响应式变量变化
        // 注意：一般都不会在渲染层做数据改变，这里为了测试，就在这里触发变量更新
        //    变量更新后，出触发渲染，而这里还会再执行更新，所以下面的变量会每隔1秒就累加一次
        setTimeout(() => {
          this.money++;
          this.room++;
        }, 1000);

        return h('h1', `${this.name}的存款为：${this.money}${this.unit}，房产：${this.room}套`);
      }
    }

    render(h(VueComponent), app);
  }

  // ================================= 测试2 - 组件属性、插槽 =================================
  function test2() {
    const VueComponent = {
      // 在这里声明的属性会是响应式的
      props: {
        name: String,
        money: Number,
        room: Number
      },
      render() {
        // 注意：name 和 money 属于上面的 props，可以用 this
        // 而 car 属于 atrrs，需要使用 this.$attrs 来获取
        // this.$attrs 也不是响应式数据，他只是 dom 元素的属性
        return h('h1', [
          h('div', { style: { color: 'red' } }, `${this.name}的存款为：${this.money}`),
          h('div', { id: 'room' }, `房产：${this.room}套`),
          h('div', { onClick: () => console.log('兰博基尼各种豪车') }, `车辆：${this.$attrs.car}`),
          h('div', this.$slots.hope())
        ])
      }
    }

    render(h(
      VueComponent,
      { name: '海哥', money: 999999999999, room: 6666666666, car: 666666 },
      { hope: () => h('h1', '愿拥有动物保护法和反虐待法') }
    ), app);
  }

  // ================================= 测试3 - 父子组件 =================================
  function test3() {
    // 子组件
    const ChildrenComponent = {
      props: {
        name: String
      },
      render() {
        return h('div', `我是子组件，我叫：${this.name}`)
      }
    }

    // 父组件
    const ParentComponent = {
      render() {
        return h(ChildrenComponent, { name: '小明' })
      }
    }

    render(h(ParentComponent), app)
  }


  // ================================= 测试4 - setup、自定义事件 =================================
  function test4() {
    const VueComponent = {
      setup(props, { emit }) {
        const name = ref('张三');
        const age = ref(20);

        // 1秒后年龄+1
        setTimeout(() => {
          age.value += 1
        }, 1000);

        // 2秒后执行自定义事件，并把名字传递过去
        setTimeout(() => {
          emit('login', name.value)
        }, 2000);

        return {
          name,
          age
        }
      },
      render({ $emit }) {
        // console.log('$emit', $emit)
        return h('h1', `名字：${this.name}，年龄：${this.age}`)
      }
    }

    render(h(VueComponent, { onLogin: value => console.log('自定义事件执行啦，组件传递参数为：', value) }), app)
  }

  // 执行
  test4()
}

// 函数组件渲染
// 函数式组件没有响应式，参数也不是响应式的，他没有任何功能，只是返回虚拟节点而已
function functionComponentRender() {
  // 函数式组件用法特别简单，因为没有 setup 入口，所以不支持 CompositionAPI，只是用于接收参数和返回虚拟节点
  const functionalComponent = props => {
    return h('h1', { style: { color: 'blue' } }, props.name);
  }

  // 渲染异步组件
  render(h(functionalComponent, { name: '海哥' }), app);
}