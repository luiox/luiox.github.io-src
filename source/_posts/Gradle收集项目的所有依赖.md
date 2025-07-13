---
title: Gradle收集项目的所有依赖
date: 2025-07-13 14:42:51
tags: Daily
---

我今天早上想起来，之前那个混淆器的Library问题还没有解决。于是就着手开始解决这个收集项目内所有依赖的问题。这里记录一下解决方案。



## 产生问题的原因

因为Jar的混淆器，这个玩意在混淆的时候需要分析依赖，我最早以前一开始接触到Proguard的时候不能理解为什么要我添加这个Jar的依赖库。后面遇到一些不需要加入依赖库的混淆器，但是我也搞不懂为什么这个就不需要依赖库。

后来，我捣鼓了一下asm库，终于搞明白是怎么一回事了。核心原因在于asm库的`ClassWriter`在写出`ClassNode`到`byte[]`的时候，需要计算栈帧，于是乎就有一个需求，那就是拿到两个类的公共父类名字，即`getCommonSuperClass`方法的实现。在默认的`ClassWriter`实现下，是通过`ClassLoader`和`Class.forName`拿到对应类的`Class<?>`对象，但是问题是，我们一个被分析的Jar内的类用的那些类不一定已经被混淆器加载进Jvm，所以写出的时候会爆一堆`ClassNotFoundException`的问题。

于是乎就有两种解决方案，不过都需要收集这个Jar所需的所有依赖。这也是为什么不管是混淆器还是优化器，都需要加入依赖库的原因。



## Kotlin DSL的解决方案

因为我Gradle常用的是Kotlin DSL，所以先提供一个这个的解决方案。我是创建一个`Copy`的任务，把编译和运行时的依赖都添加进来，然后复制依赖到`build/dep`这个目录里面，只需要运行一下就可以解决了。

```kotlin
val copyDependencies = tasks.register<Copy>("copyDependencies") {
    description = "Copy all compile and runtime dependencies to dep directory"
    group = "build"

    // 获取所有编译和运行时依赖
    from(configurations.compileClasspath.get().files)
    from(configurations.runtimeClasspath.get().files)

    // 目标目录
    into(layout.buildDirectory.dir("dep"))

    // 避免重复文件
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE

    // 只复制jar文件
    include("*.jar")
}
```



## Groovy的解决方案

因为写Minecraft的Mod的情况下，常用的是Groovy，所以也给出一个解决方案。原因是，Minecraft这玩意有映射的问题，所以，我们如果是混淆器混淆的话，需要原始的Jar，也就是没有被yarn映射到可读名称的那个版本的Jar依赖。为了方便，我就把所有的Jar都添加进来。一开始，我就多加了一个`modImplementation`的依赖，但是我发现不会自动加Minecraft本体的Jar，于是又加了一个自动搜索依赖的，原因是，这个不能直接通过`minecraft`的那个配置拿到，它不开放给我们。

因此，我就写了递归搜索目录的代码。我们假定Gradle存放依赖的是`user.home`，一般来说大部分人不会去改。如果有改动，自行修改`minecraftOriginalJarDir`相关代码即可。

```groovy
tasks.register('copyDependencies', Copy) {
    description = "Copy all compile and runtime dependencies to dep directory"
    group = "build"

    // 获取所有编译和运行时依赖
    from configurations.compileClasspath.files
    from configurations.runtimeClasspath.files
    // 拿到modImplementation的依赖
    from configurations.modImplementation.files
    // 拿Minecraft的本体jar
    def userHome = System.getProperty('user.home')
    def minecraftOriginalJarDir = userHome + "/.gradle/caches/fabric-loom/minecraftMaven/net/minecraft/minecraft-merged-intermediary"
    def mcOriginalJarDir = file(minecraftOriginalJarDir)
    if (mcOriginalJarDir.exists()) {
        from(mcOriginalJarDir) {
            include '**/*.jar'
            eachFile { fileCopyDetails ->
                fileCopyDetails.relativePath = new RelativePath(true, fileCopyDetails.name)
            }
            includeEmptyDirs = false
        }
    }

    // 目标目录
    into layout.buildDirectory.dir("dep")

    // 避免重复文件
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE

    // 只复制jar文件
    include "*.jar"
}
```

