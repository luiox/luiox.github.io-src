# Canrad's blog src

因为一个仓库存两个内容，我老是会提交失败，所以源码和网页分开了。



## hexo-admin

这个是用来管理hexo的，因为手动创建文件太麻烦了，输入命令很很麻烦。

启动命令

```shell
hexo server -d
```

管理后台的页面：[http://localhost:4000/admin/](http://localhost:4000/admin/)



## 基础指令
```shell
hexo new "postName" 新建文章
hexo new page "pageName" 新建页面
hexo generate 生成静态页面至public目录
hexo server 开启预览访问端口（默认端口4000，'ctrl + c'关闭server）
hexo deploy 将.deploy目录部署到GitHub
hexo help 查看帮助
hexo version 查看Hexo的版本
```


//    "hexo-abbrlink": "^2.2.1",

```_config.yml
permalink: :abbrlink.html
abbrlink:
alg: crc32
rep: dec

```

