const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('set_permalink_by_index.js loaded');

function normalizePath(p) {
  return String(p || '')
    .replace(/\\/g, '/')
    .normalize('NFC');
}

function loadIndexData() {
  const indexPath = path.join(hexo.base_dir, 'passage_index.json');
  if (!fs.existsSync(indexPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
}

function resolvePossibleSources(data) {
  const result = [];
  if (data.full_source) {
    result.push(data.full_source);
  }
  if (data.source) {
    if (path.isAbsolute(data.source)) {
      result.push(data.source);
    } else {
      result.push(path.join(hexo.source_dir, data.source));
      result.push(path.join(hexo.base_dir, 'source', data.source));
      result.push(path.join(hexo.base_dir, data.source));
    }
  }
  return result.map(normalizePath);
}

function findPostIndexMatch(indexData, data) {
  if (!indexData || !Array.isArray(indexData.posts)) return null;
  const candidates = new Set(resolvePossibleSources(data));
  return indexData.posts.find(p => candidates.has(normalizePath(p.path))) || null;
}

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
  const indexData = loadIndexData();
  if (!indexData) {
    console.log('passage_index.json 不存在');
    return data;
  }
  const match = findPostIndexMatch(indexData, data);
  if (match) {
    data.id = String(match.id);
    console.log('分配id:', match.id, '->', data.full_source);
  } else {
    console.log('未匹配到 passage_index:', data.full_source || data.source);
  }
  return data;
});

// 强制使用我们分配的数字索引作为文章的 permalink
hexo.extend.filter.register('post_permalink', function(data) {
  const indexData = loadIndexData();
  if (!indexData) return;
  try {
    const match2 = findPostIndexMatch(indexData, data);
    if (match2) {
      console.log('为文章设置permalink:', match2.id, '->', data.full_source || data.source);
      return `article/${String(match2.id)}.html`;
    }
    console.log('post_permalink 未匹配:', data.full_source || data.source);
  } catch (e) {
    console.error('post_permalink 错误', e);
  }
});
