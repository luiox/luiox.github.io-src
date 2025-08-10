---
title: 解决Keil编译速度过慢的问题
author: Canrad
date: 2025-08-06 11:51:07
tags: Embedded
---

## mspc manager占用CPU问题

前段时间，我遇到一个情况是，Keil原本编译程序的速度还是比较快的，但是一夜之间就很慢。原本一分钟不到就可以全量编译，但是后面就需要5分钟以上，而且还有可能会未响应。

于是，我就在编译的时候，打开任务管理器，然后就发现了是一个叫做`微软电脑管家`的东西的CPU占用率很高。在详细信息下是叫做`mspcmanager`的东西，对应是一个自启动的`MSPCManager Service`服务，直接结束进程没什么用。只能是在Windows11的设置里面卸载这个`Microsoft PC Manager`。如果卸载不掉，就得用[UninstallITool](https://uninstall-tools.com/)这个工具。

微软官家这玩意本质上就是个杀毒软件一样的作用，只要是杀毒软件，都有可能影响到编译速度。因为会有监控。



## 并行编译参数

Keil5是有并行编译的，在菜单开始的`Edit -> Configuration -> Other -> Parallel Build Configuration`这个里面，不要禁用并行编译，然后就是并行编译数量`Number of parallel jobs`尽可能拉到最大。



## 编译器选择

编译器选择是在`Option for target`（魔术棒）的`Target`里面的，就是`ARM Compiler`这个东西，尽可能使用`v6`，因为这个比较快。但是注意的是，`CubeMX`生成的`FreeRTOS`还不支持，可以参考[https://blog.csdn.net/tytyvyibijk/article/details/125589038](https://blog.csdn.net/tytyvyibijk/article/details/125589038)这篇文章来适配。



## 编译器选项

编译器选项是在`Option for target`的`C/C++`里面，对于非最终版本的情况下，也就是开发代码的情况下。`Optimization`这个优化等级调到`-O0`，其次是`Link-Time Optimization`这个链接时候优化也不要开。`Execute-only Code`也不要开，这个功能是裁剪掉不运行的代码，但是会让编译时间变长。`One ELF Section per Function`要开，因为没有这个优化的话，有可能编译出来的程序过大。
