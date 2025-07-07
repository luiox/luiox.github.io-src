const fs = require('fs');
const path = require('path');

console.log('set_permalink_by_index.js loaded');

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
