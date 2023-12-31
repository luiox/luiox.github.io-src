---
title: 《OCaml From the Very Beginning》读书笔记1
date: 2023-09-29 21:06:29
tags: OCaml
---

# 前言

《OCaml From the Very Beginning》这本书间我歇着看了好久了，但是始终没有看完，这次趁着放假把这本书看完，顺便写点笔记，以免跟之前一样，看完以后过一段时间就忘了。

在记录书本内容之前，先写点我坎坷的OCaml学习之路。一开始我尝试过在Windows上配置OCaml的环境，然后怎么也搞不好环境，就放弃了一次。然后八九月的时候好不容易把WSL2搞好了，就重新开始学OCaml了。对于OCaml解释器，一开始我不懂的时候，直接就是在那个OCaml原本的解释器上写，那个东西输进去就不能删除，体验很糟糕。因为不知道OCaml有uTop这种REPL的存在，后来看了一个配置环境教程，链接：[https://zhuanlan.zhihu.com/p/550727182](https://zhuanlan.zhihu.com/p/550727182)，算是摸到了一点门道。但是因为九月很忙一直没有空看《OCaml From the Very Beginning》这本书，只能依靠我之前看这本书的一丝丝记忆来写OCaml，反正就是写什么都报错。一想到就`;`和`;;`这两个分不清导致的问题，我一直搜和问ChatGTP解决了很久很久还没有解决，最后还是问别人解决的。

OCaml给我的一个感觉就是中文的资料数量少，质量不行，只有入门级别，有些甚至入门都算不上。稍微好一点的资料全是英文的，奈何我英语不太好😅😅😅。但是也没有办法，既然选择要学，就只能硬着头皮看《OCaml From the Very Beginning》,好在仅仅只是单词个别看不懂，有翻译的加持，大致能理解。这一篇就总结一下前面8个Chapter的内容。



# 表达式计算和类型

这本书一开始从`1+2*3`表达式计算开始讲起，表达式的计算是有优先级的，先计算乘除再计算加减。使用`()`小括号括住，让一个表达式能够先被计算。运算符主要是有`+`、`-`、`*`、`/`和`mod`（取余）。类型有`int`、`double`、`double`、`bool`和`string`。

OCaml对表达式中有类型的要求，比如`1+true`就不行，因为前者是`int`后者是`bool`。OCaml中类型是很重要的东西，如果类型不匹配就不能通过编译。



# let绑定和递归函数

let可以用于把一个值绑定到一个标识符上，也可以把一个函数绑定上去。

函数是一种类型到一种类型。比如下面的`neg`就是`int -> bool = <fun>`因为是一个函数，所以会有`=<fun>`。

```ocaml
let neg x = if x < 0 then true else false;;
```

之前我是不知道递归函数是`recursive function  `，因为我认不到`recursive`这个词，只知道`function`是函数，然后`let`的时候加一个`rec`就可以表明是递归的，现在算是理解了。

OCaml中let定义函数，差不多格式是`let 函数名 参数1 参数2 ... = 函数体`。差不多是这么一个意思，如果是递归就把`let`改为`let rec`。



# 模式匹配

模式匹配是真的搞人心态，功能很强大，但是也很难掌握。格式差不多如下。这里是对`a`进行模式匹配，然后前面都不能匹配的时候，才匹配`_`情况。

```ocaml
match a with
| case1 -> 1
| case2 -> 2
| _ ->3
```

单纯的模式匹配作用不大，都是配合其他使用。



# List列表

我之前搞不清楚以为OCaml的List是用`,`分割元素的。实际上一个列表式类似于`[1;2;3]`这样的，列表之间用`@`连接，比如`[1;2;3] @ [4;5]`。这个`@`理解为append。

OCaml中的列表分为两个部分，一个是头一个是尾。任何一个非空的列表分为头和尾，如果是空的列表，那就叫nil。所谓的头和尾，比如`[1;2;3]`中，如果`[1]`是头，`[2;3]`就是尾，而如果`[3]`是头，那`[]`就是尾，这个尾就是空列表。

因此可以配合前面的模式匹配来进行列表操作。下面这个`length`函数，传入一个列表，然后模式匹配，空列表的时候返回0，非空就拆解尾头和尾，h是头（head），t是尾（tail）。然后递归加1。

```ocaml
let rec length l = 
  match l with
  | [] -> 0
  | h::t -> 1 + length t
```



我今天看的时候，对一个例子一开始不太明白，配合ChatGPT的指导，也算是明白了，就是下面这个函数。

```ocaml
let rec odd_elements l =
  match l with
  | [] -> []
  | [a] -> [a]
  | a::_::t -> a :: odd_elements t
```

这个函数类型是`list -> list`，传入一个list以后，对于0个元素的空列表直接返回，一个元素也是。两个及以上的元素，拆分成三个部分。我之前不懂是因为没有想到，两个元素后面还可以有一个`[]`当第三个元素。这里是把`l`拆成三分，头、尾然后尾后面的一个，前面的作用是把头尾分出来以后只要头，然后尾不要，但是要递归调用尾后面的一个。这样就完成了挑选出列表中的奇数位上的元素。



# 排序

排序一开始讲了插入排序，一个列表如果只有零个或者一个元素的时候是肯定有序的，然后逐个插入到自己正确的位置，这就实现了插入排序。

```ocaml
let rec insert x l =
  match 1 with
  | [] -> [x]
  | h::t -> 
      if x <= h
         then x :: h :: t
         else h :: insert x t

let rec sort l =
  match l with
  | [] -> []
  | h::t -> insert h (sort t)
```



然后是归并排序，主要是take和drop。



# 把文件中的代码加载到解释器

实现从文件加载程序很简单，只需要输入`#use "路径"`，路径比如`main.ml`。要知道OCaml的源文件是`*.ml`，这个指令不属于代码，仅仅只是让解释器加载文件中的代码而已。



# 高阶函数

这一章标题为`Functions upon Functions upon Functions`，因为它这个把函数作为参数传进去，所以我就叫它高阶函数，也不知道对不对。

传入的函数就跟普通的函数一样调用就行，`函数名 参数`就这样，非常简单。有时候可以通过`()`来创建一个临时的函数。比如`(x >= y) 4 5`等价于下面这样。

```ocaml
let greater x y = x >= y
greater 4 5
```

然后就是使用`fun`定义匿名函数（anonymous function），也就是lambda，这一般用在暂时定义函数然后使用的情况。

```ocaml
let evens l =
  map (fun x -> x mod 2 = 0) l
```

map是一个高阶函数，第一个参数是一个函数，第二个参数是一个列表。也就是对一个列表每个元素进行第一个参数中函数的操作，简而言之就是把传入的函数施加于每一个列表元素。



# 错误处理

错误处理关键在于使用`excetion`定义一个异常，然后通过`raise`发出，通过`try with`捕获。

下面是两个定义异常的例子，异常可以是用`of`指定类型，也可以不说明类型。

```ocaml
exception Problem
exception NotPrime of int
```

使用`raise`发出异常的时候可以附带一些信息，信息的类型由定义异常的时候决定。

```ocaml
raise (NotPrime 1)
```

`try with`要注意的是`try`的类型和`with`一致。`with`后面是异常，然后箭头。

```ocaml
try x/y with Division_by_zero -> 0
```



# 字典

字典（dictionary）类型也是很重要的一种类型，是一种Key->Value的结构，从一种类型映射到另一种类型。使用`,`来表示，比如一个`int`到`char`的字典可以是`[1, '1']`。

在模式匹配中，使用`()`加上`,`指明这是一个字典，然后使用`_`作为通配符。



至此，前八章内容大致总结完毕。Cheers！🥰🥰🥰
