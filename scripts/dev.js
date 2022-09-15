/*******************************************************************************
 * File: /scripts/dev.js
 * Project: vue-read
 * Created Date: 2022-09-15
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 开发启动脚本
 * Description: 根据用户配置的参数决定打包哪个模块并通过 esbuild 打包
*******************************************************************************/

// 引入 esbuild 和 路径模块
const { build } = require('esbuild');
const { resolve } = require('path');

// 通过 minimist 从进程参数中获取到
// args 的值，如：{ _: [ 'reactivity' ], f: 'global' }
const args = require('minimist')(process.argv.splice(2));

// 获取打包模板，如果没有则默认 vue
const target = args._[0] || 'vue';
// 获取打包格式，是 esmodule 还是 commonjs 还是 global 全局？
const format = args.f || 'esmodule';
// 获取要打包的 package.json 文件
const pkg = require(resolve(__dirname, `../packages/${target}/package.json`));
// 根据模块格式定义输出格式，如 立即执行函数、CommonJS、ES Module（默认 ES Module ）
const outputFormat = format.startsWith('global') ? 'iife' : format === 'cjs' ? 'cjs' : 'esm';
// 输出文件，将文件输出到当前模块中， 格式：模块名.输出格式.js，如：reactivity.global.js
const outfile = resolve(__dirname, `../packages/${target}/dist/${target}.${format}.js`);

// 使用 esbuild 打包
build({
  // 指定打包目标入口文件
  entryPoints: [resolve(__dirname, `../packages/${target}/src/index.ts`)],
  // 输出的文件
  outfile,
  // 把所有包全部打包到一起
  bundle: true,
  // 启用 sourcemap
  sourcemap: true,
  // 打包的格式
  format: outputFormat,
  // 要打包的全局名称
  globalName: pkg.buildOptions.name,
  // 平台：是 node 还是 浏览器
  platform: format === 'cjs' ? 'node' : 'browser',
  watch: {    // 监听文件变化
    onRebuild(error) {
      if (!error) {
        console.log('rebuild complete...');
      }
    }
  }
}).then(() => console.log('watching complete...'));