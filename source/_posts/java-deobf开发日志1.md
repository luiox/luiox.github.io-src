---
title: java deobf开发日志1
author: Canrad
date: 2025-06-12 20:36:50
tags: java
---



说明：这篇文章仅仅是记录deobf的transformer的开发，或者算是一个小教程。代码存储在[https://github.com/luiox/jvm-things-archieve/blob/main/morpher-plugin/src/main/java/com/github/luiox/gruntdeobf/Sample001Pass1.java](https://github.com/luiox/jvm-things-archieve/blob/main/morpher-plugin/src/main/java/com/github/luiox/gruntdeobf/Sample001Pass1.java)

为了方便，以及减少相同代码的反复编写，我已经开发了一些基础工具。地址是[https://github.com/luiox/morpher-api](https://github.com/luiox/morpher-api)。



## 引入库

首先需要加jitpack，因为包在jitpack存储。

```kotlin
repositories {
    maven { url = uri("https://jitpack.io")  }
}
```

其次，引入依赖，前面是依赖的库。

```kotlin
dependencies {
    implementation("com.github.luiox:morpher-api:v1.2")
}
```



## 样本来源说明

不针对任何人，此样本来自Discord的频道[https://discord.gg/tRU27KtPAZ](https://discord.gg/tRU27KtPAZ)分享，在[https://github.com/luiox/jvm-things-archieve](https://github.com/luiox/jvm-things-archieve)仓库的sample目录下，名字是`sample-001.jar`，原本名字为`nCrypt-Resolve.jar`。

这个混淆比较弱，非常适合入门。



## 分析到构建pass

首先进行样本分析，我们利用Recaf得到cfr反编译观察到下面这个结构。

```java
if ((0x6B4E0A72 ^ 0x6B4E0A72) != 0) {
    int cfr_ignored_1 = 33 - 44;
    int cfr_ignored_2 = 42 + 40;
}
```

观察main方法的字节码，前面这个if结构对应的字节码如下。

```text
    ldc 1800276594
    dup 
    ixor 
    ifeq C
    nop 
    nop 
    bipush 33
    bipush 44
    isub 
    pop 
    bipush 42
    bipush 40
    iadd 
    pop 
C: 
```

其实核心在下面这三条指令。

```text
ldc 1800276594
dup
ixor
```

这个是一个必定为0的表达式，一个数异或他自己必定是0。即`a ^ a = 0`。

所以，我们可以把它替换为`iconst_0`。



我们需要先新建一个MethodPass来处理MethodNode级别的转换。

```java
@PassInfo(name = "Sample001Pass1", description = "处理a^a的pass")
public class Sample001Pass1 extends MethodPass {

    @Override
    public void run(@NotNull MethodNode methodNode, @NotNull PassContext passContext) {

    }
}
```



利用库内的matcher来构建替换。使用方法是，先定义一个`PatternMatcher`，然后再在static里面初始化这个matcher的规则，`StepUtil`提供了一些step，这样子不需要自己去new了。`addStep`可以添加一个匹配的step，loadInt这个方法会返回一个可以匹配所有加载一个int常数的step，然后后面的`setStrategy`是处理策略，如果匹配到以后怎么处理，默认情况下会全部丢掉匹配中的部分，利用`ctx.builder`就可以把自己需要的部分加进去，比如，我现在要把匹配到的这个第一个加载int的这个指令加回去，那么就应该写为`ctx.builder.addInsnNode(ctx.original.get(ctx.startIdx));`。这个索引是左闭右开区间，匹配中的下标是`[startIdx, endIdx)`。

然后`ctx.original`是原始的那个`InsnList`，只需要拿就完事了。`ctx.builder`是一个`InsnBuilder`，需要添加新的指令，就跟写指令一样就可以了。

```java
public class Sample001Pass1 extends MethodPass {

    static PatternMatcher matcher = new PatternMatcher();

    static {
        MatchRule rule = new MatchRule()
                .addStep(StepUtil.loadInt())
                .addStep(StepUtil.dup())
                .addStep(StepUtil.ixor())
                .setStrategy(ctx -> {
                    ctx.builder.iconst_0();
                });
        matcher.addRule(rule);
    }

    @Override
    public void run(@NotNull MethodNode methodNode, @NotNull PassContext passContext) {
        if(methodNode.instructions == null || methodNode.instructions.size() == 0){
            return;
        }
        methodNode.instructions = matcher.apply(methodNode.instructions);
    }
}
```

那么应用这个`matcher`的规则，`apply`会对传入的`InsnList`匹配，然后应用对应的修改策略，返回修改后的`InsnList`。



## 运行pass

那么写好一个pass以后，如何运行呢。只需要在`main`里面写下面这段代码即可。

需要一个`PassContext`作为上下文，这个里面需要一个`JarCaches`来管理class那些数据，库里面已经封装了基础的jar的读写器。`SimplePassRunner`使用的时候，需要`addPass`添加pass，然后`transform`会运行这些pass。

```java
public class Main {
    public static void main(String[] args) {
        PassContext context = new PassContext();
        context.jarCaches = new FullJarCaches();
        context.jarCaches.read(new SimpleJarReader("sample-001.jar"));

        SimplePassRunner runner = new SimplePassRunner();
        runner.addPass(new Sample001Pass1());
        runner.transform(context);

        context.jarCaches.write(new SimpleJarWriter("output.jar"));
    }
}
```

这个框架基本上不需要改变，只需要改变`addPass`传入的pass对象即可。

那么我们就可以拿到下面这样子的结果了，很容易看出来这个是可以被删除的。下一篇再写如何处理。

```java
if (false) {
    int cfr_ignored_1 = 33 - 44;
    int cfr_ignored_2 = 42 + 40;
}
```

