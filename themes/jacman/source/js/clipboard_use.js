document.addEventListener('DOMContentLoaded', function() {
    // 为每个代码块添加复制按钮
    document.querySelectorAll('.article-content .highlight').forEach(function(codeBlock) {
        var button = document.createElement('button');
        button.className = 'copy-button';
        button.textContent = '复制';
        button.title = '复制代码';
        button.addEventListener('click', function() {
            // 使用Clipboard.js复制代码块的内容到剪贴板
            var clipboard = new ClipboardJS(button, {
                text: function(trigger) {
                    // 找到按钮所在的代码块
                    var codeBlock = trigger.closest('.highlight');
                    // 获取所有的<pre>元素
                    var preElements = codeBlock.querySelectorAll('pre');
                    // 返回第二个<pre>元素的innerText
                    return preElements[1].innerText;
                }
            });
            
            clipboard.on('success', function(e) {
                //alert('代码复制成功');
                e.clearSelection();
                // 显示“复制成功”
                button.textContent = '复制成功';
                // 5秒后恢复为“复制”
                setTimeout(function() {
                    button.textContent = '复制';
                }, 5000);
            });
            clipboard.on('error', function(e) {
                //alert('代码复制失败');
                e.clearSelection();
                // 显示“复制成功”
                button.textContent = '复制失败';
                // 5秒后恢复为“复制”
                setTimeout(function() {
                    button.textContent = '复制';
                }, 5000);
                });
        });
        codeBlock.insertBefore(button, codeBlock.firstChild);
    });
});


//$(".highlight").wrap("<div class='code-wrapper' style='position:relative'></div>");
///*页面载入完成后，创建复制按钮*/
//!function (e, t, a) {
//    /* code */
//    var initCopyCode = function () {
//        var copyHtml = '';
//        copyHtml += '<button class="btn-copy" data-clipboard-snippet="">';
//        copyHtml += '  <i class="fa fa-clipboard"></i><span>复制</span>';
//        copyHtml += '</button>';
//        /* $(".highlight .code").before(copyHtml); */
//
//        /* $(".code-wrapper .highlight table").before(copyHtml); */
//        $(".code-wrapper figure.highlight").before(copyHtml);
//        var clipboard = new ClipboardJS('.btn-copy', {
//            target: function (trigger) {
//                var tablee = trigger.nextElementSibling;
//               <!--  return trigger.nextElementSibling; -->
//                return tablee.firstElementChild.firstElementChild.firstElementChild.nextElementSibling;
//            }
//        });
//        clipboard.on('success', function (e) {
//            e.trigger.innerHTML = "<i class='fa fa-clipboard'></i><span>复制成功</span>"
//            setTimeout(function () {
//                e.trigger.innerHTML = "<i class='fa fa-clipboard'></i><span>复制</span>"
//            }, 1000)
//           
//            e.clearSelection();
//        });
//        clipboard.on('error', function (e) {
//            e.trigger.innerHTML = "<i class='fa fa-clipboard'></i><span>复制失败</span>"
//            setTimeout(function () {
//                e.trigger.innerHTML = "<i class='fa fa-clipboard'></i><span>复制</span>"
//            }, 1000)
//            e.clearSelection();
//        });
//    }
//    initCopyCode();
//}(window, document);