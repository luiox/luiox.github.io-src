---
title: SeggerRTT与Ozone调试技术
date: 2026-03-02 11:09:34
tags: Embedded
---

介绍SEGGER RTT在vscode上，使用Cortex Debug作为观测RTT数据，然后使用Ozone实现观测变量变化的方案。

# RTT

## 什么是RTT，为什么使用SEGGER RTT而不是串口打印调试程序

SEGGER RTT，全称是SEGGER  Real Time Transfer。RTT本质上是在程序中开一个环形缓冲区，打印时数据写入该区域，调试器通过SWD接口读取缓冲区，并由RTT客户端显示，因此无需额外硬件资源。而且不同于传统的半主机模式依赖于等待调试器，RTT的数据在没有被读取的时候，依旧会被覆盖，因为MCU不会等待调试器，所以即便是去掉调试器，依然没有任何影响。因为它仅仅需要内存写入数据，而无需像串口打印一样等待数据发出，这就做到了对程序的侵入性最低。

因为RTT仅仅是软件层面的协议，而且走的是标准SWD接口，即便是SEGGER RTT一开始是为jlink设计的，但是支持SWD接口的调试器（如DAPLink、ST-Link）也能使用RTT。



## 如何获得SEGGER RTT的源码

在官网https://www.segger.com/downloads/jlink/#J-LinkSoftwareAndDocumentationPack这个链接下，按照jlink驱动，然后在路径`SEGGER\JLink\Samples\RTT`这个目录下有一个压缩包，叫做`SEGGER_RTT_V722b.zip`，然后打开以后，在RTT目录内有下面这个文件列表的文件。

```text
SEGGER_RTT.c
SEGGER_RTT.h
SEGGER_RTT_ASM_ARMv7M.S
SEGGER_RTT_Conf.h
SEGGER_RTT_printf.c
```

我们不要这个`SEGGER_RTT_ASM_ARMv7M.S`文件。把剩余的这些都添加进项目即可。



## 使用RTT打印，并且在Cortex Debug上查看

RTT在代码上的使用方法主要是有下面这两个函数。这个`SEGGER_RTT_Init`在程序一开始初始化一下RTT即可。而`SEGGER_RTT_printf`和`printf`在使用方法上唯一的区别就是第一个参数是一个索引。一般来说就填0，也就是终端输出。这个索引是目标的缓冲区的索引。

```c
void SEGGER_RTT_Init(void);
int SEGGER_RTT_printf(unsigned BufferIndex, const char * sFormat, ...);
```

然后Cortex Debug插件的配置我就不重复了，依旧是要准备好OpenOCD的配置。`setting.json`的配置参考如下。关键是`"cortex-debug.openocdPath"`这个需要配置好。

```text
    "cortex-debug.liveWatchRefreshRate": 100,
    "cortex-debug.armToolchainPath": "D:/sdk/Arm GNU Toolchain arm-none-eabi/11.3 rel1/bin",
    "cortex-debug.openocdPath": "D:/sdk/OpenOCD/bin/openocd.exe",
```

因为Cortex Debug插件在2022年就已经支持RTT了，也不需要网上那些教程改cfg文件的方案了。关于这一点的详细信息可以查看https://github.com/Marus/cortex-debug/wiki/SEGGER-RTT-support。

当然不看也没有问题，我们主要是要配置项目目录下的`.vscode/launch.json`文件即可。下面我给出一个典型配置。有几点要注意的，我都加了注释了。`${workspaceRoot}`是你工作区的路径的变量，使用这个相对定位，而不是写绝对路径。

```text
{
    // 启动调试的快捷键是F5
    "version": "0.2.0",
    "configurations": [
        {
        	// 启动项的名字
            "name": "Launch bootloader (DAP)",
            "cwd": "${workspaceRoot}",
            // 把这个executable的路径改成你的elf或者axf文件的路径
            "executable": "${workspaceRoot}\\build\\artifacts\\bootloader.elf",
            "request": "launch",
            "type": "cortex-debug",
            // 写你的MCU型号
            "device": "STM32F103RC",
            "interface": "swd",
            "servertype": "openocd",
            // 配置文件
            "configFiles": [
            	// 如果是stlink v2就改为interface/stlink-v2.cfg
                "interface/cmsis-dap.cfg",
                // 根据型号选择你的cfg
                "target/stm32f1x.cfg"
            ],
            "runToEntryPoint": "main",
            // preLaunchTask这个是一个在这个启动之前的任务，如果你不需要可以删除
            "preLaunchTask": "build bootloader",
            "liveWatch": {
                "enabled": true,
                "samplesPerSecond": 4
            },
            // 添加以下 RTT 配置
            "rttConfig": {
                "enabled": true,
                "address": "auto",
                "clearSearch": false,
                "decoders": [
                    {
                    	// 这个label标签是在打开RTT以后终端的名字，不写就是默认的
                        "label": "",
                        // 这个port就是对应你的SEGGER_RTT_printf的第一个参数
                        "port": 0,
                        "type": "console"
                    }
                ]
            }
        }
    ]
}
```

每次复制粘贴到一个新项目，主要要改的项目我列了一个表格。如果你不需要这个`preLaunchTask`，你可以把这行删掉，这样子就不会出错了。代价就是，你每次烧录之前都需要自己先构建，保证程序文件是最新的。
```text
name
executable
device
configFiles
preLaunchTask
```

然后我再解释这个`preLaunchTask`的作用，一般来说，Keil不都是要先构建再下载嘛，那么为了方便，让它自己在烧录程序之前构建一下。这个需要利用vscode的任务系统，在`.vscode`路径下建一个`tasks.json`文件内容像是下面这样子写。

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "build bootloader",
            "type": "shell",
            "command": "xmake f -p cross -a arm -m debug && xmake build bootloader",
            "problemMatcher": [],          
            "group": {
                "kind": "build",
                "isDefault": true
            }
        }
    ]
}
```

我这个是xmake的构建的，如果是cmake或者makefile，请自行修改`command`填入构建命令。

然后你使用vscode的`Run and Debug`页面启动，它就会自己先编译然后烧录了。运行以后，会单独开一个RTT的终端，显示这些信息。



## 不烧录仅附加调试的方法

`launch.json`的配置如下。

```json
{
    "name": "Attach bootloader (DAP)",
    "cwd": "${workspaceRoot}",
    "executable": "${workspaceRoot}\\build\\artifacts\\bootloader.elf",
    "request": "attach",
    "type": "cortex-debug",
    "device": "STM32F103RC",
    "interface": "swd",
    "servertype": "openocd",
    "configFiles": [
        "interface/cmsis-dap.cfg",
        "target/stm32f1x.cfg"
    ],
    "liveWatch": {
        "enabled": true,
        "samplesPerSecond": 4
    },
    "rttConfig": {
        "enabled": true,
        "address": "auto",
        "clearSearch": false,
        "decoders": [
            {
                "label": "",
                "port": 0,
                "type": "console"
            }
        ]
    }
},
```



# Ozone

Ozone是一个SEGGER给jlink开发的软件，当然因为一些特殊原因，所以daplink也能用。关于这个软件的安装可以参考[https://gitee.com/hnuyuelurm/basic_framework/blob/master/.Doc/VSCode%2BOzone%E4%BD%BF%E7%94%A8%E6%96%B9%E6%B3%95.md#ozone%E5%8F%AF%E8%A7%86%E5%8C%96%E8%B0%83%E8%AF%95%E5%92%8Clog%E5%8A%9F%E8%83%BD](https://gitee.com/hnuyuelurm/basic_framework/blob/master/.Doc/VSCode%2BOzone%E4%BD%BF%E7%94%A8%E6%96%B9%E6%B3%95.md#ozone%E5%8F%AF%E8%A7%86%E5%8C%96%E8%B0%83%E8%AF%95%E5%92%8Clog%E5%8A%9F%E8%83%BD)。

他这个教程已经很详细了，我就简单总结一下，Ozone我们一般是只用他的数据采样和绘制曲线图的功能。方便PID参数整定。

注意一点，所以要被采样的变量必须是全局变量，因为局部变量没有一个固定地址。选中要观测的变量，然后按`ctrl+w`即可添加进`watch`，然后在`watch`上选中，按`ctrl+g`就可以加进绘图的`Timeline`窗口。

