/*
 * File: /src/codegen.ts
 * Project: @vue/compiler-core
 * Created Date: 2023-02-26
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 代码生成
 * Description: 将完善后的抽象语法树生成 render 代码
 */

import { isArray, isString, isSymbol } from "@vue/shared";
import { NodeTypes } from "./ast";
import { CREATE_BLOCK, CREATE_ELEMENT_BLOCK, CREATE_ELEMENT_VNODE, CREATE_VNODE, helperNameMap, OPEN_BLOCK, RESOLVE_COMPONENT, TO_DISPLAY_STRING, WITH_DIRECTIVES } from "./runtimeHelpers";
import { isSimpleIdentifier } from "./utils";

// 代码生成（ module模式 ）
export const generate = ast => {
  // 创建一个上下文
  const context = createCodegenContext();
  const { push, indent, deindent, newline } = context;

  // 添加序言
  genFunctionPreamble(ast, context)

  // 方法名和方法的参数
  const functionName = 'render';
  const args = ['_ctx'];

  // 添加方法
  push(`function ${functionName}(${args.join()}) {`);
  // 缩进并换行
  indent();
  // 使用 with 块
  push('with (_ctx) {');
  indent();

  // 如果存在使用的函数则从 _Vue 中解构
  if (ast.helpers.length > 0) {
    push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = _Vue`);
    push('\n');
    newline();
  }

  // 如果有组件，则生成组件
  if (ast.components.length) {
    genAssets(ast.components, 'component', context);
    push('\n');
    newline();
  }

  // 返回创建的vnode
  push('return ');

  // 生成代码
  if (ast.codegenNode) {
    // 生成节点
    genNode(ast.codegenNode, context);
  } else {
    push('null');
  }

  // 添加结束符
  deindent();
  push('}');
  deindent();
  push('}');

  return {
    ast,
    code: context.code,
  }
}


// 生成单个组件
export const toValidAssetId = (name, type) => {
  // 添加 _component_ 的同时，也将 - 转换为 _
  return `_${type}_${name.replace(/[^\w]/g, (searchValue, replaceValue) => {
    return searchValue === '-' ? '_' : name.charCodeAt(replaceValue).toString();
  })}`
}

// 用于生成组件
const genAssets = (assets, type, { helper, push, newline }) => {
  // 使用 resolveComponent 函数
  const resolver = helper(RESOLVE_COMPONENT);

  for (let i = 0; i < assets.length; i++) {
    let id = assets[i];
    // 添加组件生成创建
    push(`const ${toValidAssetId(id, type)} = ${resolver}(${JSON.stringify(id)})`);
    if (i < assets.length - 1) {
      // 只要不是最后一行，则换行
      newline();
    }
  }
}

// 生成节点
const genNode = (node, context) => {
  if (node == null) {
    return;
  }
  // 如果节点是字符串，直接添加即可
  if (isString(node)) {
    context.push(node);
    return;
  }
  // 如果是 Symbol，直接生成指定值即可，如：Symbol(Fragment)
  if (isSymbol(node)) {
    context.push(context.helper(node));
    return;
  }

  // 根据类型生成
  switch (node.type) {
    // 元素或文本调用和 if 以及 for ，根据 codegenNode 继续递归
    case NodeTypes.ELEMENT:
    case NodeTypes.TEXT_CALL:
    case NodeTypes.IF:
    case NodeTypes.FOR:
      genNode(node.codegenNode, context);
      break;
    case NodeTypes.TEXT:
      genText(node, context);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context);
      break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context);
      break;
    case NodeTypes.VNODE_CALL:
      genVNodeCall(node, context);
      break;
    case NodeTypes.JS_CALL_EXPRESSION:
      genCallExpression(node, context);
      break;
    case NodeTypes.JS_OBJECT_EXPRESSION:
      genObjectExpression(node, context);
      break;
    case NodeTypes.JS_ARRAY_EXPRESSION:
      genArrayExpression(node, context);
      break;
    case NodeTypes.JS_FUNCTION_EXPRESSION:
      genFunctionExpression(node, context);
      break;
    case NodeTypes.JS_CONDITIONAL_EXPRESSION:
      genConditionalExpression(node, context)
      break
  }
}

// 生成条件表达式
const genConditionalExpression = (node, context) => {
  const { test, consequent, alternate, newline: needNewline } = node;
  const { push, indent, deindent, newline } = context;

  if (test.type === NodeTypes.SIMPLE_EXPRESSION) {
    // 生成简单表达式
    const needsParens = !isSimpleIdentifier(test.content);
    needsParens && push('(');
    genExpression(test, context);
    needsParens && push(')');
  } else {
    // 继续递归
    push('(');
    genNode(test, context);
    push(')');
  }
  // 新行缩进并累加缩进级别
  needNewline && indent();
  context.indentLevel++;
  needNewline || push(' ');

  // 拼接三元表达式
  push('? ');
  // 递归生成
  genNode(consequent, context);
  context.indentLevel--;
  needNewline && newline();
  needNewline || push(' ');
  push(': ');
  const isNested = alternate && alternate.type === NodeTypes.JS_CONDITIONAL_EXPRESSION;
  if (!isNested) {
    context.indentLevel++;
  }
  genNode(alternate, context)
  if (!isNested) {
    context.indentLevel--;
  }
  needNewline && deindent(true);
}

// 生成函数表达式
const genFunctionExpression = (node, context) => {
  const { push, indent, deindent } = context;
  const { params, returns, newline, isSlot } = node;
  push('(');
  // 生成节点
  if (isArray(params)) {
    genNodeList(params, context);
  } else if (params) {
    genNode(params, context);
  }
  push(') => ');
  if (newline) {
    push('{');
    indent();
  }

  // 如果存在返回属性，则生成返回代码
  if (returns) {
    if (newline) {
      push('return ');
    }
    if (isArray(returns)) {
      genNodeListAsArray(returns, context);
    } else {
      genNode(returns, context);
    }
  }

  if (newline) {
    deindent();
    push('}');
  }
}

// 生成数组表达式
const genArrayExpression = (node, context) => genNodeListAsArray(node.elements, context);

// 生成对象表达式
const genObjectExpression = (node, context) => {
  const { push, indent, deindent, newline } = context;
  const { properties } = node;
  // 如果属性数组长度为0，则直接写入空对象返回即可
  if (!properties.length) {
    push('{}');
    return;
  }
  // 属性数组长度大于1则认为是多行
  const multilines = properties.length > 1;
  push(multilines ? '{' : '{ ');
  multilines && indent();

  for (let i = 0; i < properties.length; i++) {
    const { key, value } = properties[i];
    // 生成key
    genExpressionAsPropertyKey(key, context);
    push(': ');
    // 生成值
    genNode(value, context);
    // 如果是多个，则使用逗号隔开
    if (i < properties.length - 1) {
      push(',');
      newline();
    }
  }
  // 反向缩进回来
  multilines && deindent();
  push(multilines ? '}' : ' }');
}

// 生成key
const genExpressionAsPropertyKey = (node, context) => {
  const { push } = context;
  if (node.type === NodeTypes.COMPOUND_EXPRESSION) {
    // 生成混合表达式
    push('[')
    genCompoundExpression(node, context);
    push(']')
  } else if (node.isStatic) {
    // 如果是静态的，直接转换为字符串写入
    const text = isSimpleIdentifier(node.content) ? node.content : JSON.stringify(node.content);
    push(text);
  } else {
    // 使用中括号
    push(`[${node.content}]`);
  }
}


// 生成执行表达式
const genCallExpression = (node, context) => {
  const { push, helper } = context;
  // 如果是字符串函数名，则直接使用，否则通过 helperNameMap 拿到
  const callee = isString(node.callee) ? node.callee : helper(node.callee);
  // 执行函数
  push(callee + '(');
  // 生成节点参数
  genNodeList(node.arguments, context);
  // 结束
  push(')');
}

// 生成节点调用
const genVNodeCall = (node, context) => {
  const { push, helper } = context;
  const {
    tag,
    props,
    children,
    patchFlag,
    dynamicProps,
    directives,
    isBlock,
    disableTracking,
    isComponent
  } = node;

  if (directives) {
    // 如果有组件，则添加 withDirectives 方法
    push(helper(WITH_DIRECTIVES) + '(');
  }
  if (isBlock) {
    // 如果是 block节点，则添加 openBlock，根据 disableTracking 标识设置是否收集（如 for 这种不稳定因素则会为true）
    push(`(${helper(OPEN_BLOCK)}(${disableTracking ? 'true' : ''}), `)
  }

  // 如果是 block节点，则生成导入函数时使用 block 创建函数，否则使用普通虚拟节点创建函数
  const callHelper = isBlock ?
    isComponent ? CREATE_BLOCK : CREATE_ELEMENT_BLOCK :
    isComponent ? CREATE_VNODE : CREATE_ELEMENT_VNODE;

  // 添加函数导入
  push(helper(callHelper) + '(');
  // 生成节点集合
  genNodeList(genNullableArgs([tag, props, children, patchFlag, dynamicProps]), context);
  // 添加结束括号
  push(')');
  // 因为 block 生成时会在外面再添加一个括号，如：(_openBlock(), _createElementBlock())，所以这里需要结束掉
  if (isBlock) {
    push(')');
  }
  // 执行指令的生成
  if (directives) {
    push(', ');
    genNode(directives, context);
    push(')');
  }
}

// 生成节点集合
const genNodeList = (nodes, context, multilines = false) => {
  const { push, newline } = context;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (isString(node)) {
      // 如果是字符串直接添加即可
      push(node);
    } else if (isArray(node)) {
      // 执行节点集合数组生成
      genNodeListAsArray(node, context);
    } else {
      // 遍历从头开始生成
      genNode(node, context);
    }
    if (i < nodes.length - 1) {
      // 不是最后一行，则根据是否多行参数来选择是否切入新行
      if (multilines) {
        push(',');
        newline()
      } else {
        push(',');
      }
    }
  }
}

// 生成节点集合数组
const genNodeListAsArray = (nodes, context) => {
  // 节点数量大于3则认为是多行
  const multilines = nodes.length > 3;
  context.push('[');
  // 多行则缩进
  multilines && context.indent();
  genNodeList(nodes, context, multilines);
  // 执行完再缩回来
  multilines && context.deindent();
  context.push(']');
}

// 生成可空参数
const genNullableArgs = args => {
  let i = args.length;
  while (i--) {
    // 倒序，当碰到不为空的参数时则跳出
    if (args[i] != null) {
      break;
    }
  }
  // 最后面连续空参数忽略，并返回数组（空参数返回 null文本字符串）
  return args.slice(0, i + 1).map(arg => arg || 'null');
}

// 生成复合表达式
const genCompoundExpression = (node, context) => {
  // 遍历生成
  node.children.forEach(item => {
    // 如果是字符串直接添加即可，否则继续递归子节点
    isString(item) ? context.push(item) : genNode(item, context);
  });
}

// 生成表达式
const genExpression = (node, context) => {
  /*
      {{name}}
        ↓
      _ctx.name
  */
  // 如果是静态的，直接转换为字符串即可
  context.push(node.isStatic ? JSON.stringify(node.content) : node.content);
}

// 生成文本
const genText = (node, context) => {
  /*
      hello
        ↓
      return "hello"
  */

  // 添加双引号
  context.push(JSON.stringify(node.content))
}

// 生成表达式
const genInterpolation = (node, context) => {
  /*
      {{name}}
        ↓
      return _toDisplayString(_ctx.name)
  */

  const { push, helper } = context;
  // 里面调用 toDisplayString 方法
  push(`${helper(TO_DISPLAY_STRING)}(`);
  // 这里递归继续生成
  genNode(node.content, context);
  // 添加结束符
  push(')');
}

// helper 别名
const aliasHelper = s => `${helperNameMap[s]}: _${helperNameMap[s]}`;

// 生成序言
const genFunctionPreamble = (ast, context) => {
  const { runtimeGlobalName, push, newline } = context;

  if (ast.helpers.length) {
    // 声明 _Vue 变量，从全局变量 Vue 取值，为了避免冲突 
    push(`const _Vue = ${runtimeGlobalName}\n`);
  }
  newline();
  // 添加导出
  push('return ');
}

// 创建代码生成上下文
const createCodegenContext = () => {
  const context = {
    // 全局名称
    runtimeGlobalName: 'Vue',
    // 最终生成结果
    code: '',
    // 根据名称获取到方法名
    helper(key) {
      return `_${helperNameMap[key]}`;
    },
    // 添加代码
    push(code) {
      context.code += code;
    },
    // 代码缩进层级
    indentLevel: 0,
    // 代码缩进（用到缩进会换行）
    indent() {
      // 添加缩进级别
      ++context.indentLevel
      // 换行
      context.newline();
    },
    // 代码反向缩进
    deindent(whithoutNewLine = false) {
      --context.indentLevel;
      if (!whithoutNewLine) {
        // 换行
        context.newline();
      }
    },
    // 产生新行
    newline() {
      newline(context.indentLevel);
    }
  }

  // 产生新行
  function newline(n) {
    // 换行，并添加缩进
    context.push('\n' + '  '.repeat(n));
  }

  return context;
}

