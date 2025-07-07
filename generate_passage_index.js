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
