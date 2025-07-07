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
