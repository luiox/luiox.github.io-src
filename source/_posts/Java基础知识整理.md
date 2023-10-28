---
title: Java基础知识整理
date: 2023-10-24 22:56:32
tags: Java
---

# 概述

## 何为编程

编程就是让计算机为解决某个问题而使用某种程序设计语言编写程序代码，并最终得到结果的过程。

为了使计算机能够理解人的意图，人类就必须要将需解决的问题的思路、方法、和手段通过计算机能够理解的形式告诉计算机，使得计算机能够根据人的指令一步一步去工作，完成某种特定的任务。这种人和计算机之间交流的过程就是编程。



## 什么是Java

Java是一门面向对象编程语言，不仅吸收了C++语言的各种优点，还摒弃了C++里难以理解的多继承、指针等概念，因此Java语言具有功能强大和简单易用两个特征。Java语言作为静态面向对象编程语言的代表，极好地实现了面向对象理论，允许程序员以优雅的思维方式进行复杂的编程 。



## 语言特点

 **1. 面向对象**
面向对象(OOP)就是Java语言的基础，也是Java语言的重要特性。面向对象的概念：生活中的一切事物都可以被称之为对象，生活中随处可见的事物就是一个对象，我们可以将这些事物的状态特征（属性）以及行为特征（方法）提取并出来，并以固定的形式表示。

 **2. 简单好用**
Java语言是由C和C++演变而来的，它省略了C语言中所有的难以理解、容易混淆的特性（比如指针），变得更加严谨、简洁、易使用。

 **3. 健壮性**
Java的安全检查机制，将许多程序中的错误扼杀在摇蓝之中。 另外，在Java语言中还具备了许多保证程序稳定、健壮的特性（强类型机制、异常处理、垃圾的自动收集等），有效地减少了错误，使得Java应用程序更加健壮。

 **4. 安全性**
Java通常被用在网络环境中，为此，Java提供了一个安全机制以防恶意代码的攻击，从而可以提高系统的安全性。

 **5. 平台无关性**
Java平台无关性由Java 虚拟机实现，Java软件可以不受计算机硬件和操作系统的约束而在任意计算机环境下正常运行。

 **6. 支持多线程**
在C++ 语言没有内置的多线程机制，因此必须调用操作系统的多线程功能来进行多线程程序设计，而 Java 语言却提供了多线程支持。多线程机制使应用程序在同一时间并行执行多项任务，该机制使得程序能够具有更好的交互性、实时性。

**7. 分布式（支持网络编程）**
Java语言具有强大的、易于使用的网络能力，非常适合开发分布式计算的程序。java中提供了网络应用编程接口(java.net)，使得我们可以通过URL、Socket等远程访问对象。



## JVM、JRE和JDK的关系

**JVM**
Java Virtual Machine是Java虚拟机，Java程序需要运行在虚拟机上，不同的平台有自己的虚拟机，因此Java语言可以实现跨平台。

**JRE**
Java Runtime Environment包括Java虚拟机和Java程序所需的核心类库等。核心类库主要是java.lang包：包含了运行Java程序必不可少的系统类，如基本数据类型、基本数学函数、字符串处理、线程、异常处理类等，系统缺省加载这个包

如果想要运行一个开发好的Java程序，计算机中只需要安装JRE即可。

**JDK**
Java Development Kit是提供给Java开发人员使用的，其中包含了Java的开发工具，也包括了JRE。所以安装了JDK，就无需再单独安装JRE了。其中的开发工具：编译工具(javac.exe)，打包工具(jar.exe)等

JVM-JRE-JDK关系图：

![JVM-JRE-JDK关系图](assets/JVM-JRE-JDK关系图.png)



## 什么是字节码？采用字节码的最大好处是什么？

字节码：Java源代码经过虚拟机编译器编译后产生的文件（即扩展为.class的文件），它不面向任何特定的处理器，只面向虚拟机。

采用字节码的好处：

Java语言通过字节码的方式，在一定程度上解决了传统解释型语言执行效率低的问题，同时又保留了解释型语言可移植的特点。所以Java程序运行时比较高效，而且，由于字节码并不专对一种特定的机器，因此，Java程序无须重新编译便可在多种不同的计算机上运行。

介绍一下java中的编译器和解释器：

Java中引入了虚拟机的概念，即在机器和编译程序之间加入了一层抽象的虚拟机器。这台虚拟的机器在任何平台上都提供给编译程序一个的共同的接口。编译程序只需要面向虚拟机，生成虚拟机能够理解的代码，然后由解释器来将虚拟机代码转换为特定系统的机器码执行。在Java中，这种供虚拟机理解的代码叫做字节码（即扩展为.class的文件），它不面向任何特定的处理器，只面向虚拟机。每一种平台的解释器是不同的，但是实现的虚拟机是相同的。Java源程序经过编译器编译后变成字节码，字节码由虚拟机解释执行，虚拟机将每一条要执行的字节码送给解释器，解释器将其翻译成特定机器上的机器码，然后在特定的机器上运行，这就是上面提到的Java的特点的编译与解释并存的解释。

Java源代码---->编译器---->jvm可执行的Java字节码(即虚拟指令)---->jvm---->jvm中解释器----->机器可执行的二进制机器码---->程序运行。



## Oracle JDK 和 OpenJDK 的对比

Oracle JDK版本将每三年发布一次，而OpenJDK版本每三个月发布一次；
OpenJDK 是一个参考模型并且是完全开源的；

而Oracle JDK是OpenJDK的一个实现，并不是完全开源的；
Oracle JDK 比 OpenJDK 更稳定。OpenJDK和Oracle JDK的代码几乎相同，但Oracle JDK有更多的类和一些错误修复。因此，如果您想开发企业/商业软件，我建议您选择Oracle JDK，因为它经过了彻底的测试和稳定。某些情况下，有些人提到在使用OpenJDK 可能会遇到了许多应用程序崩溃的问题，但是，只需切换到Oracle JDK就可以解决问题；
在响应性和JVM性能方面，Oracle JDK与OpenJDK相比提供了更好的性能；
Oracle JDK不会为即将发布的版本提供长期支持，用户每次都必须通过更新到最新版本获得支持来获取最新版本；
Oracle JDK根据二进制代码许可协议获得许可，而OpenJDK根据GPL v2许可获得许可。



## Idea安装

https://www.jetbrains.com/zh-cn/idea/download/

https://www.oracle.com/java/technologies/javase/javase8-archive-downloads.html



## 第一个Java程序

 **1、使用记事本创建一个txt文件，并将其名字改为HelloWorld.java**

 **2、写入一个最简单HelloWorld程序，该程序将输出字符串Hello World。**

```java
public class HelloWorld {
    public static void main(String[] args) {        
        System.out.println("Hello World"); // 输出 Hello World    
    } 
}
```

 **3、保存该文件，并使用快捷键win+R打开运行，然后输入cmd打开命令行。**

 **4、使用命令（cd 目录）进入之前创建java文件的目录，输入命令`javac HelloWorld.java`**

完成第四步以后你将会获得一个HelloWorld.class文件

 **5、输入命令java HelloWorld即可执行该程序**



## 单行注释、多行注释与空行

**单行注释**：以” // “开始至一行的末端都为注释内容，运行嵌套

**多行注释**：以” /* “开始，至” */ "结尾，不能嵌套

**空行**：空白的一行

无论是单行注释还是多行注释亦或是空行都将被编译器**忽略**，因此注释对于java程序的编译和运行**没有影响**。注释可以注明程序在该部分的意思。

以下为案例，第三行为空行。

```java
//这是单行注释
/*这是多行注释*/

```



# 基础类型和变量

## 标识符

对各种变量、方法和类等要素命名时使用的字符序列称为标识符。

**定义合法标识符规则**

1. **由 26 个英文字母大小写，0-9，_或$ 组成**
2. **数字不可以开头。**
3. **标识符不能包含空格。**
4. **不可以使用关键字和保留字，但能包含关键字和保留字。**
5. **严格区分大小写，长度无限制。**

对于关键字可以看查阅文档：[https://docs.oracle.com/javase/tutorial/java/nutsandbolts/_keywords.html](https://docs.oracle.com/javase/tutorial/java/nutsandbolts/_keywords.html)



## 变量

变量是一块用于存储数据的内存区域。通过`类型名 标识符`来定义变量。



## 基础类型

![基础类型](assets/基础类型.png)

**java 的整型常量默认为 int 型，声明 long 型常量须后加‘l’或‘L’**

| 类型  | 占用存储空间 | 范围                   |
| ----- | ------------ | ---------------------- |
| byte  | 1字节=8bit位 | -128 ~ 127             |
| short | 2字节        | -2^15~ 2^15-1          |
| int   | 4字节        | -2^31~ 2^31-1 (约21亿) |
| long  | 8字节        | -2^63~ 2^63-1          |

**java 的浮点型常量默认为double型，声明float型常量，须后加‘f’或‘F’。**

| 类型         | 占用存储空间 | 范围                   |
| ------------ | ------------ | ---------------------- |
| 单精度float  | 4字节        | -3.403e38 ~ 3.403e38   |
| 双精度double | 8字节        | -1.798e308 ~ 1.798e308 |



## 类型转换

自动类型转换：容量小的类型自动转换为容量大的数据类型。数据类型按容量大小排序为：

![数据类型大小](assets/数据类型大小.png)

强制类型转换：使用`(类型)`这样的格式来转换。例如

```java
int a = (int)3.14;
```



# 运算符

## 算术运算符

| 运算符 | 含义 |
| ------ | ---- |
| +      | 加   |
| -      | 减   |
| *      | 乘   |
| /      | 除   |
| %      | 取余 |
| 前置++ | 自增 |
| 前置-- | 自减 |
| 后置++ | 自增 |
| 后置-- | 自减 |

注意：`a[i++] = 1;`这样的表达式意思是`a[i] = 1;`之后再执行`i++;`。如果是`a[++i] = 1`那么就等价于先`++i;`然后执行`a[i] = 1;`。



## 赋值运算符

| 运算符 | 含义         |
| ------ | ------------ |
| =      | 赋值         |
| +=     | 先加后赋值   |
| -=     | 先减后赋值   |
| *=     | 先乘后赋值   |
| /=     | 先除后赋值   |
| %=     | 先取余后赋值 |

除了单纯`=`是赋值，其他都是复合赋值。比如`a += 1;`等价于`a = a + 1;`。



## 比较运算符（关系运算符）

| 运算符     | 含义                   |
| ---------- | ---------------------- |
| ==         | 等于                   |
| !=         | 不等于                 |
| >          | 大于                   |
| <          | 小于                   |
| >=         | 大于等于               |
| <=         | 小于等于               |
| instanceof | 某个对象是否是某个类型 |

除了`instanceof`，其他都应该很容易理解。举个`instanceof`的例子，比如`a instanceof A`，就是判断`a`这个对象是不是`A`这个类产生的。



## 逻辑运算符

| 运算符 | 含义     |
| :----- | -------- |
| &      | 逻辑与   |
| &&     | 逻辑与   |
| \|     | 逻辑或   |
| \|\|   | 逻辑或   |
| !      | 逻辑非   |
| ^      | 逻辑异或 |

**区分&与&&**

相同点：`&`与`&&`的运算结果相同。当符号左边是true时，二者都会执行符号右边的运算。
不同点：当符号左边是false时，`&`继续执行符号右边的运算。`&&`不再执行符号右边的运算。



**区分|与||**

相同点：`|` 与 `||` 的运算结果相同。当符号左边是false时，二者都会执行符号右边的运算。

不同点：当符号左边是true时，`|` 继续执行符号右边的运算，而 `||` 不再执行符号右边的运算。



## 位运算符

| 运算符 | 含义                   |
| ------ | ---------------------- |
| <<     | 左移                   |
| >>     | 右移                   |
| >>>    | 无符号右移（一般不用） |
| &      | 与                     |
| \|     | 或                     |
| ^      | 异或                   |
| ~      | 取反                   |



## 三元运算符

类似于if的作用。

`(条件表达式) ? 表达式1 : 表达式2`



## 运算符优先级

| 优先级 | 运算符                                                       | 结合性   |
| ------ | ------------------------------------------------------------ | -------- |
| 1      | ( )　[ ] 　.                                                 | 从左到右 |
| 2      | ! 　~　 ++　 –                                               | 从右到左 |
| 3      | *　 /　 %                                                    | 从左到右 |
| 4      | +　 -                                                        | 从左到右 |
| 5      | << 　>>　 >>>                                                | 从左到右 |
| 6      | < 　<=　 > 　>=　 instanceof                                 | 从左到右 |
| 7      | == 　!=                                                      | 从左到右 |
| 8      | &                                                            | 从左到右 |
| 9      | ^                                                            | 从左到右 |
| 10     | `|`                                                          | 从左到右 |
| 11     | &&                                                           | 从左到右 |
| 12     | `||`                                                         | 从左到右 |
| 13     | ? :                                                          | 从左到右 |
| 14     | = 　+= 　-= 　*=　 /=　 %=　 &=　 `|=`　 ^=　 ~= 　<<= 　>>=　 >>>= | 从右到左 |
| 15     | ，                                                           | 从右到左 |



# 类和对象

## 概念

面向对象：Object Oriented Programming

Java 类及类的成员：属性、方法、构造器、代码块、内部类

面向对象的三大特征：封装、继承、多态



**面向对象分析方法分析问题的思路和步骤**：

- 根据问题需要，选择问题所针对的现实世界中的实体。
- 从实体中寻找解决问题相关的属性和功能，这些属性和功能就形成了概念世界中的类。
- 把抽象的实体用计算机语言进行描述，形成计算机世界中类的定义。即借助某种程序语言，把类构造成计算机能够识别和处理的数据结构。
- 将类实例化成计算机世界中的对象。对象是计算机世界中解决问题的最终工具。



类是一种对事物的抽象，对象是对类的实例化。🤣	——沃兹基 · 硕德



## 权限属性

public可以被类外所看见，而private不能。这体现了面向对象中的封装特性。



## 字段和方法

在类里面，定义一些描述对象属性的变量称作为字段（Field）。而对象的行为，叫做方法（Method）。可以简单理解，写在类内的变量是字段，写在类内的函数叫做方法。

```java
class Person{
	String name;
	int age;
    public String getName(){
        return name;
    }
    public void setName(String name){
        this.name = name;
    }
    // ...
};
```



## 构造器

构造器是用于构造对象的方法，一般来说用于做一些初始化的工作。

```java
class Person{
    String name;
	int age;
    public Person(){
        this.name = "";
        this.age = -1;
    }
    public Person(String name){
        this.name = name;
    }
    public Person(int age){
        this.name = "";
        this.age = age;
    }
    public Person(String name, int age){
        this.name = name;
        this.age = age;
    }
};
Person p1 = new Person(19);
```

上面中的this可以用来区分类内的字段和参数。这里也演示了如何重载构造方法。



## 静态方法

静态方法是一种不依赖于对象的方法，准确来说是不属于对象，而是属于类。因为它不需要实例化出一个对象就能使用。比如一开始学的`main`方法。使用`static`让一个方法成为静态方法。

```java
class Person{
	public static void walk(){
        System.out.println("I am walking...");
    }  
};
```



## 重写方法与重载方法

重载是参数不同，重写是覆盖原来旧有的方法。

当继承类的时候就可以重写父类的方法，java默认所有的方法都可以被重写。

```java
class Person{
    public void doAction(){
        System.out.println("Doing something...");
    }
}
class Walker extends Person{
    public static void doAction(){
        System.out.println("I am walking...");
    }
}
Person p = new Walker();
p.doAction();
```



# 控制流

## 分支结构

### if-else条件判断结构

```java
结构一：
if(条件表达式){
	执行表达式
}

结构二：二选一
if(条件表达式){
	执行表达式1
}else{
	执行表达式2
}

结构三：n选一
if(条件表达式){
	执行表达式1
}else if(条件表达式){
	执行表达式2
}else if(条件表达式){
	执行表达式3
}
...
else{
	执行表达式n
}
```

**说明：**

- else 结构是可选的。
- 针对于条件表达式：
  - 如果多个条件表达式之间是“互斥”关系(或没有交集的关系),哪个判断和执行语句声明在上面还是下面，无所谓。
  - 如果多个条件表达式之间有交集的关系，需要根据实际情况，考虑清楚应该将哪个结构声明在上面。
  - 如果多个条件表达式之间有包含的关系，通常情况下，需要将范围小的声明在范围大的上面。否则，范围小的就没机会执行了。
- if-else结构是可以相互嵌套的。
- 如果if-else结构中的执行语句只有一行时，对应的一对{}可以省略的。但是，不建议省略。



### switch-case选择结构

```java
switch(表达式){
case 常量1:
	执行语句1;
	//break;
case 常量2:
	执行语句2;
	//break;
...
default:
	执行语句n;
	//break;
}
```

**使用说明：**

① 根据switch表达式中的值，依次匹配各个case中的常量。一旦匹配成功，则进入相应case结构中，调用其执行语句；当调用完执行语句以后，则仍然继续向下执行其他case结构中的执行语句，直到遇到break关键字或此switch-case结构末尾结束为止；

② break,可以使用在switch-case结构中，表示一旦执行到此关键字，就跳出switch-case结构；

③ switch结构中的表达式，只能是如下的6种数据类型之一：

`byte 、short、char、int、枚举类型(JDK5.0新增)、String类型(JDK7.0新增)` ④ case 之后只能声明常量。不能声明范围；

⑤ break关键字是可选的；

⑥ default:相当于if-else结构中的else，default结构是可选的，而且位置是灵活的；



## 循环结构

循环结构的四要素

① 初始化条件

② 循环条件 --->是boolean类型

③ 循环体

④ 迭代条件

说明：通常情况下，循环结束都是因为②中循环条件返回false了。

```java
//for循环结构
for(①;②;④){
	③
}
//执行过程：① - ② - ③ - ④ - ② - ③ - ④ - ... - ②

//while循环结构
①
while(②){
	③;
	④;
}
//执行过程：① - ② - ③ - ④ - ② - ③ - ④ - ... - ②

//do-while循环结构
①
do{
③;
④;
}while(②);
//执行过程：① - ③ - ④ - ② - ③ - ④ - ... - ②
```

for和while循环总结：

1. 一般来说我们都会从for、while中进行选择，实现循环结构。
2. for循环和while循环是可以相互转换的。区别：for循环和while循环的初始化条件部分的作用范围不同。



break和continue关键字的使用

|          | 使用范围               | 循环中的作用（不同点） | 相同点                     |
| -------- | ---------------------- | ---------------------- | -------------------------- |
| break    | switch-case 循环结构中 | 结束当前循环           | 关键字后面不能声明执行语句 |
| continue | 循环结构中             | 结束当次循环           | 关键字后面不能声明执行语句 |



# 数组

数组是同类型元素的一个集合，可以理解为是定义一些相同类型的变量，然后它们的地址是连续的。



## 定义

使用`类型[] 标识符`这样的形式来定义数组。

```java
int[] arr = {0,1,2,3};
arr[1] = 10;
System.out.println(arr[1]);
```



## 使用

使用`[]`下标来访问任意元素，数组下标从0开始。一个有4个元素的数组，下标范围是[0,3]。



# 常用类

## Scanner

`java.util.Scanner `是一个文本扫描器类，可以用于从键盘输入。例如下面这个从键盘获取一个数字的例子。

```java
Scanner s = new Scanner(System.in);
int i = s.nextInt();
System.out.println(i);
```



## String

`java.lang.String` 类用于存储字符串。

String保存字符串的一些特点：

- 使用一对`""`引起来表示字符串。

- String内部定义了 `final char[] value` 用于存储字符串数据，这决定了String的不可变性，如果需要改变其值就需要重新分配内存区域。

- String使用字面量赋值的时候，字符串存在常量池。

- String的比较应该使用equals方法。

String不可变性的测试代码：

```java
String s1 = "abc";//通过字面量的定义方式
String s2 = "def";
s1 = "hello";

System.out.println(s1 == s2); //false 比较s1与s2的地址值

System.out.println(s1);//hello
System.out.println(s2);//def

System.out.println("-----------------------");

String s3 = "abc";
s3 += "def";
System.out.println(s3);//abcdef
System.out.println(s2);//def

System.out.println("-----------------------");

String s4 ="test";
String s5 = s4.replace("t","b");
System.out.println(s4);//test
System.out.println(s5);//besb
```



### 创建String

创建String可以通过字面量赋值或者是通过new调用构造器来实例化。其中，字面值赋值创建的都是在常量池的字符串，而new的则是在堆开辟空间存储。可以理解为类似于

测试代码：

```java
//通过字面量定义的方式：此时的s1和s2的数据java声明在方法区中的字符串常量池中。
String s1 = "java";
String s2 = "java";
//通过new + 构造器的方式:此时的s3和s4保存的地址值，是数据在堆空间中开辟空间以后对应的地址值。
String s3 = new String("java");
String s4 = new String("java");

System.out.println(s1 == s2);//true
System.out.println(s1 == s3);//false
System.out.println(s1 == s4);//false
System.out.println(s3 == s4);//false
```



### 字符串拼接

前面提到两种字符串实例，前一种存在常量池，后一种存在堆区。而字符串拼接的时候，两个常量连接，结果会存在常量池，而且如果有一个堆区的变量，拼接结果就在堆区。前面那个`s1 == s2`可以看出来，同一个字面量初始化的String，其地址是一样的，说明了常量池不会存在一样的常量。

如果想要拼接结果在常量区可以使用`intern()` 方法，返回值就在常量池中。

字符串的拼接使用`+`。

```java
String s1 = "java";
String s2 = "8";
String s3 = s1 + s2;
String s4 = s3.intern();
```



### 常用方法

#### 操作字符

1. `int length()`：返回字符串的长度： `return value.length`
2. `char charAt(int index)`： 返回某索引处的字符 `return value[index]`
3. `boolean isEmpty()`：判断是否是空字符串：`return value.length == 0`
4. `String toLowerCase()`：使用默认语言环境，将 String 中的所字符转换为小写
5. `String toUpperCase()`：使用默认语言环境，将 String 中的所字符转换为大写
6. `String trim()`：返回字符串的副本，忽略前导空白和尾部空白
7. `boolean equals(Object obj)`：比较字符串的内容是否相同
8. `boolean equalsIgnoreCase(String anotherString)`：与 `equals()` 方法类似，忽略大小写
9. `String concat(String str)`：将指定字符串连接到此字符串的结尾。 等价于用 `+`
10. `int compareTo(String anotherString)`：比较两个字符串的大小
11. `String substring(int beginIndex)`：返回一个新的字符串，它是此字符串的从beginIndex 开始截取到最后的一个子字符串。
12. `String substring(int beginIndex, int endIndex)` ：返回一个新字符串，它是此字符串从 beginIndex 开始截取到 endIndex (不包含)的一个子字符串。

**代码示例：**

```java
public void test2() {
    String s1 = "helloword";
    System.out.println(s1.length());//9
    System.out.println(s1.charAt(4));//o
    System.out.println(s1.isEmpty());//false

    String s2 = "HELLOword";
    System.out.println(s2.toLowerCase());//hellowod
    System.out.println(s2.toUpperCase());//HELLOWORD

    String s3 = " hello word ";
    System.out.println(s3.trim());//hello word
    String s4 = "helloword";
    System.out.println(s4.equals(s1));//true
    System.out.println(s4.equalsIgnoreCase(s2));//true
    String s5 = "hello";
    System.out.println(s5.compareTo(s4));//-4 相等时返回0，小的时候返回负数
    System.out.println(s4.compareTo(s1));//0

    System.out.println(s4.substring(5));//word
    System.out.println(s4.substring(5, 9));//word,取值范围左开右闭

}
```

**判断字符：**

1. `boolean endsWith(String suffix)`：测试此字符串是否以指定的后缀结束
2. `boolean startsWith(String prefix)`：测试此字符串是否以指定的前缀开始
3. `boolean startsWith(String prefix, int toffset)`：测试此字符串从指定索引开始的子字符串是否以指定前缀开始

```java
public void test3() {
    String s1 = "javaEE";
    System.out.println(s1.endsWith("EE"));//true
    System.out.println(s1.startsWith("a"));//false
    System.out.println(s1.startsWith("EE", 4));//true

}
```



#### 查找字符串中的字符

1. `boolean contains(CharSequence s)：`当且仅当此字符串包含指定的 char 值序列时，返回 true
2. `int indexOf(String str)`：返回指定子字符串在此字符串中第一次出现处的索引
3. `int indexOf(String str, int fromIndex)`：返回指定子字符串在此字符串中第一次出现处的索引，从指定的索引开始
4. `int lastIndexOf(String str)`：返回指定子字符串在此字符串中最右边出现处的索引
5. `int lastIndexOf(String str, int fromIndex)`：返回指定子字符串在此字符串中最后一次出现处的索引，从指定的索引开始反向搜索

> 注：`indexOf` 和 `lastIndexOf` 方法如果未找到都是返回-1

**代码示例：**

```java
public void test3() {
    String s2="hello word";
    System.out.println(s2.contains("o"));//true
    System.out.println(s2.indexOf("h"));//0
    System.out.println(s2.indexOf("o", 5));//7
    System.out.println(s2.lastIndexOf("o"));//7
    System.out.println(s2.lastIndexOf("l", 2));//2
}
```



#### 字符串操作方法

1. 替换：
   - `String replace(char oldChar, char newChar)`：返回一个新的字符串，它是通过用 newChar 替换此字符串中出现的所 oldChar 得到的。
   - `String replace(CharSequence target, CharSequence replacement)`：使用指定的字面值替换序列替换此字符串所匹配字面值目标序列的子字符串。
   - `String replaceAll(String regex, String replacement)`：使用给定的 replacement 替换此字符串所匹配给定的正则表达式的子字符串。
   - `String replaceFirst(String regex, String replacement)`：使用给定的 replacement 替换此字符串匹配给定的正则表达式的第一个子字符串。
2. 匹配:
   - `boolean matches(String regex)`：告知此字符串是否匹配给定的正则表达式。
3. 切片：
   - `String[] split(String regex)`：根据给定正则表达式的匹配拆分此字符串。
   - `String[] split(String regex, int limit)`：根据匹配给定的正则表达式来拆分此字符串，最多不超过limit个，如果超过了，剩下的全部都放到最后一个元素中。

**代码示例:**

```java
public void test4() {
    String str1 = "北京你好，你好北京";
    String str2 = str1.replace('北', '南');

    System.out.println(str1);//北京你好，你好北京
    System.out.println(str2);//南京你好，你好南京

    String str3 = str1.replace("北京", "上海");
    System.out.println(str3);//上海你好，你好上海

    System.out.println("*************************");
    String str = "12hello34world5java7891mysql456";
    //把字符串中的数字替换成,，如果结果中开头和结尾有，的话去掉
    String string = str.replaceAll("\\d+", ",").replaceAll("^,|,$", "");
    System.out.println(string);//hello,world,java,mysql

    System.out.println("*************************");
    str = "12345";
    //判断str字符串中是否全部有数字组成，即有1-n个数字组成
    boolean matches = str.matches("\\d+");
    System.out.println(matches);//true
    String tel = "0571-4534289";
    //判断这是否是一个杭州的固定电话
    boolean result = tel.matches("0571-\\d{7,8}");
    System.out.println(result);//true


    System.out.println("*************************");
    str = "hello|world|java";
    String[] strs = str.split("\\|");
    for (int i = 0; i < strs.length; i++) {
        System.out.println(strs[i]);//依次输出hello word java
    }
    System.out.println();
    str2 = "hello.world.java";
    String[] strs2 = str2.split("\\.");
    for (int i = 0; i < strs2.length; i++) {
        System.out.println(strs2[i]);//依次输出hello word java
    }
}

```



### String与其他结构的转换

#### String与基本数据类型、包装类之间的转换

String --> 基本数据类型、包装类：调用包装类的静态方法：`parseXxx(str)`

基本数据类型、包装类 --> String:调用String重载的 `valueOf(xxx)`

**代码示例：**

```java
String str1 = "123";
int i = Integer.parseInt(str1);
System.out.println(i);
System.out.println(i == 123);//true

int j = 456;
String s = String.valueOf(j);
System.out.println(s);
System.out.println(s.equals("456"));//true
```



#### 与字符数组之间的转换

String --> char[]:调用String的 `toCharArray() char[]` --> String:调用String的构造器

**代码示例：**

```java
String s1 = "helloword";
char[] chars = s1.toCharArray();
for (int i = 0; i < chars.length; i++) {
    System.out.println(chars[i]);
}

char[] charArray = new char[]{'h', 'e', 'l', 'l', 'o'};
String s2 = new String(charArray);
System.out.println(s2);
```



#### 与字节数组之间的转换

编码：String --> byte[]:调用String的 `getBytes()`

解码：byte[] --> String:调用String的构造器

编码：字符串 -->字节 (看得懂 --->看不懂的二进制数据)

解码：编码的逆过程，字节 --> 字符串 （看不懂的二进制数据 ---> 看得懂

说明：解码时，要求解码使用的字符集必须与编码时使用的字符集一致，否则会出现乱码。

```java
String s1 ="你好java世界";
byte[] bytesArray = s1.getBytes();//使用默认字符集编码
System.out.println(Arrays.toString(bytesArray));//[-28, -67, -96, -27, -91, -67, 106, 97, 118, 97, -28, -72, -106, -25, -107, -116]

byte[] gbks = s1.getBytes("gbk");//使用gbk编码集合
System.out.println(Arrays.toString(gbks));//[-60, -29, -70, -61, 106, 97, 118, 97, -54, -64, -67, -25]

System.out.println("--------------------------------");

String str1=new String(bytesArray);//使用默认字符进行解码
System.out.println(str1);//你好java世界

String str2 = new String(gbks);//使用默认字符对gbk编码进行解码
System.out.println(str2);//���java����解码错误，出现中文乱码,原因：编码和解码不一致

String str3 = new String(gbks,"gbk");//使用gbk格式进行解码
System.out.println(str3);//你好java世界，解码正确，原因：编码和解码一致
```



#### 与StringBuffer、StringBuilder之间的转换

1.String -->StringBuffer、StringBuilder: 调用StringBuffer、StringBuilder构造器

```java
String str1 ="helloword";

StringBuffer stringBuffer = new StringBuffer(str1);
System.out.println(stringBuffer);//helloword

StringBuilder stringBuilder = new StringBuilder(str1);
System.out.println(stringBuilder);//helloword

stringBuffer.append("isStringBuffer");
System.out.println(stringBuffer);//hellowordandgood

stringBuilder.append("isStringBuider");
System.out.println(stringBuilder);
```



2.StringBuffer、StringBuilder -->String:

①调用String构造器； ②StringBuffer、StringBuilder的toString()

```java
StringBuffer sb1 = new StringBuffer("hello StringBuffer");
System.out.println(sb1);

StringBuilder sb2 = new StringBuilder("hello StringBuider");
System.out.println(sb2);

System.out.println("----------------------");

String str1 = new String(sb1);
System.out.println(str1);

String str2 = new String(sb2);
System.out.println(str2);

System.out.println("----------------------");
System.out.println(sb1.toString());
System.out.println(sb2.toString());
```



## StringBuffer

### 创建StringBuffer

StringBuffer类不同于 String，其对象必须使用构造器生成。

StringBuffer有三个构造器:

- `StringBuffer()`：初始容量为16的字符串缓冲区
- `StringBuffer(int size)`：构造指定容量的字符串缓冲区
- `StringBuffer(String str)`：将内容初始化为指定字符串内容



### 常用方法：

1. `StringBuffer append(xxx)`：提供了很多的 `append()` 方法，用于进行字符串拼接
2. `StringBuffer delete(int start,int end)`：删除指定位置的内容
3. `StringBuffer replace(int start, int end, String str)`：把[start,end)位置替换为str
4. `StringBuffer insert(int offset, xxx)`：在指定位置插入xxx
5. `StringBuffer reverse()` ：把当前字符序列逆转

当 append和insert时，如果原来vaue数组长度不够，可扩容。 如上这些方法支持方法链操作。 方法链的原理：

```java
@Override
public StringBuilder append(String str) {
    super.append(str);
    return this;
}
```

- `public int indexOf(String str)`：返回子串的下标
- `public String substring(int start,int end)`:返回一个从start开始到end索引结束的左闭右开区间的子字符串
- `public int length()`：获取字符串的长度
- `public char charAt(int n )`：返回指定位置的字符
- `public void setCharAt(int n ,char ch)`：设置指定位置的字符

**总结：**

增：`append(xxx)` ；

删：`delete(int start,int end)` ；

改：`setCharAt(int n ,char ch) `/` replace(int start, int end, String str)` ；

查：`charAt(int n )` ；

插：`insert(int offset, xxx)` ；

长度：`length()`;

遍历：`for() + charAt() `/` toString()`；

**代码示例：**

```java
StringBuffer s1 = new StringBuffer("abc");
System.out.println(s1);

System.out.println(s1.append("1"));//abc1
System.out.println(s1.delete(0, 1));//bc1
System.out.println(s1.replace(0, 1, "hello"));//helloc1
System.out.println(s1.insert(3, "v"));//helvloc1
System.out.println(s1.reverse());//1colvleh
```



## StringBuilder

StringBuilder和 StringBuffer非常类似，均代表可变的字符序列，而且提供相关功能的方法也一样，只是StringBuilder类没有加线程锁，执行效率更高。



### String、StringBuffer、StringBuilder三者的对比

- String:不可变的字符序列；底层使用 `char[]` 存储；占用内存（会不断的创建和回收对象）
- StringBuffer:可变的字符序列；线程安全的，效率低；线程安全；底层使用char[]存储；
- StringBuilder:可变的字符序列；jdk5.0新增的，线程不安全的，效率高；线程不安全；底层使用 `char[]` 存储

> 注意：作为参数传递的话，方法内部String不会改变其值， StringBuffer和 StringBuilder会改变其值。



### 对比String、StringBuffer、StringBuilder三者的执行效率

从高到低排列：StringBuilder > StringBuffer > String



# 常用集合（ArrayList和HashMap）

所谓集合就是用于装数据的东西。Java里，集合的类型很多，这里就介绍两种典型的容器。ArrayList是一种List的实现，List是一种表，ArrayList则是底层使用数组实现的一种表。

任何对象加入集合类后，自动转变为Object类型，所以在取出的时候，需要进行强制类型转换。判断里面存着对象是不是某个类，从而能够正确强制转换，应该使用`instanceof`来判断，而不是直接强转。



## ArrayList的常用方法

| 返回值     | 方法和描述                                                   |
| ---------- | ------------------------------------------------------------ |
| `boolean`  | `add(E e)`  将指定的元素追加到此列表的末尾。                 |
| `void`     | `add(int index, E element)`  在此列表中的指定位置插入指定的元素。 |
| `void`     | `clear()`  从列表中删除所有元素。                            |
| `boolean`  | `contains(Object o)`  如果此列表包含指定的元素，则返回 `true` 。 |
| `void`     | `forEach(Consumer<? super E> action)`  对 `Iterable`的每个元素执行给定的操作，直到所有元素都被处理或动作引发异常。 |
| `E`        | `get(int index)`  返回此列表中指定位置的元素。               |
| `int`      | `indexOf(Object o)`  返回此列表中指定元素的第一次出现的索引，如果此列表不包含元素，则返回-1。 |
| `boolean`  | `isEmpty()`  如果此列表不包含元素，则返回 `true` 。          |
| `E`        | `remove(int index)`  删除该列表中指定位置的元素。            |
| `void`     | `replaceAll(UnaryOperator<E> operator)`  将该列表的每个元素替换为将该运算符应用于该元素的结果。 |
| `int`      | `size()`  返回此列表中的元素数。                             |
| `void`     | `sort(Comparator<? super E> c)`  使用提供的 `Comparator`对此列表进行排序以比较元素。 |
| `Object[]` | `toArray()`  以正确的顺序（从第一个到最后一个元素）返回一个包含此列表中所有元素的数组。 |

所有的方法里面，就只有`forEach`不太容易理解如何使用。通过它来理解lambada表达式和接口的知识。

所谓的lambda表达式还有接口，说到底就是一个方法作为参数传入。lambda的语法就是`(param)->{代码块}`，代码块如果是一条语句那可以不用加大括号。如果参数是一个，也可以不加小括号。

```java
// 创建一个数组
ArrayList<Integer> numbers = new ArrayList<>();//这个<>是模板参数缺省的写法。

// 往数组中添加元素
numbers.add(1);
numbers.add(2);
numbers.add(3);
numbers.add(4);
System.out.println("ArrayList: " + numbers);

// 所有元素乘以 10
System.out.print("更新 ArrayList: ");

// 将 lambda 表达式传递给 forEach
numbers.forEach((e) -> {
    e = e * 10;
    System.out.print(e + " ");
});
```



## HashMap简单使用

```java
Map<String, String> map = new HashMap<String, String>();
map.put("1", "value1");
map.put("2", "value2");
map.put("3", "value3");

for (Map.Entry<String, String> entry : map.entrySet()) {
System.out.println("key= " + entry.getKey() + " and value= " + entry.getValue());
}
```



## 函数式的方式来操作集合

所谓的函数式，就是利用lambda函数和接口。在此之前，先看一段代码。

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class FilterAndCollectExample {
    public static void main(String[] args) {
        // 创建一个HashMap，存储一些值
        Map<String, Integer> map = new HashMap<>();
        map.put("A", 10);
        map.put("B", 20);
        map.put("C", 30);
        map.put("D", 40);

        // 过滤出值大于等于30的所有元素，并将它们收集到一个ArrayList中
        List<Integer> filteredValues = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : map.entrySet()) {
            if (entry.getValue() >= 30) {
                filteredValues.add(entry.getValue());
            }
        }

        // 打印过滤后的结果
        System.out.println(filteredValues);
    }
}
```

而如果利用函数式的写法，则是使用`filter`和`collect`。

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class FilterAndCollectExample {
    public static void main(String[] args) {
        // 创建一个HashMap，存储一些值
        Map<String, Integer> map = new HashMap<>();
        map.put("A", 10);
        map.put("B", 20);
        map.put("C", 30);
        map.put("D", 40);

        // 使用Stream API过滤出值大于等于30的所有元素，并将它们收集到一个ArrayList中
        List<Integer> filteredValues = map.values().stream()
                .filter(value -> value >= 30)
                .collect(Collectors.toList());

        // 打印过滤后的结果
        System.out.println(filteredValues);
    }
}
```



# 简单使用Runable实现多线程来了解接口应用

在此之前，我们所有的代码都是单线程的，也就是不能同时做两件事。通过多线程，就可以实现同时做两件事，这一点对于需要并行的事情尤为重要。

当使用实现`Runnable`接口来实现多线程时，需要创建一个类，实现`Runnable`接口，并在其中重写`run()`方法。然后，创建`Thread`对象，并将实现了`Runnable`接口的类的实例作为参数传递给`Thread`的构造函数。最后，调用`Thread`对象的`start()`方法来启动线程。

```java
public class MyRunnable implements Runnable {
    @Override
    public void run() {
        // 在这里编写需要在新线程中执行的代码
        System.out.println("Hello from a new thread!");
    }

    public static void main(String[] args) {
        // 创建一个实现了Runnable接口的对象
        MyRunnable myRunnable = new MyRunnable();

        // 创建一个Thread对象，并将myRunnable作为参数传递给Thread的构造函数
        Thread thread = new Thread(myRunnable);

        // 启动线程
        thread.start();
    }
}
```



# 使用gradle管理项目

先谈谈Java的包管理，在早期是使用maven的，但因为maven这种xml格式写起来难以维护，可读性不高，于是就有了gradle。而gradle，可以使用Groovy语言撰写，也可以使用Kotlin。通过配置依赖，就能利用前人的代码，减少造轮子。

下面就先了解一下基本概念。

1. **构建脚本（Build Script）**: Gradle使用Groovy或Kotlin编写的构建脚本来定义项目的构建逻辑。构建脚本通常命名为`build.gradle`，位于项目根目录下。
2. **任务（Task）**: 任务是Gradle构建过程的基本单元。每个任务执行一个特定的操作，例如编译代码、运行测试、打包应用等。你可以自定义任务，并在构建脚本中指定任务之间的依赖关系。
3. **插件（Plugin）**: 插件是Gradle的扩展模块，用于提供特定的功能或集成第三方工具。Gradle附带了许多内置插件，例如Java插件、Android插件等。你也可以编写自己的插件或使用其他人已经开发的插件。
4. **依赖管理（Dependency Management）**: Gradle允许你声明项目所依赖的外部库和模块。你可以通过依赖配置块来指定依赖项的名称、版本和来源。Gradle会自动下载和管理这些依赖项。
5. **任务生命周期（Task Lifecycle）**: Gradle的任务执行遵循生命周期的概念。每个任务都有不同的生命周期阶段，例如预配置、配置、执行等。可以在适当的生命周期阶段添加自定义逻辑。
6. **构建类型（Build Types）**: 对于Android项目来说，Gradle支持构建类型的概念，例如Debug、Release等。每个构建类型可以具有不同的构建配置和行为。

用最简单的例子距离。

```java
plugins {
    id 'java'
}

group 'me.canrad'
version '1.0-SNAPSHOT'

repositories {
    mavenCentral()
}

dependencies {
    testImplementation 'org.junit.jupiter:junit-jupiter-api:5.8.1'
    testRuntimeOnly 'org.junit.jupiter:junit-jupiter-engine:5.8.1'
}

test {
    useJUnitPlatform()
}
```

`plugins`这里指明插件是`java`。`group`定义了项目属于哪个组，然后`version`是当前编译出来包的版本。`repositories`则是包的仓库（去哪里下载包），`mavenCentral()`代表了从maven的中央仓库去下载依赖包。`dependencies`则是依赖包的信息。`test`这个是`junit`的测试任务。
