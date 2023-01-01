/*
 * File: /src/renderer.ts
 * Project: @vue/runtime-core
 * Created Date: 2022-09-27
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 渲染器
 * Description: 组件渲染的核心文件
 */

import { ReactiveEffect } from '@vue/reactivity';
import { invokeArrayFns, PatchFlags, ShapeFlags } from '@vue/shared';
import { createComponentInstance, setupComponent } from './component';
import { updateProps } from './componentProps';
import { renderComponentRoot, shouldUpdateComponent } from './componentRenderUtils';
import { updateSlots } from './componentSlots';
import { invokeDirectiveHook } from './directives';
import { flushPostFlushCbs, queueJob, queuePostFlushCb } from './scheduler';
import { getSequence } from './utils/sequence';
import { Fragment, isSameVnode, normalizeVNode, Text } from './vnode';


/**
 * 创建渲染器
 *  与平台无关，渲染过程由 renderOptions 来决定，可能是DOM操作实现、也可能是 canvas 或小程序的实现
 * @param renderOptions 渲染选项
 */
export function createRenderer(renderOptions) {
  // 将渲染操作中的API取出，并重新命名
  const {
    insert: hostInsert,
    remove: hostRemove,
    setText: hostSetText,
    patchProp: hostPatchProp,
    parentNode: hostParentNode,
    createText: hostCreateText,
    nextSibling: hostNextSibling,
    createElement: hostCreateElement,
    setElementText: hostSetElementText
  } = renderOptions;

  // 渲染函数
  const render = (vnode, container) => {
    if (vnode == null) {
      // 节点为空，自动卸载组件
      if (container._vnode) {
        // 确实有旧节点，卸载删除掉
        unmount(container._vnode, null);
      }
    } else {
      // 执行 patch（初始化或更新）
      patch(container._vnode || null, vnode, container);
    }
    // 清洗收集的回调， 有 v-model 指令初始回显
    flushPostFlushCbs();
    // 将当前 vnode 保存到元素对象中
    container._vnode = vnode;
  }

  // 打补丁（核心函数，包含初始化、更新、diff全量对比）
  const patch = (oldVnode, newVnode, container, anchor = null, parentComponent = null) => {
    if (oldVnode === newVnode) {
      // 两个节点一样，没必要对比，直接返回
      return;
    }
    if (oldVnode && !isSameVnode(oldVnode, newVnode)) {
      // 旧节点存在，并且还不是相同节点，获取参考元素，否则新节点将会出现在最后
      anchor = getNextHostNode(oldVnode);
      // 新旧节点不一致，卸载旧节点
      unmount(oldVnode, parentComponent);
      // 把旧节点设置为空，旧节点为空则证明第一次挂载
      oldVnode = null;
    }

    const { type, shapeFlag } = newVnode;
    // 根据不同形状执行不同逻辑
    switch (type) {
      case Text:
        // 执行文本处理
        processText(oldVnode, newVnode, container);
        break;
      case Fragment:
        // 是 Fragment 片段标签，执行片段逻辑处理
        processFragment(oldVnode, newVnode, container, parentComponent);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 执行元素处理
          processElement(oldVnode, newVnode, container, anchor, parentComponent);
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          // 是组件，执行组件处理逻辑
          processComponent(oldVnode, newVnode, container, anchor, parentComponent);
        }
    }
  }

  // 获取下一个节点
  const getNextHostNode = vnode => {
    if (vnode.shapeFlag & ShapeFlags.COMPONENT) {
      // 如果是组件，就继续递归子节点
      return getNextHostNode(vnode.component.subTree);
    }
    // 获取下一个兄弟节点
    return hostNextSibling((vnode.anchor || vnode.el))
  }

  // 执行组件处理逻辑（统一处理组件 状态组件、函数式组件）
  const processComponent = (oldVnode, newVnode, container, anchor, parentComponent) => {
    if (oldVnode == null) {
      // 旧组件没有，属于第一次渲染，执行组件挂载
      mountComponent(newVnode, container, anchor, parentComponent);
    } else {
      // 更新组件
      updateComponent(oldVnode, newVnode);
    }
  }

  // 挂载组件
  const mountComponent = (initialVNode, container, anchor, parentComponent) => {
    // 创建组件实例，将组件实例挂载到虚拟节点中
    const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
    // 设置组件实例
    setupComponent(instance);
    // 设置渲染 effect
    setupRenderEffect(instance, initialVNode, container, anchor);
  }

  // 设置渲染 effect
  // 组件 初始化/更新 函数
  const setupRenderEffect = (instance, initialVNode, container, anchor) => {
    // 组件内部更新
    const componentUpdateFn = () => {
      // 如果没有挂载过，则是第一次渲染，就初始化并渲染，否则就是更新
      if (!instance.isMounted) {
        // 第一次渲染，执行 onBeforeMount 钩子函数
        const { bm, m } = instance;
        bm && invokeArrayFns(bm);

        // 执行组件内的 render 函数（执行 render 后，里面的响应式对象就会触发代理读取操作）
        const subTree = renderComponentRoot(instance);
        // 拿到组件内的 vnode 后，执行 patch，将组件内的元素渲染到浏览器
        patch(null, subTree, container, anchor, instance);

        // 已渲染，调用 onMounted 钩子函数
        m && invokeArrayFns(m);

        // 将 subTree 挂载到组件实例
        instance.subTree = subTree;
        // 设置挂载标识
        instance.isMounted = true;
        // 将根元素赋给组件的el
        initialVNode.el = subTree.el;
      } else {
        // 组件更新
        const { next, bu, u } = instance;

        // 更新之前，调用 onBeforeUpdate 钩子函数
        bu && invokeArrayFns(bu);

        // 更新组件之前渲染
        next && updateComponentPreRender(instance, next);
        // 执行组件内的 render 函数（执行 render 后，里面的响应式对象就会触发代理读取操作）
        const subTree = renderComponentRoot(instance);
        // 上次保存到组件实例的 subTree 为旧节点，本次为新节点，执行对比
        patch(instance.subTree, subTree, container, anchor, instance);
        // 更新 subTree
        instance.subTree = subTree;

        // 更新后，调用 onUpdated 钩子
        u && invokeArrayFns(u);
      }
    }

    // 本方法既有初始化，又有更新（本次初始化会调用一次 run，数据变了还会调用 run）
    // 用户可能在方法内更新了好多响应式变量，不能每更新一个就执行一次 run 吧？
    // 所以我们使用 ReactiveEffect 中的 scheduler ，更新由我们来触发，就是执行 queueJob 方法
    // queueJob 内来执行 update（实例上的 update 就是 run ）
    // queueJob 内部会异步更新，放入了微任务中去执行，将用户操作栈中任务一次性消费，而非响应式变量改一次值就重新渲染一次
    const effect = new ReactiveEffect(componentUpdateFn, () => queueJob(instance.update));
    // run方法 要保证永远指向 effect
    // 将 组件强制更新的逻辑（run）保存到组件实例上，后续需要使用
    const update = instance.update = effect.run.bind(effect);
    // 第一次执行 
    update();
  }

  // 更新组件之前渲染
  const updateComponentPreRender = (instance, next) => {
    // 组件实例上的虚拟节点换成新节点
    instance.vnode = next;
    // 组件实例上的新节点清空
    instance.next = null;
    // 更新属性
    updateProps(instance.props, next.props);
    // 更新插槽
    updateSlots(instance, next.children);
  }

  // 执行 Fragment 处理
  const processFragment = (oldVnode, newVnode, container, parentComponent) => {
    if (oldVnode == null) {
      // 没有旧节点，挂载新节点孩子
      newVnode.children && mountChildren(newVnode.children, container, parentComponent);
    } else {
      // 更新对比孩子节点（因为两个都是数组，直接diff全量对比）
      patchChildren(oldVnode, newVnode, container, parentComponent);
    }
  }

  // 更新组件
  const updateComponent = (oldVnode, newVnode) => {
    // 元素复用我们是复用 el（DOM节点），而组件也需要复用，组件是复用 组件实例，vnode.component 就是该组件的实例
    // 将旧节点的实例给新节点
    const instance = (newVnode.component = oldVnode.component);

    // 判断组件是否应该更新 属性、插槽 是否变化
    if (shouldUpdateComponent(oldVnode, newVnode)) {
      // 将新节点挂载到 instance.next 属性中
      instance.next = newVnode;
      // 调用 update 重新执行组件更新
      instance.update();
    }
  }

  // 卸载
  const unmount = (vnode, parentComponent) => {
    const { type, shapeFlag } = vnode;

    if (type === Fragment) {
      // 是 Fragment，卸载子节点
      return unmountChildren(vnode.children, parentComponent);
    }
    if (shapeFlag & ShapeFlags.COMPONENT) {
      // 是组件，卸载组件
      return unmountComponent(vnode.component, parentComponent);
    }
    // 移除DOM元素
    hostRemove(vnode.el);
  }

  // 卸载组件
  const unmountComponent = (instance, parentComponent) => {
    const { bum, update, subTree, um } = instance;

    // 销毁前调用 onBeforeUnmount 钩子函数
    bum && invokeArrayFns(bum);
    // 卸载子组件
    update && unmount(subTree, parentComponent);
    // 销毁后，调用 onUnmounted 钩子函数
    um && invokeArrayFns(um);
  }

  // 文本处理
  const processText = (oldVnode, newVnode, container) => {
    if (oldVnode == null) {
      // 初次渲染，插入纯文本字符串内容
      hostInsert(newVnode.el = hostCreateText(newVnode.children), container);
    } else {
      // 复用DOM元素（没必要移除再创建，提高了浏览器性能）
      const el = (newVnode.el = oldVnode.el);
      if (oldVnode.children !== newVnode.children) {
        // 内容确实变化了，更新字符串
        hostSetText(el, newVnode.children)
      }
    }
  }

  // 元素处理
  const processElement = (oldVnode, newVnode, container, anchor, parentComponent) => {
    // 旧节点为空则初次挂载元素，否则就对比更新元素
    oldVnode == null ? mountElement(newVnode, container, anchor, parentComponent) : patchElement(oldVnode, newVnode, parentComponent);
  }

  // 挂载元素
  const mountElement = (vnode, container, anchor, parentComponent) => {
    const { type, props, children, shapeFlag, dirs } = vnode;
    // 创建元素，并挂载到 vnode 中
    const el = vnode.el = hostCreateElement(type);
    // 添加子元素
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 设置文本内容
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 递归挂载子节点
      mountChildren(children, el, parentComponent);
    }

    // v-model 给组件添加 input 事件
    if (dirs) {
      invokeDirectiveHook(vnode, null, 'created')
    }
    // 添加属性
    if (props) {
      for (const key in props) {
        // 添加属性
        hostPatchProp(el, key, null, props[key]);
      }
    }
    // 插入到容器元素中
    hostInsert(el, container ? container : parentComponent, anchor);

    // v-model 将绑定数据显示到组件
    // 当前函数已加入到异步队列，会在 render 函数结束时触发执行
    if (dirs) {
      queuePostFlushCb(() => dirs && invokeDirectiveHook(vnode, null, 'mounted'));
    }
  }

  // 挂载子元素
  const mountChildren = (children, container, parentComponent) => {
    for (let i = 0; i < children.length; i++) {
      // 当前节点可能是字符串，将节点转换为 Text 标识的虚拟节点
      const child = children[i] = normalizeVNode(children[i])
      // 递归继续 patch
      patch(null, child, container, null, parentComponent);
    }
  }

  // 对比更新元素
  const patchElement = (oldVnode, newVnode, parentComponent) => {
    let { patchFlag, dynamicChildren, dirs } = newVnode;
    // 元素复用
    let el = newVnode.el = oldVnode.el;
    if (el == null) {
      el = parentComponent.ctx.$el;
    }

    // 取出属性
    const oldProps = oldVnode.props || {};
    const newProps = newVnode.props || {};
    patchFlag |= oldVnode.patchFlag & PatchFlags.FULL_PROPS;

    // v-model 数据改变后给组件设置值
    if (dirs) {
      invokeDirectiveHook(newVnode, oldVnode, 'beforeUpdate');
    }

    // 如果大于0则代表是动态节点
    if (patchFlag > 0) {
      if (patchFlag & PatchFlags.FULL_PROPS) {
        // 有key，属性全部对比
        patchProps(oldProps, newProps, el);
      } else {
        if (patchFlag & PatchFlags.CLASS) {
          // class 发生变化
          oldProps.class !== newProps.class && hostPatchProp(el, 'class', null, newProps.class);
        }
        if (patchFlag & PatchFlags.STYLE) {
          // 样式 发生变化
          hostPatchProp(el, 'style', oldProps.style, newProps.style);
        }
        if (patchFlag & PatchFlags.PROPS) {
          // 动态 属性(除class/style) 变化
          const propsToUpdate = newVnode.dynamicProps;
          // 遍历动态属性
          for (let i = 0; i < propsToUpdate.length; i++) {
            const key = propsToUpdate[i];
            const prev = oldProps[key];
            const next = newProps[key];
            if (next !== prev || key === 'value') {
              // 当新属性和旧属性不相等时，或者 key 为 value 时，更新属性
              hostPatchProp(el, key, prev, next);
            }
          }
        }
      }

      if (patchFlag & PatchFlags.TEXT) {
        // 是文本，更新文本
        oldVnode.children !== newVnode.children && hostSetElementText(el, newVnode.children);
      }
    } else if (dynamicChildren === null) {
      // 全量属性对比
      patchProps(oldProps, newProps, el);
    }

    // 若是有动态子节点，则只需对比动态子节点即可，否则对比孩子
    newVnode.dynamicChildren ? patchBlockChildren(oldVnode, newVnode, el, parentComponent) : patchChildren(oldVnode, newVnode, el, parentComponent);
  }

  // 对比动态子节点
  const patchBlockChildren = (oldVnode, newVnode, el, parentComponent) => {
    const len = newVnode.dynamicChildren.length;
    // 循环动态节点
    for (let i = 0; i < len; i++) {
      // 对比元素
      const oldChild = oldVnode.dynamicChildren[i];
      const newChild = newVnode.dynamicChildren[i];

      if (isSameVnode(oldChild, newChild)) {
        // 相同节点，直接更新
        // 靶向更新的好处就是不需要递归比较，直接单层数组比较即可，就算嵌套3层，爷孙节点变化，这里也是平级处理
        patchElement(oldChild, newChild, parentComponent);
      } else {
        const isParent = oldChild.type === Fragment || !isSameVnode(oldChild, newChild) || oldChild.shapeFlag & ShapeFlags.COMPONENT;
        // 对比
        const container = oldChild.el && isParent ? hostParentNode(oldChild.el) : el;
        patch(oldChild, newChild, container);
      }
    }
  }

  // 属性更新
  const patchProps = (oldProps, newProps, el) => {
    if (oldProps !== newProps) {
      // 将新属性覆盖掉旧属性
      for (const key in newProps) {
        hostPatchProp(el, key, oldProps[key], newProps[key]);
      }

      // 循环旧属性，因为可能出现新属性不存在，而旧属性存在，这时需要移除该属性
      for (const key in oldProps) {
        if (newProps[key] == null) {
          hostPatchProp(el, key, oldProps[key], void 0);
        }
      }
    }
  }

  // 卸载子节点
  const unmountChildren = (children, parentComponent) => {
    children && children.forEach(child => unmount(child, parentComponent));
  }

  // diff比较子元素
  const patchChildren = (oldVnode, newVnode, el, parentComponent) => {
    // 取出子节点
    const oldChild = oldVnode.children;
    const newChild = newVnode.children;
    // 取出形状
    const oldFlag = oldVnode.shapeFlag;
    const newFlag = newVnode.shapeFlag;

    if (newFlag & ShapeFlags.TEXT_CHILDREN) {
      if (oldFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 新孩子=文本 旧孩子=数组：卸载旧孩子
        unmountChildren(oldChild, parentComponent);
      }
      if (oldChild !== newChild) {
        // 新孩子=文本 旧孩子=文本：更新文本
        // 新孩子=文本 旧孩子=空：更新文本
        // 设置新文本 或 更新文本
        hostSetElementText(el, newChild);
      }
    } else {
      if (oldFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (newFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 新孩子=数组 旧孩子=数组：diff全量对比
          // 注意：这里的新孩子数组内，可能不是虚拟节点，需要将数组内节点转换为 vnode
          for (const i in newChild) {
            newChild[i] = normalizeVNode(newChild[i]);
          }
          // diff全量对比
          patchKeyedChildren(oldChild, newChild, el, parentComponent);
        } else {
          // 新孩子不是数组，到了这里，就只有为空的可能
          // 将旧孩子卸载掉
          unmountChildren(oldChild, parentComponent);
        }
      } else {
        if (oldFlag & ShapeFlags.TEXT_CHILDREN) {
          // 新孩子=数组 旧孩子=文本
          // 清空文本
          hostSetElementText(el, '');
        }
        if (newFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 进行挂载
          mountChildren(newChild, el, parentComponent);
        }
      }
    }
  }

  // diff全量对比
  const patchKeyedChildren = (oldChild, newChild, el, parentComponent) => {
    // 从左边开始对比，新节点数组和旧节点数组有任何一方到头则停止循环
    let i = 0;
    // 两个节点的索引长度
    let e1 = oldChild.length - 1;
    let e2 = newChild.length - 1;

    // 从头往尾比较
    // 循环条件：有一方结束则停止循环
    while (i <= e1 && i <= e2) {
      const n1 = oldChild[i];
      const n2 = newChild[i];
      if (isSameVnode(n1, n2)) {
        // 节点相同（标签名和key都相同），递归比较两者的属性和子节点
        patch(n1, n2, el);
      } else {
        // 节点不相同，停止比较
        break;
      }
      i++;
    }

    // 从尾往头比较
    while (i <= e1 && i <= e2) {
      const n1 = oldChild[e1];
      const n2 = newChild[e2];
      if (isSameVnode(n1, n2)) {
        // 节点相同（标签名和key都相同），递归比较两者的属性和子节点
        patch(n1, n2, el);
      } else {
        // 节点不相同，停止比较
        break;
      }
      e1--;
      e2--;
    }

    // 同序列挂载 & 同序列卸载
    // 经过上面的两步，已经有了明确的指向，根据指向即可判断是否有要新增或卸载的节点
    if (i > e1) {
      // i > e1 证明新节点比旧节点多，这里执行新增节点
      if (i <= e2) {
        while (i <= e2) {
          // e2下一个位置
          const nextPos = e2 + 1;
          // 参照物，看是往前插入还是往后插入
          const anchor = nextPos < newChild.length ? newChild[nextPos].el : null;
          // 新增元素
          patch(null, newChild[i], el, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      // i > e2 证明旧节点比新节点多，这里执行删除节点
      if (i <= e1) {
        while (i <= e1) {
          // 卸载节点
          unmount(oldChild[i], parentComponent);
          i++;
        }
      }
    }

    // 乱序比对
    // 虽然新旧节点在同一个索引不一致，但还是可以复用的，思路就是放入 Map 中，直接映射寻找
    let s1 = i;
    let s2 = i;

    // 映射表，存放新节点，方便去里面找，做节点复用，结构为：{ key: index }
    const keyToNewIndexMap = new Map();
    for (let i = s2; i <= e2; i++) {
      keyToNewIndexMap.set(newChild[i].key, i);
    }

    // 新节点的总个数
    // 根据新节点中间乱序部分的结尾和开始的差值+1得出新节点的总个数
    const toBePatched = e2 - s2 + 1;
    // 创建一个数组，存放 新的位置对应老的位置，长度为新节点的总个数，默认全填充0
    const newIndexToOldIndex = new Array(toBePatched).fill(0);

    // 循环旧节点去映射表中找，看旧节点中有没有，如果有则比较差异，如果没有就添加到列表中
    // 旧节点有，新节点没有则要删除
    for (let i = s1; i <= e1; i++) {
      // 乱序中旧节点的孩子
      const oldVNode = oldChild[i];
      // 根据key从映射表中获取相同key的节点
      const newIndex = keyToNewIndexMap.get(oldVNode.key);
      if (newIndex == null) {
        // 新节点映射表中没有找到相同key的节点，证明新节点没有这个，那么就把当前旧节点卸载掉
        unmount(oldVNode, parentComponent);
      } else {
        // 对比前，将当前节点记录一下，证明已经比对过了
        // 通过 newIndex - s2 算出在乱序中的索引
        // 数组的值 = i，而 i 有可能是0，所以永远都 +1
        // 执行后 newIndexToOldIndex 中的结果就是：
        //      对比过的节点：对应的值为 当前节点在旧节点所在的位置+1
        //      未对比过的节点：对应的值为 0
        newIndexToOldIndex[newIndex - s2] = i + 1;
        // 从新节点中找到了相同key的节点，那就 递归对比差异
        patch(oldVNode, newChild[newIndex], el);
      }
    }

    // 移动位置
    // 经过上面的乱序对比后，虽然乱序节点得到了复用，但是位置依旧是老的，因为是通过映射表实现的，所以需要移动正确的位置
    // 获取 最长递增子序列（存放的是 newIndexToOldIndex 中不需要插入或移动的索引）
    // vue3优化：使用 最长递增子序列 计算出哪些不需要插入或调整位置，否则浪费性能
    // 比如当前 newIndexToOldIndex 为 [5, 3, 4, 0]，那么 increment 经过 最长递增子序列 计算过的值会是 [1, 2]
    // 代表着 newIndexToOldIndex 的索引 1号 和 0号 不用动，跳过即可
    const increment = getSequence(newIndexToOldIndex);
    // 定义 最长递增子序列 i 索引，因为这里是倒序，所以这里也需要倒着取值
    let incrementI = increment.length - 1;

    // 倒序循环
    // toBePatched 当索引来用，所以 -1
    for (let i = toBePatched - 1; i >= 0; i--) {
      // 获取乱序中最后一个节点索引
      const index = i + s2;
      // 把节点取出来
      const current = newChild[index];
      // 取出参照物（就是当前取出的节点右侧的节点元素当做参照物）
      const anchor = index + 1 < newChild.length ? newChild[index + 1].el : null;

      // 从 newIndexToOldIndex 中找一下，看是否已经对比过，没有对比过则创建
      if (newIndexToOldIndex[i] === 0) {
        // 创建
        patch(null, current, el, anchor);
      } else {
        // 当前 i 索引如果不等于最长递增子序列中记载的索引则插入或移动，否则就略过
        if (i !== increment[incrementI]) {
          // 已对比过，插入（根据参照物移动位置）
          hostInsert(current.el, el, anchor);
        } else {
          // 最长递增子序列索引自减
          incrementI--;
        }
      }
    }
  }

  return {
    render
  }
}