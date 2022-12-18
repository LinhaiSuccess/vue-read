/*
 * File: /normalizeProp.ts
 * Project: @vue/shared
 * Created Date: 2022-12-18
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 正常化属性
 */

import { isArray, isObject, isString } from './';
// 根据 ; 号分割
const listDelimiterRE = /;(?![^(]*\))/g;
// 根据 : 号分割
const propertyDelimiterRE = /:(.+)/;

// 解析字符串样式，将字符串样式转换为对象
export const parseStringStyle = cssText => {
    const ret = {};
    // 通过分号将字符串样式分割并遍历
    cssText.split(listDelimiterRE).forEach(item => {
        if (item) {
            // 通过冒号分割
            const tmp = item.split(propertyDelimiterRE);
            // 如果分割出的是2个元素，则0号为key，1号为值
            tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
        }
    })
    return ret;
}

// 正常化 class
export const normalizeClass = value => {
    let res = '';
    if (isString(value)) {
        // 如果是 string 直接赋值即可
        res = value;
    } else if (isArray(value)) {
        // 是数组，手动格式化（空格隔开）
        for (let i = 0; i < value.length; i++) {
            // 递归格式化
            const normalized = normalizeClass(value[i]);
            if (normalized) {
                // 空格拼接起来
                res += normalized + ' ';
            }
        }
    } else if (isObject(value)) {
        // 是对象，如果值为 true 则将 name 空格拼接
        for (const name in value) {
            if (value[name]) {
                res += name + ' ';
            }
        }
    }
    return res.trim();
}

// 正常化 style
export const normalizeStyle = value => {
    if (isArray(value)) {
        // 是数组，递归解析
        const res = {};
        for (let i = 0; i < value.length; i++) {
            const item = value[i];
            // 如果是String则解析String，否则递归正常化每一项
            const normalized = isString(item) ? parseStringStyle(item) : normalizeStyle(item);
            if (normalized) {
                for (const key in normalized) {
                    // 写入
                    res[key] = normalized[key];
                }
            }
        }
        return res;
    } else if (isString(value)) {
        return value;
    } else if (isObject(value)) {
        return value;
    }
}

