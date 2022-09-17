/*
 * File: /src/effect.ts
 * Project: @vue/reactivity
 * Created Date: 2022-09-17
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 副作用 effect
 * Description: 
 *    effect 才是真正触发响应式的关键，无论是依赖收集还是触发更新都是由 effect 来完成
 *    effect 所包装的 fn 函数就是触发更新时所执行的函数，当响应式变量变化后会重新执行diff算法对比组件变化到达模板更新的效果
 */

import { isArray, isIntegerKey } from "@vue/shared";

// 导出当前活动的effect全局变量的引用
// 为什么敢这么做？是因为JS是单线程的，不需要考虑多个线程并发导致不准的情况
export let activeEffect;

export class ReactiveEffect {
  public active = true;   // 激活状态，默认激活
  public parent = null;   // 因为 effect 可以嵌套执行，所以这里记载一下自己的父亲是谁
  public deps = [];       // 记录它依赖了哪些属性
  constructor(public fn) { }

  run() {
    if (!this.active) {
      // 如果状态不是激活，直接执行 fn，并返回
      return this.fn();
    }

    try {
      // 将上一个 effect 保存起来（就是上一次的本类实例）
      this.parent = activeEffect;
      // 当前活动的effect换成自己
      activeEffect = this;
      // 在重新收集之前，解除本对象存储的所有 effect 关联，保证每次收集的都是最新的，旧的可能会成为脏数据，旧数据改变不应该触发视图更新
      cleanupEffect(this);
      // 执行 fn 并返回
      return this.fn();
    } finally {
      // 当前effect执行完后，将全局当前活动的effect还原回外层effect
      activeEffect = this.parent;
      // 将当前对象父级设置为 undefined
      this.parent = void 0;
    }
  }
}

/**
 * effect 副作用函数
 *    effect 接收一个fn函数，当 fn 函数内使用到的响应式变量都会被依赖收集
 * @param fn 需要触发的函数
 * @returns 返回 run 方法，用户可以手动触发 run 渲染
 */
export function effect(fn) {
  // 实例化 ReactiveEffect
  const _effect = new ReactiveEffect(fn);
  // 默认先执行一次（本次执行后，fn函数内使用的响应式对象都会触发依赖收集）
  _effect.run();

  // 将 run 函数返回（在返回前，先把 this 指向改为源指向，否则外部执行时，run内部的 this 就变了）
  const runner = _effect.run.bind(_effect);
  // 给 runner 函数一个 effect 属性，属性是刚创建的 ReactiveEffect 实例
  runner.effect = _effect;
  return runner;
}

/**
 * 清空依赖收集的 effect
 * @param effect ReactiveEffect 对象
 */
function cleanupEffect(effect) {
  const { deps } = effect;
  // 遍历关联的 effect，解除所有依赖，等待重新收集
  // 注意：必须先遍历该数组，将里面的每个 Set 的内容都删除才能清空该数组
  deps.forEach(dep => dep.delete(effect));
  deps.length = 0;
}

// 存放收集的关联关系（某个对象哪个属性对应的effect集）
// 一个对象的 key 可能对应了多个 activeEffect（既一个响应式对象属性在多个 effect 中出现）
const targetMap = new WeakMap();

/**
 * 依赖收集
 * 
 * @param target 目标对象
 * @param key 目标对象的某个属性的key
 */
export function track(target, key) {
  // 必须在模板中出现才做收集
  if (activeEffect) {
    // 根据当前对象拿到自己所有属性对应的effect
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      // 对象不在映射表中，实例化空 Map 并赋值
      targetMap.set(target, (depsMap = new Map()));
    }
    // 根据 key 获取对应的 activeEffect Set集合
    let dep = depsMap.get(key);
    if (!dep) {
      // 第一次，没有对应的key，实例化空Set并赋值
      depsMap.set(key, (dep = new Set()));
    }
    // 收集 effects
    trackEffects(dep);
  }
}

/**
 * 收集 effects
 * @param dep effect集合
 */
export function trackEffects(dep) {
  // 当前激活effect为空，没法继续操作，返回
  if (!activeEffect) {
    return;
  }

  // 判断集合中是否已经存在了当前的 activeEffect，不存在再添加（可能同一个响应式对象属性出现了多次，我们只收集一次即可）
  if (!dep.has(activeEffect)) {
    // 不存在，收集
    dep.add(activeEffect);

    // 属性记录了自己依赖了哪些 effect，而 effect 也要记录它依赖的属性，完成双向关联
    // 为什么要双向关联？是为了方便清理关联
    // 比如模板中出现了三元表达式，根据状态决定使用哪个响应式对象，当状态变化后，条件不满足的属性更新不应该再触发视图更新
    activeEffect.deps.push(dep);
  }
}

/**
 * 触发更新
 * @param target 目标对象
 * @param type 类型
 * @param key 目标对象的属性key
 */
export function trigger(target, type, key) {
  // 根据源对象获取对应的 Map
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    // 触发的对象没有在模板中使用，不触发更新
    return;
  }
  // 会触发更新的 effect 容器
  const deps = [];
  if (key === 'length' && isArray(target)) {
    // 如果目标对象是数组，而且获取的还是 length，则收集length对应的effect
    depsMap.forEach((dep, key) => {
      if (key === 'length') {
        deps.push(dep);
      }
    });
  } else {
    if (key !== void 0) {
      // key不是 undefined，根据属性key拿到Set集合
      deps.push(depsMap.get(key));
    }
    if (type === 'add' && isArray(target) && isIntegerKey(key)) {
      // 是数组，而且key还是元素下标，将 length 对应的effect添加到容器中
      deps.push(depsMap.get('length'));
    }
  }

  if (deps.length === 1 && deps[0] !== void 0) {
    // 只有一个元素，而且还不是空，直接触发
    triggerEffects(deps[0]);
  } else {
    const effects = [];
    // 因为可能有 undefined，所以一个个来
    for (const dep of deps) {
      if (dep) {
        effects.push(...dep);
      }
    }
    if (effects.length) {
      // 触发 triggerEffects
      triggerEffects(new Set(effects));
    }
  }
}

/**
 * 触发 dep
 * @param dep effect集合
 */
export function triggerEffects(dep) {
  // 注意：这里必须先拷贝一份，否则会死循环
  //    因为执行下面的 run 时，run方法 会先删除里面所有内容，接下来会执行 fn函数，fn函数 会再次收集进来，这边的 run 再删，里面再收集...
  const effects = isArray(dep) ? dep : [...dep];
  // 遍历拷贝后的数组
  effects.forEach(effect => {
    // 就是防止在 effect 里修改值，来这里触发更新，这里再执行 effect ，里面执行时又修改值，会死循环，所以先过滤掉当前激活的 effect
    if (effect !== activeEffect) {
      // 执行 run（内部会执行 fn）
      effect.run();
    }
  });
}