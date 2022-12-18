/*
 * File: /src/utils/sequence.ts
 * Project: @vue/runtime-core
 * Created Date: 2022-12-18
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 最长递增子序列
 * Description: 最长递增子序列使用了 贪心算法 和 二分查找
 */

export function getSequence(arr) {
  // 数组长度
  const len = arr.length;
  // 默认以第0个做基准（注意：这里存放的是索引）
  const result = [0];
  // 前索引数组
  const p = new Array(len).fill(0);
  // 保存结果集中最后一项
  let resultLastIndex;

  // 二分查找的 开头 和 结尾 还有 二分查找的中间数
  let start, end, middle;

  for (let i = 0; i < len; i++) {
    // 当前项
    const item = arr[i];

    // 忽略0，因为0代表未对比过
    if (item !== 0) {
      // 获取结果集中最后一项
      resultLastIndex = result[result.length - 1];

      if (arr[resultLastIndex] < item) {
        // 数组中 result 最后一项索引的值比当前项小，意味着当前项的值，比 result 最后一项索引对应的值大
        // 这时候就把当前索引追加到 result 中
        result.push(i);
        // 保存前索引
        p[i] = resultLastIndex;
        // 这是最优的情况，继续对比下一个
        continue;
      }

      // 在结果集中找到比当前值大的，用当前值的索引将其替换掉
      start = 0;
      // 结尾为数组长度 - 1（指定到数组最后一项）
      end = result.length - 1;
      // 当 start = end 时停止
      while (start < end) {
        // 取中间索引 (start + end) / 2 会得到中间数，因为可能是小数，所以通过 | 0 会向下取整
        middle = ((start + end) / 2) | 0;
        // 通过中间索引去 result 中取值，取出的值是 arr 的索引，所以根据 arr 的索引去 arr取值
        // 取出后 和 当前项 对比
        // 如果取出的值 小于 当前项，就往右边走，否则就往左边走
        if (arr[result[middle]] < item) {
          start = middle + 1;
        } else {
          // 当前插针位置的值比选择项还要大，比如是 2，去左边寻找
          end = middle;
        }
      }

      // 注意：上面的循环什么时候出来？条件是：当 start = end 时停止
      // 也就是说当走到这边的时候，start 和 end 的值就相等了
      // 根据 end 的值当做索引，从 result 中取出值，再根据 result 的值当索引从 arr 中取值
      // 看 arr 中的值是否 > item，如果 大于 item，则用当前值替换掉 result 比它大的值
      if (arr[result[end]] > item) {
        result[end] = i;
        // 替换时，被替换的前索引也需要继承
        p[i] = result[end - 1];
      }
    }
  }

  // 这里的目的就是 后往前追溯 ，将 result 返回值修正
  // 通过 result 从后往前追溯
  let i = result.length;
  // 获取 result 最后一个值（因为最后一个值索引是确定的）
  let last = result[i - 1];
  // 当 i > 0 时循环
  while (i-- > 0) {
    // 替换源索引
    result[i] = last;
    // 获取前索引给last
    last = p[last];
  }
  return result;
}
