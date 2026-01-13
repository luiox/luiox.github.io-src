---
title: java-origincloud分析1
author: Canrad
tags: Java
abbrlink: 1885531416
date: 2025-06-26 23:17:03
---

# java-origincloud分析1

## 说明

样本为Hex8，由origincloud提供，仅做学习交流使用。文件原始大小38.6MB。



## 基础异或混淆

首先，先挑选一个类开始，那就从主类开始，通过`fabric.mod.json`，关键内容如下。

```json
"entrypoints":{"main":["tech.origincloud.obf.protected_by_originshield_ \u0000妈崩"]}
```

所以从`妈崩`这个类开始分析，混淆强度是有的。



随便翻翻，就可以发现有字面量混淆，大致就跟`static protected_by_originshield_ \u2000`下面这个方法这样子，就异或，还是比较简单。

```java
char[] cArray = new char[0x65A0 ^ 0xFFFFFAFA ^ 0x2F7C ^ 0xFFFFB020];
cArray[0x621 ^ 0xFFFFFDCF ^ 0x638F ^ 0xFFFF9861] = 0x3FDD ^ 0xFFFFC640 ^ 0xCEF ^ 0xFFFFF515;
...
```

先使用`ArithmeticSimplifier`解决这个。规则是`load(I:v1) - load(I:v1) - ixor => load(I:v1 ^ v2)`。消除完成以后，可以减少0.3MB。



## 常量池

看下面这一小端代码。其中的`protected_by_originshield_ \u0000\u64cd\u7b28\u795e.\u5b5d `明显是一个字段。

```java
var4_5 = 813169406;
if ((protected_by_originshield_ \u0000\u64cd\u7b28\u795e.\u5b5d | ~573956482) - ~573956482 <= var4_5) ** GOTO lbl25
```

然后找过去就有下面这样子的类
```java
public class protected_by_originshield_ \u0000\u64cd\u7b28\u795e {
    public static /* synthetic */ int \u4f60 = 977450323;
    public static /* synthetic */ int \u5988 = 1054751781;
    public static /* synthetic */ int \u50bb = 1047944544;
    ...
}
```

利用`ConsStaticFieldReplacer`实现把这个常量静态字段传播过去。差不多会替换23455个地方，缩减约0.3MB。



## 跳转条件确定

之前的跳转判断条件，就已经转到下面这样子了。

```java
var4_5 = 813169406;
if ((301914810 | ~573956482) - ~573956482 <= var4_5) ** GOTO lbl24
```

观察字节码如下。

```text
ldc 813169406
istore i4
ldc 573956482
ldc 301914810
swap 
dup_x1 
iconst_m1 
ixor 
ior 
swap 
iconst_m1 
ixor 
isub 
iload i4
if_icmpgt G
goto J
```

我的方案是，先做一个局部变量的常量传播优化，效果如下。

```text
ldc 813169406
istore i4
ldc 573956482
ldc 301914810
swap 
dup_x1 
iconst_m1 
ixor 
ior 
swap 
iconst_m1 
ixor 
isub 
ldc 813169406
if_icmpgt G
goto J
```

然后再做常量折叠，效果如下。

```text
ldc 813169406
istore i4
ldc 3457154
ldc 813169406
if_icmpgt G
goto J
```

这个时候，是一个常量条件了，`ConsJumpOptimizer`优化一下。

