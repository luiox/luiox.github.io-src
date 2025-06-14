---
title: java deobf开发日志2
author: Canrad
date: 2025-06-14 20:28:03
tags: Java
---

上一篇已经处理到下面这个情况了。

```java
if (false) {
    int cfr_ignored_0 = 17 + 19;
}
```

对应的字节码如下。

```text
    iconst_0 
    ifeq B
    nop 
    nop 
    bipush 17
    bipush 19
    iadd 
    pop 
B: 
```

因为`ifeq`的含义是为0的时候跳转，而前面刚好已经加载了一个0，所以是必定跳转，因此我们可以在上一篇的基础上再加一个规则。

如果匹配到连续的`iconst_0`和`ifeq`直接给他替换为`goto`。

```java
// iconst_0 - ifeq => goto
MatchRule rule2 = new MatchRule()
        .addStep(StepUtil.iconst_0())
        .addStep(StepUtil.ifeq())
        .setStrategy(ctx -> {
           var ifeqNode = (JumpInsnNode)ctx.original.get(ctx.startIdx + 1);
           ctx.builder.gotoo(ifeqNode.label);
        });
matcher.addRule(rule2);
```

那么我们还要做的一点是，要一直反复替换，直到不再有新的替换可以产生。而且我们可以观察到的一点是，替换一定是简化的，即指令数量在减少，如果没有减少，那么意味着没有替换了，就可以停止了。于是可以改为下面这样子。



## 死代码消除

那么这个时候就又有另外一个情况产生了。那就是死代码。这个死代码是不会有被执行对的可能性。即便是加上所有分支可能会发生，所有异常可能发生，但是也执行不到。

栈帧分析，本质上是模拟指令的执行，如果一个指令没有被执行，那么对应的frame就会是null。因此除了`LabelNode`、`LineNumberNode`、`FrameNode`这种非指令的Node，其他指令型的Node如果是null，那么就说明不会被执行。所以通过栈帧分析可以知道，一个指令会不会被执行。

所以可以写出下面这样子的一个Pass来清理死代码。

```java
@PassInfo(name = "DeadCodeRemover", description = "移除无用代码")
public class DeadCodeRemover extends MethodPass {

    @Override
    public void run(@NotNull MethodNode methodNode, @NotNull PassContext context) {
        if (methodNode.instructions == null || methodNode.instructions.size() == 0) {
            return;
        }

        // 栈帧分析
        try {
            Analyzer<BasicValue> analyzer = new Analyzer<>(new BasicInterpreter());
            Frame<BasicValue>[] frames = analyzer.analyze(context.currentClass.name, methodNode);

            // 删除无论如何不可能执行到的死代码
            AbstractInsnNode[] insnNodes = methodNode.instructions.toArray();
            for (int i = 0; i < frames.length; i++) {
                if (frames[i] == null
                        && !(insnNodes[i] instanceof LabelNode)
                        && !(insnNodes[i] instanceof LineNumberNode)
                        && !(insnNodes[i] instanceof FrameNode)) {
                    methodNode.instructions.remove(insnNodes[i]);
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```



## 移除冗余跳转

因为我们的死代码消除以后，会留下一地的无效跳转。字节码如下。

```text
    goto B
B: 
    invokespecial IlllPIllIIIIIyNAiIIIIIIIIIIIIIIIIIIlla.<init> ()V
    bipush 7
    newarray int
    goto C
C: 
    dup 
    iconst_0 
    bipush 12
    iastore 
    dup 
    goto D
D: 
    iconst_1 
    goto E
E: 
```

这里使用原始一点的方式来做这个替换，因为比较简单的。特征是一个`goto`，然后后面跟着他跳转的label。

```java
@PassInfo(name = "Sample001Pass2", description = "处理冗余跳转的pass")
public class Sample001Pass2 extends MethodPass {

    @Override
    public void run(@NotNull MethodNode methodNode, @NotNull PassContext context) {
        if (methodNode.instructions == null || methodNode.instructions.size() == 0) {
            return;
        }

        AbstractInsnNode[] insns = methodNode.instructions.toArray();
        for (int i = 0; i < insns.length; i++) {
            var insn  = insns[i];
            if (insn instanceof JumpInsnNode jumpInsnNode && insn.getOpcode() == Opcodes.GOTO) {
                // 检查一下i+1是否在范围内
                if (i + 1 >= insns.length) {
                    break;
                }
                var next = insns[i + 1];
                // 检查一下跳转的目标是否是下一个指令
                if(next instanceof LabelNode labelNode && labelNode == jumpInsnNode.label){
                    // 移除这个跳转
                    methodNode.instructions.remove(insn);
                }
            }
        }
    }
}
```

至此，我们已经达到了下面这个结果。

```java
public static /* bridge */ /* synthetic */ void main(String[] stringArray) throws Throwable {
    DNsPdL56Mhu.08QrUz();
    DNsPdL56Mhu.9lqXN();
    sIbV73dl.icKqMLNz();
    Class[] classArray = new Class[0xCC9B ^ 0x65E1 ^ 0xCAB6 ^ 0x364 ^ (0xFFFFD608 ^ 0x7227 ^ 0xFFFFC911 ^ 0xFFFF8F67) ^ (0xF032 ^ 0xD4E6 ^ 0x6999 ^ 0x1299) ^ (0xFFFF8441 ^ 0xFFFFE1CE ^ 0x18D4 ^ 0xFFFFA07F)];
    classArray[0x7BA ^ 0xFFFF3B11 ^ 0x95B7 ^ 0xFFFFF993 ^ (0xFFFF82A5 ^ 0xAB54 ^ 0xFFFF9D24 ^ 0xFFFF326A) ^ (0x3154 ^ 0xFFFFBC00 ^ 0xAE5 ^ 0xFFFFD6BD) ^ (0x182A ^ 0xA4F3 ^ 0x71EC ^ 0xFFFF4A09)] = String[].class;
    Object[] objectArray = new Object[0x1217 ^ 0xFFFF88AA ^ 0x5A8E ^ 0xFFFFCB86 ^ (0x3FB9 ^ 0x9B55 ^ 0x643D ^ 0xFFFF5FBB) ^ (0xDF26 ^ 0x9BAE ^ 0x69A2 ^ 0x5F65) ^ (0xFFFFBF3B ^ 0xFFFF8633 ^ 0x1E74 ^ 0xFFFFC1ED)];
    objectArray[0x7913 ^ 0xFFFFA672 ^ 0x3B3B ^ 0xFFFFDF8B ^ (0xFFFFF16A ^ 0x8FD7 ^ 0xFFFFFB87 ^ 0xFFFF5720) ^ (0xB383 ^ 0xFFFF206B ^ 0xC14 ^ 0xFFFFFCC3) ^ (0x15F7 ^ 0xFDEF ^ 0x135E ^ 0xFFFF71B2)] = stringArray;
    new IlllPIllIIIIIyNAiIIIIIIIIIIIIIIIIIIlla().loadClass(IlllPIllIIIIIyNAiIIIIIIIIIIIIIIIIIIlla.3feb1bc713c99937(ziEF0305cOI.mEn(new int[]{12, 28619, 58334, 54558, 44070, 47900, 38386}), -(-(-(-(-(-(-(-(0x9AFE ^ 0xFFFFA2BA ^ 0xE7E8 ^ 0xFFFFC727 ^ (0x178F ^ 0x9ADB ^ 0x38E0 ^ 0xFFFF7DC5) ^ (0xEF8B ^ 0x10C7 ^ 0xF049 ^ 0x63BE) ^ (0xFFFF8300 ^ 0x6C6C ^ 0xFFFFD499 ^ 0xFFFF8474))))))))))).getMethod(IlllPIllIIIIIyNAiIIIIIIIIIIIIIIIIIIlla.3feb1bc713c99937(ziEF0305cOI.mEn(new int[]{12, 28526, 53470, 22353, 44197, 43036, 19592}), -(-(-(-(0xF039 ^ 0x5198 ^ 0xF22B ^ 0x17B4 ^ (0xFFFFCA63 ^ 0xFFFFB19F ^ 0xC89 ^ 0xFFFF9EE1) ^ (0xBAFA ^ 0xFFFF6130 ^ 0x630 ^ 0xFFFFE29C) ^ (0x4E05 ^ 0xDDF9 ^ 0x2360 ^ 0xFFFF2555)))))), classArray).invoke(null, objectArray);
}
```

还是有很多的异或，这些也可以消除。下一篇再解决这个问题。

