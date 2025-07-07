---
title: hexo文章索引方案
author: Canrad
date: 2025-07-07 17:43:01
tags: Daily
---

今天是2025年7月7日，我想起来我还有一个Hexo的blog。于是，我就打开，想着写点什么。之前，因为中文的文章标题，在URL内会很长很长，这一分享给别人，里面还带上日期啥的，非常长。其次，如果标题一改，之前的链接直接失效了，这样子非常不好，还是需要一个稳定的链接，另外就是要短。

于是，我就尝试使用`hexo-abbrlink`这个插件来做索引，这个插件是基于文章标题做crc啥的，然后计算出来一串数字，不过，我觉得这个方案不是很好。因为这串数字没什么含义，而且如果修改了它依赖的值，那么就破坏了这串数字。并且`hexo-abbrlink`这个插件有一定的侵入性，它会在每个markdown文件里面，塞进去一个`abbrlink:xxxxxxxx`这样子的东西，非常恶心。



## 索引生成

于是，我就在想，是否可以为每个文章分配一个ID，这样子就解决了文章的URL过长的问题。其次，就是要保证这个ID的唯一性和不变性，所以最好的方案就是用一个递增的索引。因此，我决定使用json作为数据存储的个数，我构造一个`passage_index.json`文件来存储，已经分配的文章的ID和下一个索引，这样子我不会每次重新分配索引，而是基于上一次的下一个索引分配给没有分配索引的文章。

因此，我写了一个`generate_passage_index.js`，它的作用是生成这个`passage_index.json`文件。这样子，如果需要重新建立索引，那么只需要把这个`passage_index.json`文件删除即可，而且会根据文章里面的`date`字段进行升序排序，也就是更老的文章的索引会小一些。

```js
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const POSTS_DIR = path.join(__dirname, 'source', '_posts');
const INDEX_FILE = path.join(__dirname, 'passage_index.json');

function getAllPostFiles(dir) {
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(dir, f));
}

function getPostDate(file) {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    const fm = matter(content);
    // 兼容 date 字段不存在的情况
    return fm.data.date ? new Date(fm.data.date) : new Date(0);
  } catch {
    return new Date(0);
  }
}

function loadIndex() {
  if (!fs.existsSync(INDEX_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

function saveIndex(indexObj) {
  fs.writeFileSync(INDEX_FILE, JSON.stringify(indexObj, null, 2), 'utf-8');
}

function main() {
  const postFiles = getAllPostFiles(POSTS_DIR);
  let indexObj = null;
  if (fs.existsSync(INDEX_FILE)) {
    // passage_index.json 存在，只为新增文章分配索引
    indexObj = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
    const knownPaths = new Set(indexObj.posts.map(p => p.path));
    let changed = false;
    postFiles.forEach(file => {
      const normPath = file.replace(/\\/g, '/');
      if (!knownPaths.has(normPath)) {
        indexObj.posts.push({ path: normPath, id: String(indexObj.next_index) });
        indexObj.next_index++;
        changed = true;
      }
    });
    if (changed) {
      saveIndex(indexObj);
      console.log('已为新文章分配索引');
    } else {
      console.log('无新增文章，无需更新索引');
    }
    return;
  }
  // passage_index.json 不存在，全部重建
  // 读取所有文章的 date
  const postsWithDate = postFiles.map(file => ({
    path: file.replace(/\\/g, '/'),
    date: getPostDate(file),
  }));
  // 按 date 升序排序
  postsWithDate.sort((a, b) => a.date - b.date);
  // 重新分配索引
  indexObj = { next_index: postsWithDate.length + 1, posts: [] };
  postsWithDate.forEach((post, i) => {
    indexObj.posts.push({ path: post.path, id: String(i + 1) });
  });
  saveIndex(indexObj);
  console.log('索引已按 date 字段重建');
}

main();
```



## 控制hexo的页面生成

hexo页面的索引是通过`_config.yml`的`permalink`控制的。因此，我设置为下面这样子。

```yaml
permalink: article/:id.html
```

并且，需要在hexo的博客项目的根目录下建一个`scripts`目录。然后加一个`set_permalink_by_index.js`负责控制这个链接的生成。因为之前的`generate_passage_index.js`这个脚本，我是放在根目录下的，因为这个需要先运行，然后才能运行设置链接的脚本，我用了一个比较笨的方法。那就是在`set_permalink_by_index.js`里面运行那个生成索引的脚本，这样子就可以保证顺序了。

下面是`set_permalink_by_index.js`这个脚本的内容，主要就是利用hexo的过滤器接口来控制。参考：[https://hexo.io/zh-cn/api/filter](https://hexo.io/zh-cn/api/filter)。

```js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('set_permalink_by_index.js loaded');

// 运行生成索引的脚本
hexo.extend.filter.register('before_generate', function() {
  const scriptPath = path.join(hexo.base_dir, 'generate_passage_index.js');
  try {
    execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
    console.log('已自动运行 generate_passage_index.js');
  } catch (e) {
    console.error('自动运行 generate_passage_index.js 失败', e);
  }
});

// 修改文章的链接
hexo.extend.filter.register('before_post_render', function(data) {
  const indexPath = path.join(hexo.base_dir, 'passage_index.json');
  if (!fs.existsSync(indexPath)) {
    console.log('passage_index.json 不存在');
    return data;
  }
  const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  const norm1 = data.full_source.replace(/\\/g, '/');
  const match = indexData.posts.find(p => {
    const norm2 = p.path.replace(/\\/g, '/');
    return norm1 === norm2;
  });
  if (match) {
    data.id = String(match.id);
    console.log('分配id:', match.id, '->', data.full_source);
  } else {
    console.log('未匹配到 passage_index:', data.full_source);
  }
  return data;
});
```
