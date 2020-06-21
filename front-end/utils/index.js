/*
 * @Author: bucai
 * @Date: 2020-05-07 13:05:39
 * @LastEditors: bucai
 * @LastEditTime: 2020-06-20 17:00:32
 * @Description: 
 */

const md = require('markdown-it')()
  .use(require('markdown-it-highlightjs'));
export const markdown = (content) => {
  const resRender = md.render(content || '');
  return resRender;
}

export const markdownRender = (htmlStr) => {
  const container = document.createElement('div');
  container.innerHTML = htmlStr;
  const hns = [...container.querySelectorAll('h2,h3,h4,h5,h6')];
  const menus = [];
  hns.forEach((item, i) => {
    var tag = item.localName;
    item.setAttribute('id', 'wow' + i);
    menus.push({
      type: tag,
      target: '#wow' + i,
      title: item.innerText,
    });
  });
  return {
    html: container.innerHTML,
    menus
  }
}
