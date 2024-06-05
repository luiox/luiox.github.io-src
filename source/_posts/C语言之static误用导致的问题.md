title: C语言之static误用导致的问题
author: Canrad
tags: C
date: 2024-06-05 19:37:09
---
前段时间，我在为步进电机撰写驱动程序的时候，遇到了一个问题。当时是做一个比赛，所以时间比较匆忙，我就没有仔细考虑，为了求快，导致写代码比较随意。然后就写出了一个bug，我当时是没有办法解决因为我很急，而且事情很多。现在事情过去了，我就写一个总结。

当时我在`motor.h`头文件里写了大致如下的代码。

```c
// ...
typedef struct {
    // ...
} step_motor_t;
static step_motor_t g_motor1 = {
    .xxx = xxx,
    // ...
};
static step_motor_t g_motor2 = {
    .xxx = xxx,
    // ...
};
// ...
```

然后我就发现一个问题，编译器告诉我，`g_motor1`重定义，我当时觉得是因为我没有加`header guard`，然后我就加了。

之后就发生了一个神奇的事情，编译器不再抱怨我的代码有错误，但是我就是不能在中断里面通过全局变量来修改状态。之后，我尝试各种方法都不行。然后我利用ST-LINK进行单步调试，发现同样叫`g_motor1`的变量，即使是在函数里没有改变这个变量，只是读取，但是在进出函数时候有两个状态。

这个时候，我想到可能有两个都叫做`g_motor1`的变量，于是就写了一个demo来测试和印证我的想法。下面是具体的代码。

`motor.h`的内容

```c
#ifndef MOTOR_H
#define MOTOR_H

#include <stdint.h>

typedef struct {
    int32_t speed;
    // ...
} step_motor_t;

static step_motor_t g_motor1 = {
    .speed = 300,
    // ...
};

static step_motor_t g_motor2 = {
    .speed = 300,
    // ...
};

void motor_init();

#endif // !MOTOR_H
```

`motor.c`的内容

```c
#include "motor.h"
#include <stdio.h>

void motor_init()
{
	printf("Motor1 speed: %d\n", g_motor1.speed);
	printf("Motor2 speed: %d\n", g_motor2.speed);
	// ...
}
```

`main.c`的内容

```c
#include "motor.h"

int main() 
{
	g_motor1.speed = 400;
	g_motor2.speed = 500;
	motor_init();
	printf("Motor1 speed: %d\n", g_motor1.speed);
	printf("Motor2 speed: %d\n", g_motor2.speed);
	return 0;
}

```

事实却是是如此，输出内容如下。

```text
Motor1 speed: 300
Motor2 speed: 300
Motor1 speed: 400
Motor2 speed: 500
```

完全和预期不一样，我想应该大多数人和我一样，都觉得`g_motor1.speed = 400;`会改变`motor_init`函数内的输出内容。实际上并不是这样的，通过观察汇编，发现对于`g_motor1`一个地址是`02FA000h`，另外一个是`02FA00Ch`。

这就说明，一个名字可能是有两个变量。造成这样的原因就是因为`static`的误用。

在我的固有印象里，如果在头文件里写下面这样的代码，是会重定义的。

```c
void motor_set_speed(step_motor_t* motor, int32_t speed)
{
    motor->speed = speed;
}
```

为此，我们通常会为函数加上`static`修饰，从而能够避免重定义，因为`static`可以把范围框定在文件内。通过VS2022来观察，会发现不管是在`motor.c`还是`main.c`内调用的`motor_set_speed`的函数地址是一样的。于是，就很容易推论到变量上也是一样的来解决重定义问题，但是实际上会导致变量变为多份。

这根本原因是在于c文件`#include`的时候，头文件中的`static`变量每次被拷贝到一个c文件里，就会产生新的一份，而且他们的名字都一样。

因此就总结出来一条经验，**禁止在头文件内定义`static`变量**，而是按照下面这样的方法，在头文件中`extern`，然后在源文件中定义`static`变量。

`motor.h`的内容。

```c
#ifndef MOTOR_H
#define MOTOR_H

#include <stdint.h>

typedef struct {
    int32_t speed;
    // ...
} step_motor_t;

extern step_motor g_motor1;
extern step_motor g_motor2;

void motor_init();

#endif // !MOTOR_H
```

`motor.c`的内容。

```c
#include "motor.h"

static step_motor_t g_motor1 = {
    .speed = 300,
    // ...
};
static step_motor_t g_motor2 = {
    .speed = 300,
    // ...
};

// ...
```

一般来说，我都尽量不使用全局变量，但是在嵌入式开发中，因为中断函数没有办法传参，所以只能通过全局变量来解决。

