<p align="center">
	<a href="https://cn.vuejs.org/">
	<img src="./assets/logo.svg" alt="Vue" width="150" />
	</a>
</p>
<p align="center">
	<a href="https://nodejs.org/dist/latest-v16.x/docs/api/"><img src="./assets/node-16.16.svg"/></a>
	<a href="https://docs.npmjs.com/"><img src="./assets/npm-8.11.svg"/></a>
	<a href="https://pnpm.io/motivation"><img src="./assets/pnpm-7.5.svg"/></a>
	<a href="https://www.typescriptlang.org/docs/"><img src="./assets/typescript-4.7.svg"/></a>
	<a href="https://github.com/LinhaiSuccess/vue-read/archive/refs/heads/main.zip"><img src="./assets/download.svg"/></a>
</p>
<h2 align="center">VueRead</h2>

# 目的

好多同学都说看不懂Vue3源码，甚至不知从何下手，如果感觉Vue3源码理解起来费劲，欢迎来阅读VueRead。

VueRead的代码实现是为了更好的阅读和理解Vue3。

## 介绍

这是一个为了阅读Vue3源码所开源项目，在原版Vue3中，因为处理了非常多的兼容和细节，导致代码变得难以阅读，无法一眼分清哪些是核心功能逻辑。

此项目在架构上尽量与官方Vue原版保持一致，让同学们读完此项目后，再去读Vue3源码可以更好的理解。

功能实现上可能会和Vue原版有所差别，但大方向思路相同，是因为Vue源码中为了做兼容和一些边缘的细节处理将功能实现复杂化，不利于源码阅读和理解。

此项目实现原型是 Vue3.2.36，Vue3各版本功能实现上可能会有细微的差别，如：`effect` 在解决嵌套处理时，Vue3.2.30 之前是使用压栈出栈来获取上一个 `activeEffect`，而在Vue3.2.30 及之后则是通过树形结构来解决，节约了系统资源。

> 为了让代码阅读起来更清晰，这里会关闭TS的严格模式

## Vue模块介绍

`Vue3各功能模块包介绍`

<p align="center">
	<img alt="vue3" src="./assets/vue3.png"/>
</p>

Vue3的源码采用了 `Monorepo` 管理方式，可以将所有模块存储在一个在版本控制系统的代码库中，简化了组织和依赖。

> `size-check` 是用来测试代码体积的，不在Vue核心功能之内

## 为什么要读Vue源码

Vue的设计理念和架构封装非常有益于自我提升，尤其是Vue3的设计，因为采用了 CompositionAPI 的设计，使耦合性降低且复用组合性更强，对使用者来说业务也不再分散。

我们在日常工作中，开发新功能之前都是先进入设计阶段，在设计时可以先思考Vue3中是否有可以借鉴的地方。

如在复用性上，Vue3的响应式实现如 `reactive`、`computed`、`watch` 都是直接基于 `effect`。

我在代码中添加了大量的注释，将 响应式系统、组件渲染、diff算法、靶向更新、模板编译 等功能主要点都仔细描述出来，通过源码+注释阅读起来会非常轻松。

## 实现的功能项

**响应式**

- [x] reactive
- [x] shallowReactive
- [x] readonly
- [x] shallowReadonly
- [x] effect
- [x] ref
- [x] shallowRef
- [x] proxyRefs
- [x] toRefs
- [x] computed
- [x] effectScope

**组件渲染**

- [x] watch
- [x] 元素渲染
- [x] 状态组件渲染
- [x] setup统一入口
- [x] 函数式组件渲染
- [x] 组件生命周期
- [x] 异步组件渲染
- [x] 靶向更新
- [x] v-model指令处理
- [x] KeepAlive组件
- [x] Teleport组件
- [x] inject/provide
- [x] 组件注册
- [x] 组件挂载

**模板编译**

- [x] 模板解析
- [x] AST转化
- [x] 指令转化
- [x] 代码生成

**Vue统一入口**

- [x] 运行时编译注册
- [x] 编译到函数

> vue/examples 包下有每个功能模块的测试示例
>
> vue/examples/vue 中为最终测试示例

## 使用


`最终测试示例模板`

```html
  <Layout>
    <template #top>
      <div style="padding: 30px 0; font-size: 60px;">VueRead</div>
    </template>

    <template #center>
      <ul>
        <li v-for="task in tasks" :key="task.id">{{task.value}}</li>
      </ul>
      <p v-if="arrive">complete</p>
      <p v-else>incomplete</p>
    </template>

    <template #bottom>
      <button @click="increment(1)">累加</button>
      <div v-text="count" :style="{ fontSize: '30px', color: 'blue' }"></div>
    </template>
  </Layout>

  <Diversity :config="config" v-model:activate="activity">
    <template v-slot={status}>
      <p>{{status}}</p>
    </template>
  </Diversity>

  <span>{{activity}}</span>
```

## 祝福

	祝福同学们读完后都有所收货，掌握Vue3的架构设计及核心思想能够很好的提升自己。
	
	如果感觉对自己有帮助，麻烦右上角给点个小星星 (づ￣3￣)づ ⭐️