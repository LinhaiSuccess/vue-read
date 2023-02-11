/*
 * File: /src/parse.ts
 * Project: @vue/compiler-core
 * Created Date: 2023-02-11
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 模板解析器
 * Description: 用于解析Vue模板标签生成抽象语法树
 */

import { isArray, isNativeTag, makeMap } from "@vue/shared";
import { ConstantTypes, createRoot, ElementTypes, NodeTypes } from "./ast";
import { isCoreComponent } from "./utils";

// 基本解析函数
export const baseParse = template => {
  // 创建解析上下文
  const context = createParserContext(template);
  // 获取开始游标
  const start = getCursor(context);
  // 创建根节点
  return createRoot(parseChildren(context), getSelection(context, start));
}

// 创建解析上下文
const createParserContext = content => {
  // 默认上下文对象
  return {
    line: 1,                    // 行
    column: 1,                  // 列
    offset: 0,                  // 偏移量
    source: content,            // 源内容
    originalSource: content,    // 固定原始内容
  }
}

// 获取游标（位置信息）
const getCursor = context => {
  // 将 行、列、偏移量 返回
  const { line, column, offset } = context;
  return { line, column, offset };
}

// 获取选择集
const getSelection = (context, start, end?) => {
  // 参数存在则使用参数，否则就地获取
  end = end || getCursor(context);
  return {
    start,
    end,
    source: context.originalSource.slice(start.offset, end.offset)
  };
}

// 解析子元素（我们这里不解析HTML注释，所以模板中不要出现注释）
const parseChildren = context => {
  // 节点集
  const nodes = [];

  // 遍历循环，单字符解析，直到 source 解析完
  while (!isEnd(context)) {
    const { source } = context;
    let node;
    if (source.startsWith('{{')) {
      // 解析表达式
      node = parseInterpolation(context);
    } else if (source[0] === '<') {
      // 解析标签
      if (source[1] === '/') {
        // 属于自闭合标签
        if (source[2] === '>') {
          // 属于空自闭合标签，推进3个字符忽略掉
          advanceBy(context, 3);
          continue;
        } else if (/[a-z]/i.test(source[2])) {
          // 解析标签
          parseTag(context);
          continue;
        }
      } else {
        // 解析元素
        node = parseElement(context);
      }
    }

    if (!node) {
      // 节点依旧为空，属于文本内容，解析文本
      node = parseText(context);
    }

    // 追加到节点集中
    isArray(node) ? nodes.push(...node) : nodes.push(node);
  }

  // 干掉空白字符
  nodes.forEach((n, i) => {
    if (n.type === NodeTypes.TEXT) {
      // 排除空格、制表符、回车等字符
      if (!/[^\t\r\n\f ]/.test(n.content)) {
        nodes[i] = null;
      } else {
        // 将制表符、回车、空格替换成文本空格
        n.content = n.content.replace(/[\t\r\n\f ]+/g, ' ')
      }
    }
  });
  // 剔除为null的节点
  return nodes.filter(Boolean);
}

// 标签是否到达终点
const isEnd = context => {
  const { source } = context;
  if (source.startsWith('</')) {
    return true;
  }
  return !source;
}

// 解析表达式插值
const parseInterpolation = context => {
  // 获取到开始位置
  const start = getCursor(context);
  // 跳过前两个 '{{' 
  const closeIndex = context.source.indexOf('}}', 2);
  if (closeIndex === -1) {
    // 没有找到结束标识，直接返回空
    console.warn('解析插值时出现异常，没有找到结尾 }}');
    return void 0;
  }

  // 前进忽略 '{{'
  advanceBy(context, 2);

  // 内容开始位置和结束位置
  const innerStart = getCursor(context);
  const innerEnd = getCursor(context);

  // 原始内容的长度
  const rawContentLength = closeIndex - 2;
  // 原始内容
  const rawContent = context.source.slice(0, rawContentLength);
  // 获取文本内容并更新信息
  const preTrimContent = parseTextData(context, rawContentLength);
  // 干掉里面的空格
  const content = preTrimContent.trim();
  // 从原始内容里找是否存在空格
  const startOffset = preTrimContent.indexOf(content);

  if (startOffset > 0) {
    // 更新位置信息
    advancePositionWithMutaition(innerStart, rawContent, startOffset);
  }
  // 内容结尾偏移量
  const endOffset = rawContentLength - (preTrimContent.length - content.length - startOffset);
  // 更新位置信息
  advancePositionWithMutaition(innerEnd, rawContent, endOffset);
  // 把最后的两个 '}}' 忽略掉
  advanceBy(context, 2);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      isStatic: false,
      content,
      constType: ConstantTypes.NOT_CONSTANT,
      loc: getSelection(context, innerStart, innerEnd)
    },
    loc: getSelection(context, start)
  }
}

// 删除文本到指定结束位置
const advanceBy = (context, endIndex) => {
  const { source } = context;
  // 更新 行、列、偏移
  advancePositionWithMutaition(context, source, endIndex);
  // 删掉指定字符串片段
  context.source = source.slice(endIndex);
}

// 解析文本数据，删除已解析过的字符片段
function parseTextData(context, endIndex) {
  // 取出源文本
  const rawText = context.source.slice(0, endIndex);
  // 删除截取的字符串
  advanceBy(context, endIndex);
  return rawText;
}

// 修改 行、列、偏移
const advancePositionWithMutaition = (context, source, endIndex) => {
  // 行位置
  let linesCount = 0, linePos = -1;

  for (let i = 0; i < endIndex; i++) {
    // 取出字符的 ASCII 码
    if (source.charCodeAt(i) === 10) {
      // 是换行符
      linesCount++;
      linePos = i;
    }
  }
  // 计算行数
  context.line += linesCount;
  // 计算列数
  context.column = linePos === -1 ? context.column + endIndex : endIndex - linePos;
  // 计算偏移量
  context.offset += endIndex;
}

// 解析标签
const parseTag = context => {
  // 开始位置
  const start = getCursor(context);
  // 匹配值
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source);
  // 标签名
  const tag = match[1];
  // 删除上下文标签名
  advanceBy(context, match[0].length);
  // 删除空格
  advanceSpaces(context);
  // 解析属性
  const props = parseAttributes(context);
  // 是否自闭和标签
  const isSelfClosing = context.source.startsWith('/>');
  // 删除关闭标签
  advanceBy(context, isSelfClosing ? 2 : 1);

  // 标签类型
  let tagType = ElementTypes.ELEMENT;
  if (tag === 'slot') {
    // 插槽
    tagType = ElementTypes.SLOT;
  } else if (tag === 'template') {
    if (props.some(p => p.type === NodeTypes.DIRECTIVE && isSpecialTemplateDirective(p.name))) {
      // 存在属于 if,else,else-if,for,slot 指令，该类型设置为模板
      tagType = ElementTypes.TEMPLATE;
    }
  } else if (isComponent(tag)) {
    // 组件
    tagType = ElementTypes.COMPONENT;
  }

  return {
    type: NodeTypes.ELEMENT,
    tag,
    props,
    tagType,
    isSelfClosing,
    children: [],
    loc: getSelection(context, start),
  };
}

// 解析元素
const parseElement = context => {
  // 解析标签
  const element = parseTag(context);
  if (element.isSelfClosing) {
    // 自闭合标签，无需解析子元素，直接返回
    return element;
  }

  // 解析子元素
  const children = parseChildren(context);

  // 再次忽略掉关闭标签
  if (context.source.startsWith('</')) {
    parseTag(context);
  }
  // 更新位置信息
  element.loc = getSelection(context, element.loc.start);
  // 挂载子节点
  element.children = children;
  return element;
}

// 解析文本
const parseText = context => {
  // 结束标志
  const endTokens = ['<', '{{'];
  // 结束下标
  let endIndex = context.source.length;

  for (let i = 0; i < endTokens.length; i++) {
    // 寻找结束位置
    let index = context.source.indexOf(endTokens[i], 1);
    if (index !== -1 && endIndex > index) {
      // 比上次循环的下标还小，意味着本次的结束标志 endTokens[i] 更靠前
      // 将结束下标改为当前下标
      endIndex = index;
    }
  }

  // 创建行列信息，获取游标
  const start = getCursor(context)
  // 取出内容
  const content = parseTextData(context, endIndex);

  return {
    type: NodeTypes.TEXT,
    content,
    loc: getSelection(context, start)
  };
}


// 是否组件
const isComponent = tag => {
  // 是否 组件、标签名从A-Z、核心组件、非原生标签
  return tag === 'component' || /^[A-Z]/.test(tag) || isCoreComponent(tag) || !isNativeTag(tag);
}

// 判断是否特殊模板指令
const isSpecialTemplateDirective = makeMap('if,else,else-if,for,slot');

// 删除空格
const advanceSpaces = context => {
  const match = /^[\t\r\n\f ]+/.exec(context.source);
  match && advanceBy(context, match[0].length);
}

// 解析属性
const parseAttribute = context => {
  // 开始位置
  const start = getCursor(context);
  // 正则匹配
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
  // 属性名
  const name = match[0];

  // 上下文删除属性名
  advanceBy(context, name.length);

  let value;
  // 删除 tab、回车、换行符、换页符 = ，及两边空格
  if (/^[\t\r\n\f ]*=/.test(context.source)) {
    advanceSpaces(context);
    advanceBy(context, 1);
    advanceSpaces(context);
    value = parseAttributeValue(context)
  }
  // 获取位置信息
  const loc = getSelection(context, start);
  // 若名称为 v-xxx、:xxx、.xxx、@xxx、#xxx 则处理
  if (/^(v-[A-Za-z0-9-]|:|\.|@|#)/.test(name)) {
    // 匹配：v-xxx、:xxx、.xxx、@xxx、#xxx 且不属于 [ ] ] 或 . 后面匹配任何字符
    const match = /(?:^v-([a-z0-9-]+))?(?:(?::|^\.|^@|^#)(\[[^\]]+\]|[^\.]+))?(.+)?$/i.exec(name);
    // 设置指令名称，将 : 设置为 bind、@设置为 on，否则就给 slot
    let dirName = match[1] ||
      (name.startsWith(':') ? 'bind' :
        name.startsWith('@') ? 'on' : 'slot');

    // 参数
    let arg;
    if (match[2]) {
      const isSlot = dirName === 'slot';
      // 取出内容
      let content = match[2];
      let isStatic = true;
      if (content.startsWith('[')) {
        // 中括号开头，这里就不是静态属性了
        isStatic = false;
        // 截取内容
        content = content.slice(1, content.length - 1);
      } else if (isSlot) {
        content += match[3] || '';
      }

      // 设置参数
      arg = {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content,
        isStatic,
        constType: isStatic ? ConstantTypes.CAN_STRINGIFY : ConstantTypes.NOT_CONSTANT,
        loc
      }
    }
    // 这种指令参数直接返回
    return {
      type: NodeTypes.DIRECTIVE,
      name: dirName,
      exp: value && {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: value.content,
        isStatic: false,
        constType: ConstantTypes.NOT_CONSTANT,
        loc: value.loc
      },
      arg,
      loc
    }
  }

  // 返回非指令属性值结构
  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: NodeTypes.TEXT,
      content: value.content,
      loc: value.loc
    },
    loc
  };
}

// 解析属性值
const parseAttributeValue = context => {
  // 开始位置
  const start = getCursor(context);
  // 文本内容
  let content;
  // 引号
  const quote = context.source[0];

  if (quote === "'" || quote === '"') {
    // 忽略当前引号
    advanceBy(context, 1);
    // 取出最后一个引号的索引，中间的就是值
    const endIndex = context.source.indexOf(quote);
    if (endIndex === -1) {
      // 取出文本源，继续向前推进
      content = parseTextData(context, context.source.length);
    }

    // 获取文本
    content = parseTextData(context, endIndex);
    // 忽略最后那个引号
    advanceBy(context, 1);
  } else {
    // 第0个非引号，可能有空格或tab字符
    const match = /^[^\t\r\n\f >]+/.exec(context.source);
    if (!match) {
      return void 0;
    }
    // 取出字符串并向前推进
    content = parseTextData(context, match[0].length);
  }
  return { content, loc: getSelection(context, start) };
}

// 解析属性集
const parseAttributes = context => {
  const props = [];

  // 源的长度必须大于0，并且还不能是元素结尾
  while (context.source.length > 0 && !context.source.startsWith('>') && !context.source.startsWith('/>')) {
    // 如果碰到 / 则直接推进一步，接着下一个循环看是否成立
    if (context.source.startsWith('/')) {
      advanceBy(context, 1);
      advanceSpaces(context);
      continue;
    }

    // 取出属性
    const prop = parseAttribute(context);
    // 写入集合
    props.push(prop);
    // 干掉空格
    advanceSpaces(context);
  }
  return props;
}