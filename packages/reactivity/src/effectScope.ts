/*
 * File: /src/effectScope.ts
 * Project: @vue/reactivity
 * Created Date: 2022-09-24
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: effect范围域
 * Description: 可以统一管理域中所有effect
 */

// 激活的 EffectScope 对象（和effect一个套路）
export let activeEffectScope = null;

class EffectScope {
  // 激活状态
  public active = true;
  // 收集的 effect 对象列表
  public effects = [];
  // 父对象
  private parent = null;
  // 收集的子级 effectScope 对象列表
  public scopes = [];

  constructor(private detached) {
    // 是否有正在激活的 activeEffectScope，而且当前对象还不是独立的
    if (!detached && activeEffectScope) {
      // 记住自己的父亲
      this.parent = activeEffectScope;
      // 将当前对象添加到父级中，父级可以停掉当前对象
      activeEffectScope.scopes.push(this);
    }
  }

  run(fn) {
    if (this.active) {
      try {
        // 回调函数执行之前将自己暴露在全局上
        activeEffectScope = this;
        // 调用执行回调函数，并返回回调函数的返回值
        return fn();
      } finally {
        // 当前方法已执行完，将全局切换到上一个对象
        activeEffectScope = this.parent;
      }
    }
  }

  stop() {
    if (this.active) {
      // 遍历停止记录的所有 effect
      this.effects.forEach(effect => effect.stop());
      // 遍历停止记录的所有 scope
      this.scopes.forEach(scope => scope.stop());
      // 取消激活状态
      this.active = false;
    }
  }
}


/**
 * 暴露给用户的函数
 * @param detached 是否独立的（effectScope嵌套时是否受到外层控制）
 * @returns EffectScope 对象实例
 */
export function effectScope(detached = false) {
  return new EffectScope(detached);
}

/**
 * 记录effect范围
 * @param effect effect对象
 */
export function recordEffectScope(effect) {
  if (activeEffectScope && activeEffectScope.active) {
    // 有全局激活的 effectScope，将当前 effect 加入进来
    activeEffectScope.effects.push(effect);
  }
}