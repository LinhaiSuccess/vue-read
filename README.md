<p align="center">
	<a href="https://cn.vuejs.org/">
	<img src="/assets/logo.svg" alt="Vue" width="150" />
	</a>
</p>
<p align="center">
	<a href="https://nodejs.org/dist/latest-v16.x/docs/api/"><img src="/assets/node-16.16.svg"/></a>
	<a href="https://docs.npmjs.com/"><img src="/assets/npm-8.11.svg"/></a>
	<a href="https://pnpm.io/motivation"><img src="/assets/pnpm-7.5.svg"/></a>
	<a href="https://www.typescriptlang.org/docs/"><img src="/assets/typescript-4.7.svg"/></a>
	<a href="https://github.com/LinhaiSuccess/vue-read/archive/refs/heads/main.zip"><img src="/assets/download.svg"/></a>
</p>
<h2 align="center">VueRead</h2>

# 目的

好多同学都说看不懂Vue3源码，甚至不知从何下手，如果感觉Vue3源码理解起来费劲，欢迎来阅读VueRead。

VueRead的代码实现是为了更好的阅读和理解Vue3。

## 介绍

这是一个为了阅读Vue3源码所开源项目，在原版Vue3中，因为处理了非常多的兼容和细节，导致代码变得难以阅读，无法一眼分清哪些是核心功能逻辑。

VueRead中没有Vue的兼容以及细节处理的逻辑，突出了功能核心实现，再配有详细的注释，相信大家可以很轻松的掌握每个核心功能点。

此项目中的函数名和变量名尽量与Vue源码保持一致，让小伙伴们读完此项目后，再去读Vue3源码可以如鱼得水，轻松自如。

部分功能实现上可能会和Vue源码有所差别，是因为Vue源码中为了做兼容将功能实现复杂化，不利于源码阅读和理解。

此项目实现原型是 Vue3.2.36，Vue3各版本功能实现上可能会有细微的差别，如：`effect` 在解决嵌套处理时，Vue3.2.30 之前是使用压栈出栈来获取上一个 `activeEffect`，而在Vue3.2.30 及之后则是通过树形结构来解决，节约了系统资源。

> 为了让代码阅读起来更清晰，这里会关闭TS的严格模式

## Vue模块介绍

`Vue3各功能模块包介绍`

<p align="center">
	<img alt="vue3" src="/assets/vue3.png"/>
</p>

Vue3的源码采用了 `Monorepo` 管理方式，可以将所有模块存储在一个在版本控制系统的代码库中，简化了组织和依赖。

> `size-check` 是用来测试代码体积的，不在Vue核心功能之内

## 为什么要读Vue源码

Vue的设计理念和架构封装非常有益于自我提升，尤其是Vue3的设计，因为采用了 CompositionAPI 的设计，使耦合性降低且复用组合性更强，对使用者来说业务也不再分散。

我们在日常工作中，开发新功能之前都是先进入设计阶段，在设计时可以先思考Vue3中是否有可以借鉴的地方。

如在复用性上，Vue3的响应式实现如 `reactive`、`computed`、`watch` 都是直接复用 `effect`。

在组件渲染上 `instance` 可以贯通组件整个生命周期的实现，在任何地方都可以从组件实例中拿到组件的任何东西，组件实现上大大降低了耦合性。个人认为无论是Vue3的架构设计和功能实现都是非常值得我们借鉴和学习的，所以我强烈推荐大家阅读Vue3源码。

我在代码中添加了大量的注释，将 响应式系统、组件渲染、diff算法、靶向更新、模板编译 等功能主要点都仔细描述出来，在阅读功能模块时可以先通过注释知道自己要实现的是什么？里面主要干了哪些事？为什么要这么做？再通过每行源码+注释阅读起来会非常轻松。

## 实现的功能项

**响应式**

- [x] reactive（未完成）
- [ ] shallowReactive
- [ ] readonly
- [ ] shallowReadonly
- [x] effect（未完成）
- [ ] ref
- [ ] shallowRef
- [ ] proxyRefs
- [ ] toRef
- [ ] computed
- [ ] effectScope

**组件渲染**

- [ ] watch
- [ ] 状态组件渲染
- [ ] setup统一入口
- [ ] 函数式组件渲染
- [ ] 组件生命周期
- [ ] 异步组件渲染
- [ ] 靶向更新
- [ ] v-model指令处理
- [ ] KeepAlive组件
- [ ] Teleport组件
- [ ] inject/provide
- [ ] 组件注册
- [ ] 组件挂载

**模板编译**

- [ ] 模板解析
- [ ] AST转化
- [ ] 指令转化
- [ ] 代码生成

**Vue统一入口**

- [ ] 运行时编译注册
- [ ] 编译到函数

## 使用

当功能都实现后，可使用如下模板测试

```vue
<layout>
  <template #top>
    输入：<input type="text" v-model="name"/>
    <br/>
    打印：{{name}}
  </template>
  
  <template #bottom>
    性别：<div v-if="sex===1">男</div> <div v-else>女</div>
    爱好：
    <ul>
      <li v-for="item in hobbys" :key="item.id">{{item.name}}</li>
    </ul>
    描述：<span v-text="description"></span> <br/>
    <button @click="submit('b1')">提交</button>
  </template>
</layout>

<user :info="userInfo" :callback="cb" v-model:error="errorPrompt">
  <template v-slot={message}>
    <p :style="{color: 'blue'}">{{message}}</p>
  </template>
</user>
```

> vue 包下有测试示例，在 examples 文件夹中

## 祝福

	祝福同学们读完后都有所收货，掌握Vue3的架构设计及核心思想能够很好的提升自己。
	
	如果感觉对自己有帮助，麻烦右上角给点个小星星 (づ￣3￣)づ ⭐️