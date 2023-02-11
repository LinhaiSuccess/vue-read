/*******************************************************************************
 * File: /examples/compiler-dom/js/parse.js
 * Project: vue
 * Created Date: 2023-02-11
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 解析测试
*******************************************************************************/

import { baseParse } from '../../../dist/vue.esmodule.js';

export default () => {
  parseTest();
}

// 解析测试
function parseTest() {
  const template = `
    <Layout :show="true">
      <input type="text" v-model="name"/>
      <span v-if="flag">{{名称}}</span>
      <ul>
        <li v-for="item in items" :key="item.id">{{item.name}}</li>
      </ul>
      <button @click="submit()">提交</button>
      </br>
      <span :style="{ fontSize: '30px', color: 'red' }">结束标签</span>
    </Layout>
  `;
  const ast = baseParse(template);
  console.log('ast=', ast);
}