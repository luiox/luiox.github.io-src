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

// 强制使用我们分配的数字索引作为文章的 permalink
hexo.extend.filter.register('post_permalink', function(data) {
  const indexPath = path.join(hexo.base_dir, 'passage_index.json');
  if (!fs.existsSync(indexPath)) return;
  try {
    const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    // 尝试确定文章的完整源文件路径（有些阶段 data 没有 full_source）
    let full = data.full_source || null;
    if (!full && data.source) {
      full = path.isAbsolute(data.source) ? data.source : path.join(hexo.base_dir, data.source);
    }
    if (!full) {
      // 无法确定源文件，跳过
      return;
    }
    const norm1 = String(full).replace(/\\/g, '/');
    const match2 = indexData.posts.find(p => p.path.replace(/\\/g, '/') === norm1);
    if (match2) {
      console.log('为文章设置permalink:', match2.id, '->', full);
      return `article/${String(match2.id)}.html`;
    }
  } catch (e) {
    console.error('post_permalink 错误', e);
  }
});
