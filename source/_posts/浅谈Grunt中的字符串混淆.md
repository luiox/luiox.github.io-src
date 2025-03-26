---
title: 浅谈Grunt中的字符串混淆
date: 2025-03-26 16:26:01
tags: FreeRTOS
---

最近闲来无事，有点想法，想看看Grunt里的字符串混淆的，正巧，今天有空就分析一下。开了动态调用替换`ReplaceInvokeDynamics`。我也不从源码上看了，直接从它的这个行为上去分析字符串混淆的算法。



## 原始的代码

大致就如下所示，一个非常简单的代码，用于打印参数内容。

```java
public class Demo {
    
    public static void staticMethod(String string2,
                                    String string3,
                                    String string4,
                                    Integer n){
        // 打印转发的参数
        System.out.println("string2: " + string2);
        System.out.println("string3: " + string3);
        System.out.println("string4: " + string4);
        System.out.println("n: " + n);
    }
}
```



## 混淆之后

好吧，原先的原始代码，我因为之前混淆之前加过一些无关的测试代码。导致我混淆以后内容有点多。但是我已经尽力删除了无关代码了。大致浏览一下混淆后的代码。

```java
public class Demo {
    private static String[] BNjtLnND6uLMvq4i = new String[11];

    public static void staticMethod(String string2, String string3, String string4, Integer n) {
        System.out.println((String)((Object)Demo.wxbWeK4e8Jy9ILQj("makeConcatWithConstants", "\u0002\u0001", (String)string2)));
        System.out.println((String)((Object)Demo.xFGQUAz2sv5E0vre("makeConcatWithConstants", "\u0002\u0001", (String)string3)));
        System.out.println((String)((Object)Demo.JeNT5II3D7SDEQ9Q("makeConcatWithConstants", "\u0002\u0001", (String)string4)));
        System.out.println((String)((Object)Demo.VqoTTK9l1WbueFNl("makeConcatWithConstants", "\u0002\u0001", (Integer)n)));
    }

    private static CallSite VqoTTK9l1WbueFNl(MethodHandles.Lookup lookup, String string, MethodType methodType, String string2) {
        return StringConcatFactory.makeConcatWithConstants(lookup, string, methodType, string2, BNjtLnND6uLMvq4i[2]);
    }

    private static CallSite wxbWeK4e8Jy9ILQj(MethodHandles.Lookup lookup, String string, MethodType methodType, String string2) {
        return StringConcatFactory.makeConcatWithConstants(lookup, string, methodType, string2, BNjtLnND6uLMvq4i[1]);
    }

    private static CallSite JeNT5II3D7SDEQ9Q(MethodHandles.Lookup lookup, String string, MethodType methodType, String string2) {
        return StringConcatFactory.makeConcatWithConstants(lookup, string, methodType, string2, BNjtLnND6uLMvq4i[10]);
    }

    private static CallSite xFGQUAz2sv5E0vre(MethodHandles.Lookup lookup, String string, MethodType methodType, String string2) {
        return StringConcatFactory.makeConcatWithConstants(lookup, string, methodType, string2, BNjtLnND6uLMvq4i[9]);
    }

    static {
        Demo.YnkFQ0FdQ4DehTLP();
    }

    private static String OaR6idIgyN63gaCo(char[] cArray, long l, int n) {
        int n2 = 0xFCF416BC ^ n;
        for (int i = 0; i < cArray.length; ++i) {
            n2 = n2 ^ (int)l ^ ~i;
            n2 ^= n - i * cArray.length;
            n2 = -n2 * n | i;
            cArray[i] = (char)(cArray[i] ^ n2);
            int n3 = i & 0xFF;
            n = n << n3 | n >>> -n3;
            l ^= (long)n3;
        }
        return new String(cArray);
    }

    private static void YnkFQ0FdQ4DehTLP() {
        Demo.BNjtLnND6uLMvq4i[0] = Demo.OaR6idIgyN63gaCo("\ua2f6\u9384\u15e6\u5277\u0ea7\ub2fe\ud2e3".toCharArray(), 4511L, 461921305);
        Demo.BNjtLnND6uLMvq4i[1] = Demo.OaR6idIgyN63gaCo("\ub7cb\ucabf\uf228\u89be\u7efa\u48b2\u95fd\uf235\u1a38".toCharArray(), 49515L, 1572795189);
        Demo.BNjtLnND6uLMvq4i[2] = Demo.OaR6idIgyN63gaCo("\u4247\u37a7\ue866".toCharArray(), 81046L, 976731899);
        Demo.BNjtLnND6uLMvq4i[3] = Demo.OaR6idIgyN63gaCo("\u2af6\u1842\ucd89\ucf68\u3f22\ufac5\ud8bd\uee23\ubfcc\u6bf4\u47a4\u60ac".toCharArray(), 57275L, -1257946862);
        Demo.BNjtLnND6uLMvq4i[4] = Demo.OaR6idIgyN63gaCo("\uf3d4\ud78d\uba4e\u0315\u40f8\u6f85\u421d\ue943\ue2dc\u72b4\u86c1\ud968".toCharArray(), 55563L, -1319569364);
        Demo.BNjtLnND6uLMvq4i[5] = Demo.OaR6idIgyN63gaCo("\u93c3\ua804\ua40c\u4424\u0d3a\u3803\u99d6\ud30c\u03ec\u607b\uc0f7\ub2c1\u455b".toCharArray(), 31595L, -824855294);
        Demo.BNjtLnND6uLMvq4i[6] = Demo.OaR6idIgyN63gaCo("\u4970\u02bc\u1642\u7ce7\u46f3\ua357\u30b9\ueca0\ufee9\uc695\udcda".toCharArray(), 53836L, -1679361384);
        Demo.BNjtLnND6uLMvq4i[7] = Demo.OaR6idIgyN63gaCo("".toCharArray(), 40521L, 1731476521);
        Demo.BNjtLnND6uLMvq4i[8] = Demo.OaR6idIgyN63gaCo("\ude6b\u4273\u59c6\u6daf\u638f\u30be\ue32a\u810a\u9eec\u2907\u2d70\u0c4b".toCharArray(), 38939L, -163878089);
        Demo.BNjtLnND6uLMvq4i[9] = Demo.OaR6idIgyN63gaCo("\u1c60\u613d\ua648\u044a\ufcd3\u148a\u9cb5\u888d\u699d".toCharArray(), 79226L, 1564077397);
        Demo.BNjtLnND6uLMvq4i[10] = Demo.OaR6idIgyN63gaCo("\u73a4\uc46d\u29f8\u557a\uf30b\u66b8\u6f62\u66b5\u4698".toCharArray(), 56174L, -999666835);
    }
}
```



我们可以注意到多了一个`BNjtLnND6uLMvq4i`数组，这个数组在`static`块里面通过调用`YnkFQ0FdQ4DehTLP`被初始化，也就是类加载的时候被初始化。`OaR6idIgyN63gaCo`这个就是个解密算法的方法。



## invokedynamic

然后原始的`staticMethod`里面，原先使用字符串的地方，变成了`wxbWeK4e8Jy9ILQj`方法的调用。这个是一个`invokedynamic`的调用，随便找一个都是一样的。字节码如下，就是先调用一个`wxbWeK4e8Jy9ILQj`作为引导方法，然后返回一个真正的方法调用点。这个调用点代表的方法是一个输入一个`String`返回一个`String`的方法。

```assembly
getstatic java/lang/System.out Ljava/io/PrintStream;
aload string2
invokedynamic makeConcatWithConstants (Ljava/lang/String;)Ljava/lang/String; { invokestatic, me/canrad/testdemo/demo/Demo.wxbWeK4e8Jy9ILQj, (Ljava/lang/invoke/MethodHandles$Lookup;Ljava/lang/String;Ljava/lang/invoke/MethodType;Ljava/lang/String;)Ljava/lang/invoke/CallSite; } { "\u0002\u0001" }
invokevirtual java/io/PrintStream.println (Ljava/lang/String;)V
```

那么`wxbWeK4e8Jy9ILQj`方法显然就是创建一个调用点。`StringConcatFactory.makeConcatWithConstants`这个调用，是产生一个字符串连接方法，方法的名字是`string`，然后字符串连接方式是由`string2`指定，后面`BNjtLnND6uLMvq4i[1]`是作为常数传递的。

```java
public static CallSite makeConcatWithConstants(MethodHandles.Lookup lookup,
                                               String name,
                                               MethodType concatType,
                                               String recipe,
                                               Object... constants);

private static CallSite wxbWeK4e8Jy9ILQj(MethodHandles.Lookup lookup, String string, MethodType methodType, String string2) {
    return StringConcatFactory.makeConcatWithConstants(lookup, string, methodType, string2, BNjtLnND6uLMvq4i[1]);
}
```

那么结合前面的这条调用指令来分析，含义就是，调用引导方法的时候，传递的`string2`就是`"\u0002\u0001"`，这个的含义通过[https://doc.qzxdp.cn/jdk/17/zh/api/java.base/java/lang/invoke/StringConcatFactory.html#makeConcatWithConstants(java.lang.invoke.MethodHandles.Lookup,java.lang.String,java.lang.invoke.MethodType,java.lang.String,java.lang.Object...)](https://doc.qzxdp.cn/jdk/17/zh/api/java.base/java/lang/invoke/StringConcatFactory.html#makeConcatWithConstants(java.lang.invoke.MethodHandles.Lookup,java.lang.String,java.lang.invoke.MethodType,java.lang.String,java.lang.Object...))就可以知道了，意思就是先放一个`BNjtLnND6uLMvq4i[1]`到`\u0002`的位置上，然后`\u0001`由调用时候指定。

所以最终的`\u0001`是由`aload string2`这个字符串代替，所以最终就是拼接等价为`BNjtLnND6uLMvq4i[1] + string2`。



算法总结大致就是，一开始生成一个数组，里面存储了加密的字符串，然后在类加载的时候进行解密，任何拼接的地方替换为`invokedynamic`的调用，通过`tringConcatFactory.makeConcatWithConstants`产生调用点函数来实现。



## 解密算法分析

从最传统的异或加密开始，相当于是给每个`char`异或上一个值。

```java
public static String encryptSimpleXor(char[] cArray, int key) {
    for (int i = 0; i < cArray.length; i++) {
        cArray[i] = (char) (cArray[i] ^ key);
    }
    return new String(cArray);
}
```

传统异或算法的问题是太简单了，解密的和加密的是一样的，其次就是在混淆器生成的时候，经常就是把`key`直接硬编码生成在方法里面。就像是下面这样子。

```java
public static String decryptSimpleXor(char[] cArray) {
    int key = 666666;
    for (int i = 0; i < cArray.length; i++) {
        cArray[i] = (char) (cArray[i] ^ key);
    }
    return new String(cArray);
}
```

Grunt的这个就有点改进了，它这个有多个参数。用于异或的这个值会一直滚动修改，这样子用于异或每个`char`的值都不一样了。因为参与的几个变量，在不断地重新计算，非常复杂。但是没什么用。

```java
private static String OaR6idIgyN63gaCo(char[] cArray, long l, int n) {
    int n2 = 0xFCF416BC ^ n;
    for (int i = 0; i < cArray.length; ++i) {
        n2 = n2 ^ (int)l ^ ~i;
        n2 ^= n - i * cArray.length;
        n2 = -n2 * n | i;
        cArray[i] = (char)(cArray[i] ^ n2);
        int n3 = i & 0xFF;
        n = n << n3 | n >>> -n3;
        l ^= (long)n3;
    }
    return new String(cArray);
}
```



## 某样本里面的字符串混淆

基于一个Grunt混淆的jar，不知名来源。特征就是非常长的空格作为名字，真是卡爆了。大致的就是下面这样子，`indyCall`这个名字是我改过的，原始的是一个有三万多个空格的名字，然后后面的这个`\u0020...(32766)...\u0020`实际上就是32766个`\u0020`，也就是空格，非常恶心。

```assembly
invokedynamic indyCall (Ljava/lang/Object;I)C { invokestatic, dev/luminous/aaJ\u200E.\u0020...(32766)...\u0020, (Ljava/lang/invoke/MethodHandles$Lookup;Ljava/lang/String;Ljava/lang/invoke/MethodType;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/Integer;)Ljava/lang/invoke/CallSite; } { "۰ۻ۬ۻڴ۶ۻ۴۽ڴۉۮۨ۳۴۽", "۹۲ۻۨۛۮ", "ڲۓڳۙ", 1 }
```

而且有很多unicode的字符，所以不适合直接看参数，拿idea读取一下类，看得比较清楚。可以确定的是，所有的引导方法在调用的时候，参数都是可以确定的。

