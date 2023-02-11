/*
 * File: /src/domTagConfig.ts
 * Project: @vue/shared
 * Created Date: 2023-02-11
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 元素标签配置文件
 */

import { makeMap } from './makeMap';

// HTML原生标签
const HTML_TAGS =
  'html,body,base,head,link,meta,style,title,address,article,aside,footer,' +
  'header,h1,h2,h3,h4,h5,h6,nav,section,div,dd,dl,dt,figcaption,' +
  'figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code,' +
  'data,dfn,em,i,kbd,mark,q,rp,rt,ruby,s,samp,small,span,strong,sub,sup,' +
  'time,u,var,wbr,area,audio,map,track,video,embed,object,param,source,' +
  'canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td,' +
  'th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup,' +
  'option,output,progress,select,textarea,details,dialog,menu,' +
  'summary,template,blockquote,iframe,tfoot';

// 是否HTML原生标签
export const isHTMLTag = makeMap(HTML_TAGS);
// 是否本地标签
export const isNativeTag = (tag) => isHTMLTag(tag);