/*
 * File: /src/transforms/transformElement.ts
 * Project: @vue/compiler-core
 * Created Date: 2023-02-26
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 转化元素
 */

import { isOn, PatchFlags } from "@vue/shared";
import { ConstantTypes, createArrayExpression, createCallExpression, createObjectExpression, createObjectProperty, createSimpleExpression, createVNodeCall, ElementTypes, NodeTypes } from "../ast";
import { KEEP_ALIVE, NORMALIZE_CLASS, NORMALIZE_PROPS, NORMALIZE_STYLE, RESOLVE_COMPONENT, TELEPORT } from "../runtimeHelpers";
import { isCoreComponent, isStaticExp } from "../utils";
import { buildSlots } from "./vSlot";

// 指令导入映射
const directiveImportMap = new WeakMap()

export const transformElement = (node, context) => {
  // 退出函数
  return function postTransformElement() {
    // 当前正常运行的节点
    node = context.currentNode;

    // 只处理元素和组件
    if (!(node.type === NodeTypes.ELEMENT && (node.tagType === ElementTypes.ELEMENT || node.tagType === ElementTypes.COMPONENT))) {
      return;
    }

    // 获取tag和属性
    const { tag, props } = node;
    // 是否组件
    const isComponent = node.tagType === ElementTypes.COMPONENT;
    // 如果是组件，则添加 resolveComponent 函数并拿到拼接后的组件组件名，否则直接使用标签名
    const vnodeTag = isComponent ? resolveComponentType(node, context) : `"${tag}"`;

    let vnodeProps;
    let vnodeChildren;
    let vnodePatchFlag;
    let patchFlag = 0;
    let vnodeDynamicProps;
    let dynamicPropNames;
    let vnodeDirectives;
    let shouldUseBlock = vnodeTag === TELEPORT;

    if (props.length > 0) {
      // 构建属性
      const propsBuildResult = buildProps(node, context, undefined, isComponent);
      vnodeProps = propsBuildResult.props;
      patchFlag = propsBuildResult.patchFlag;
      dynamicPropNames = propsBuildResult.dynamicPropNames;
      const directives = propsBuildResult.directives;
      // 如果指令存在，则构建指令参数并创建数组表达式
      vnodeDirectives = directives && directives.length ?
        createArrayExpression(directives.map(dir => buildDirectiveArgs(dir, context))) : undefined;
      if (propsBuildResult.shouldUseBlock) {
        shouldUseBlock = true;
      }
    }

    if (node.children.length > 0) {
      if (vnodeTag === KEEP_ALIVE) {
        shouldUseBlock = true;
        // 添加动态插槽标识
        patchFlag |= PatchFlags.DYNAMIC_SLOTS
      }

      // 是否应该构建插槽（ Teleport 和 KeepAlive 有专门的处理）
      const shouldBuildAsSlots = isComponent && vnodeTag !== TELEPORT && vnodeTag !== KEEP_ALIVE;
      if (shouldBuildAsSlots) {
        const { slots } = buildSlots(node, context);
        vnodeChildren = slots;
      } else if (node.children.length === 1 && vnodeTag !== TELEPORT) {
        // 只有一个子节点
        const child = node.children[0];
        const type = child.type;
        // 是否动态本文本
        const hasDynamicTextChild = type === NodeTypes.INTERPOLATION || type === NodeTypes.COMPOUND_EXPRESSION;
        if (hasDynamicTextChild) {
          patchFlag |= PatchFlags.TEXT;
        }
        if (hasDynamicTextChild || type === NodeTypes.TEXT) {
          // 唯一的节点是文本节点，直接传递
          vnodeChildren = child;
        } else {
          // 取整个子节点
          vnodeChildren = node.children;
        }
      } else {
        // 取整个子节点
        vnodeChildren = node.children;
      }
    }

    if (patchFlag !== 0) {
      // 将对比标识转为字符串
      vnodePatchFlag = patchFlag;
      if (dynamicPropNames && dynamicPropNames.length) {
        vnodeDynamicProps = stringifyDynamicPropNames(dynamicPropNames);
      }
    }
    // 生成节点
    node.codegenNode = createVNodeCall(
      context,
      vnodeTag,           // tag
      vnodeProps,         // props
      vnodeChildren,      // 子节点
      vnodePatchFlag,     // patchFlag标识
      vnodeDynamicProps,  // dynamicProps（动态属性）
      vnodeDirectives,    // directives（指令）
      !!shouldUseBlock,   // 是否Block
      false,              // disableTracking（是否禁用收集动态节点）
      isComponent         // 是否组件
    );
  }
}

// 解决组件类型
export const resolveComponentType = (node, context) => {
  // 拿到标签
  let { tag } = node;

  // Teleport 和 KeepAlive 组件不需要处理
  const builtIn = isCoreComponent(tag);
  if (builtIn) {
    return builtIn;
  }

  // 添加 resolveComponent 函数
  context.helper(RESOLVE_COMPONENT);
  // 添加用户组件
  context.components.add(tag);
  // 将组件名拼接一下
  return `_component_${tag}`;
}

// 构建属性
export const buildProps = (node, context, props = node.props, isComponent) => {
  // 属性数组
  const properties = [];
  // 动态属性名称集合
  const dynamicPropNames = [];
  // 运行时指令
  const runtimeDirectives = [];
  // 对比标识
  let patchFlag = 0;
  // 有绑定的class
  let hasClassBinding = false;
  // 有绑定的样式
  let hasStyleBinding = false;
  // 有动态key
  let hasDynamicKeys = false;
  // 有事件绑定
  let hasHydrationEventBinding = false;

  // 分析对比标识
  const analyzePatchFlag = ({ key, value }) => {
    // 判断是否静态表达式
    if (isStaticExp(key)) {
      // 取出属性名
      const name = key.content;
      const isEventHandler = isOn(name);
      // 如果是事件，而且非组件，并且事件名不是 click，而且 不是v-model默认值更新，则事件绑定为真
      // 非组件的事件且不是单击事件也不是v-model的迷人值则设置事件绑定
      if (isEventHandler && !isComponent && name.toLowerCase() !== 'onclick' && name !== 'onUpdate:modelValue') {
        hasHydrationEventBinding = true;
      }
      // 如果节点类型为简单表达式，或者为复合表达式，而且常量类型为3，则跳过（比如style写死的常量，没必要再引入 normalizeStyle 函数）
      if ((value.type === NodeTypes.SIMPLE_EXPRESSION || value.type === NodeTypes.COMPOUND_EXPRESSION) && value.constType === ConstantTypes.CAN_STRINGIFY) {
        return;
      }

      // 根据属性名设置一些操作
      if (name === 'class') {
        hasClassBinding = true;
      } else if (name === 'style') {
        hasStyleBinding = true;
      } else if (name !== 'key' && !dynamicPropNames.includes(name)) {
        // 如果属性名不是key，并且动态属性集合中不存在，则添加
        dynamicPropNames.push(name);
      }
      // 如果是组件，并且属性名为 class 或 style 则添加到动态属性列表中
      if (isComponent && (name === 'class' || name === 'style') && !dynamicPropNames.includes(name)) {
        dynamicPropNames.push(name);
      }
    } else {
      // 属于动态属性
      hasDynamicKeys = true;
    }
  }

  // 遍历属性
  for (let i = 0; i < props.length; i++) {
    const prop = props[i];

    if (prop.type === NodeTypes.ATTRIBUTE) {
      const { loc, name, value } = prop;
      let isStatic = true;
      // 创建对象属性添加到列表
      properties.push(
        createObjectProperty(
          createSimpleExpression(name, true),
          createSimpleExpression(value ? value.content : '', isStatic)
        )
      );
    } else {
      const { name } = prop;

      if (name === 'slot') {
        // 是插槽则跳过，有专门处理slot的操作
        continue;
      }

      const directiveTransform = context.directiveTransforms[name];
      if (directiveTransform) {
        // 执行指令转换（on、bind、model）
        const { props, needRuntime } = directiveTransform(prop, node, context);
        // 遍历全部属性挨个分析
        props.forEach(item => analyzePatchFlag(item));
        // 添加到 properties 中
        properties.push(...props);

        // 运行时导入的指令是否存在（这里可能是 v-model 或 v-show）
        if (needRuntime) {
          // 添加运行时指令
          runtimeDirectives.push(prop);
          directiveImportMap.set(prop, needRuntime);
        }
      }
    }
  }

  // 属性表达式
  let propsExpression;
  if (properties.length) {
    propsExpression = createObjectExpression(properties);
  }

  if (hasDynamicKeys) {
    // 有动态key，完全diff对比
    patchFlag |= PatchFlags.FULL_PROPS;
  } else {
    if (hasClassBinding && !isComponent) {
      // class对比
      patchFlag |= PatchFlags.CLASS
    }
    if (hasStyleBinding && !isComponent) {
      // 样式对比
      patchFlag |= PatchFlags.STYLE
    }
    if (dynamicPropNames.length) {
      // 有动态属性，添加 属性(除class/style) 变化标识
      patchFlag |= PatchFlags.PROPS
    }
    if (hasHydrationEventBinding) {
      // 有事件绑定
      patchFlag |= PatchFlags.HYDRATE_EVENTS
    }
  }

  if (propsExpression) {
    switch (propsExpression.type) {
      case NodeTypes.JS_OBJECT_EXPRESSION:
        // 非 v-bind
        let classKeyIndex = -1;
        let styleKeyIndex = -1;
        let hasDynamicKey = false;

        // 遍历属性，获取到 class 或 style 的索引位置
        for (let i = 0; i < propsExpression.properties.length; i++) {
          const key = propsExpression.properties[i].key;
          if (isStaticExp(key)) {
            if (key.content === 'class') {
              classKeyIndex = i;
            } else if (key.content === 'style') {
              styleKeyIndex = i;
            }
          } else if (!key.isHandlerKey) {
            hasDynamicKey = true;
          }
        }

        // 获取到两个属性
        const classProp = propsExpression.properties[classKeyIndex]
        const styleProp = propsExpression.properties[styleKeyIndex]

        if (!hasDynamicKey) {
          // 非动态key
          if (classProp && !isStaticExp(classProp.value)) {
            // 给class属性创建值
            classProp.value = createCallExpression(context.helper(NORMALIZE_CLASS), [classProp.value]);
          }
          if (styleProp && hasStyleBinding) {
            // 给样式属性创建值
            styleProp.value = createCallExpression(context.helper(NORMALIZE_STYLE), [styleProp.value]);
          }
        } else {
          // 给属性表达式创建值
          propsExpression = createCallExpression(context.helper(NORMALIZE_PROPS), [propsExpression]);
        }
        break;
      default:
        // 单个 v-bind 
        propsExpression = createCallExpression(context.helper(NORMALIZE_PROPS), [propsExpression]);
        break;
    }
  }

  return {
    props: propsExpression,
    directives: runtimeDirectives,
    patchFlag,
    dynamicPropNames,
    shouldUseBlock: false
  }
}

// 构建指令参数
const buildDirectiveArgs = (dir, context) => {
  const dirArgs = [];
  // 从指令映射表中根据当前指令获取到要导入的函数名，如：vModelText
  const runtime = directiveImportMap.get(dir);
  if (runtime) {
    // 存在，push到指令参数中
    // 在push之前需要先通过 Symbol 拿到对应的函数名，并添加 _，因为生成的代码函数都是有 _别名的
    dirArgs.push(context.helperString(runtime));
  }
  dir.exp && dirArgs.push(dir.exp);
  return createArrayExpression(dirArgs);
}

// 将动态属性数组变成字符串
const stringifyDynamicPropNames = props => {
  let propsNamesString = `[`;
  // 挨个遍历格式化，以逗号隔开
  for (let i = 0, l = props.length; i < l; i++) {
    propsNamesString += JSON.stringify(props[i]);
    if (i < l - 1) {
      propsNamesString += ', ';
    }
  }
  return propsNamesString + `]`;
}
