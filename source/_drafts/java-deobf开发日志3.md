---
title: java deobf开发日志3
author: Canrad
date: 2025-06-14 20:28:03
tags: Java
---



## 消除没有使用到的label

在冗余跳转消除以后，有些label就变得没有被使用了，那么可以检查一个label有没有被使用。然后没有使用的，就可以删掉。不过，最好指令首尾的保留一下。

```java
@PassInfo(name = "UnusedLabelRemover", description = "清除没有使用到的LabelNode")
public class UnusedLabelRemover extends MethodPass {

    @Override
    public void run(@NotNull MethodNode methodNode, @NotNull PassContext context) {
        Map<LabelNode, Boolean> labelToUsed = new HashMap<>();
        // 扫描指令，搜集表，和确定引用情况
        for(var insn : methodNode.instructions) {
            if (insn instanceof JumpInsnNode jumpInsnNode) {
                labelToUsed.put(jumpInsnNode.label, true);
            } else if (insn instanceof LineNumberNode lineNumberNode) {
                labelToUsed.put(lineNumberNode.start, true);
            } else if (insn instanceof LookupSwitchInsnNode lookupSwitchInsnNode) {
                for (LabelNode labelNode : lookupSwitchInsnNode.labels) {
                    labelToUsed.put(labelNode, true);
                }
                labelToUsed.put(lookupSwitchInsnNode.dflt, true);
            } else if (insn instanceof TableSwitchInsnNode tableSwitchInsnNode) {
                for (LabelNode labelNode : tableSwitchInsnNode.labels) {
                    labelToUsed.put(labelNode, true);
                }
                labelToUsed.put(tableSwitchInsnNode.dflt, true);
            } else if (insn instanceof LabelNode labelNode) {
                // 先检查一下有没有
                if (labelToUsed.containsKey(labelNode)) return;
                // 没有就标记为未使用
                labelToUsed.put(labelNode, false);
            }
        }
        // 扫描try catch的label使用情况
        for (var tryCatchBlockNode : methodNode.tryCatchBlocks) {
            labelToUsed.put(tryCatchBlockNode.start, true);
            labelToUsed.put(tryCatchBlockNode.end, true);
            labelToUsed.put(tryCatchBlockNode.handler, true);
        }

        // 拿指令的起始和结束
        var start = methodNode.instructions.getFirst();
        var end = methodNode.instructions.getLast();
        // 从前往后和从后往前，第一个label需要保留
        while (start != null) {
            if (start instanceof LabelNode labelNode) {
                labelToUsed.put(labelNode, true);
                break;
            }
            start = start.getNext();
        }
        while (end != null) {
            if (end instanceof LabelNode labelNode) {
                labelToUsed.put(labelNode, true);
            }
            end = end.getPrevious();
        }

        // 移除所有为false的label
        for (var entry : labelToUsed.entrySet()) {
            if (!entry.getValue()) {
                methodNode.instructions.remove(entry.getKey());
            }
        }
    }
}
```



## 替换实现基础常量折叠

我们可以发现，特点是加载两个int常量，紧跟着一个`ixor`。因此，我们可以直接替换为结果。

```text
ldc 39678
sipush -23878
ixor 
```

另外就是`ineg`，这个指令是取反，如果是两次那么就不变。比如`-(-a)=a`。

所以可以写一个替换。

```java
// ldc(I:v1) - ldc(I:v2) - ixor => ldc(I:v1^v2)
MatchRule rule1 = new MatchRule()
        .addStep(StepUtil.loadInt())
        .addStep(StepUtil.loadInt())
        .addStep(StepUtil.ixor())
        .setStrategy(ctx -> {
            var val1 = InsnUtil.getIntValue(ctx.original.get(ctx.startIdx));
            var val2 = InsnUtil.getIntValue(ctx.original.get(ctx.startIdx + 1));
            ctx.builder.ldc(val1 ^ val2);
        });
matcher.addRule(rule1);

// ineg - ineg => nothing
MatchRule rule2 = new MatchRule()
        .addStep(StepUtil.iconst_0())
        .addStep(StepUtil.ifeq())
        .setStrategy(ctx -> {
            // 全部丢掉
        });
matcher.addRule(rule2);
```

