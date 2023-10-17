---
title: 【FreeRTOS】内存管理之heap_1源码分析
date: 2023-10-17 22:25:01
tags: FreeRTOS
---

## 概述

内存管理是写一个程序中最重要的事情，因此，在阅读其他源码之前，先弄明白内存管理，才能为后面打下基石。源码版本：202212.01

整个`heap_1.c`里面有`pvPortMalloc`、`vPortFree`、`vPortInitialiseBlocks`和`xPortGetFreeHeapSize`函数。因为`heap_1.c`提供的内存分配是只分配不回收的，所以可以只关心`pvPortMalloc`函数。



## 整体概览

把一些暂时不用的内容先删掉，代码如下。函数一开始定义了`pvReturn`指针用于指向分配的内存开始的地址，在函数的结束返回这个地址。可以看到整个函数被`vTaskSuspendAll`和`xTaskResumeAll`包裹起来。这个作用是什么呢？仔细观察函数，会发现在这个函数里面，不仅仅是用到了全局变量`ucHeap`而且还用了一个静态变量`pucAlignedHeap`。这导致了一个问题，就是函数不可重入，因为函数执行的正确是依赖于这些变量的状态的，而如果被重入，那这些变量会被覆盖，导致前一次调用失败。这便是为什么要用`vTaskSuspendAll`和`xTaskResumeAll`包裹分配内存部分代码的原因。这两个函数，前者是将所有的任务挂起，这目的就是不能有任何一个任务抢走当前调用内存分配任务对CPU的控制权，而在完成了内存分配的事情以后再恢复所有任务。

```c
void * pvPortMalloc( size_t xWantedSize )
{
    void * pvReturn = NULL;
    static uint8_t * pucAlignedHeap = NULL;
    vTaskSuspendAll();
    {
        /* Check there is enough room left for the allocation and. */
        if( ( xWantedSize > 0 ) &&                                /* valid size */
            ( ( xNextFreeByte + xWantedSize ) < configADJUSTED_HEAP_SIZE ) &&
            ( ( xNextFreeByte + xWantedSize ) > xNextFreeByte ) ) /* Check for overflow. */
        {
            /* Return the next free byte then increment the index past this
             * block. */
            pvReturn = pucAlignedHeap + xNextFreeByte;
            xNextFreeByte += xWantedSize;
        }

        traceMALLOC( pvReturn, xWantedSize );
    }
    ( void ) xTaskResumeAll();

    return pvReturn;
}
```

前面为了能够更容易看清楚代码的结构，因而删了一部分的代码。下面从原始代码开始分析`FreeRTOS`对于内存具体是怎么分配的。为了能够方便按照代码局部分析，原始代码放在这一小节的末尾。



## 申请内存的内存对齐

首先是一个`#if ( portBYTE_ALIGNMENT != 1 )`的预处理指令用于控制是否启用内存对齐。接着看`#if ( portBYTE_ALIGNMENT != 1 )`里面的，根据`xWantedSize`也就是想要申请的内存大小按位与上`portBYTE_ALIGNMENT_MASK`，而`portBYTE_ALIGNMENT_MASK`是一个宏，代表几字节对齐方式。在这里，我这个根据`portBYTE_ALIGNMENT`宏显示8个字节对齐。这里又根据`portBYTE_ALIGNMENT`的值来确定掩码宏`portBYTE_ALIGNMENT_MASK`的值。这里8字节对齐，然后让`portBYTE_ALIGNMENT_MASK`等于`0x0007`。`0x0007`用二进制表示就是`0111`（前面的零我省略了），这个值按位与上`xWantedSize`就能知道，如果传入想要申请的内存的大小如果是不能被8整除，也就是通过按位与的时候，后面三个位如果是有，那就说明是不能被8整除的，也就是需要字节对齐的情况。

然后内存对齐还需要检查，当字节对齐以后会不会产生内存溢出，如果是会导致内存溢出，那显然是不能成功申请内存的。`( xWantedSize & portBYTE_ALIGNMENT_MASK )`根据前面可以知道这个表达式的作用就是拿到字节对齐操作时候后面的那几个位。然后通过`portBYTE_ALIGNMENT`减去这个值，这个的含义就是申请内存大小中字节对齐缺少的大小。之后再用`xWantedSize`加上这个缺少的大小，如果说是大于`xWantedSize`说明的是需要字节对齐，并且不会溢出，而如果是小于那么则是溢出了，就需要把终止申请内存的操作，而相等是不可能的，因为前面检查字节对齐的时候，这里如果会产生相等，那么也就是说前面肯定是不需要内存对齐。而前面的if已经判断了需要内存对齐。

接下来带入几个申请内存的值然后检验。比如，需要申请3个或者是11个字节，3对应的二进制是`00011`而11对应的二进制是`01011`。分别按位与上`00111`（`0x07`），可以发现都是一样，拿到的值是`0011`，也就是3。此时判断需要内存对齐的if就为真，那么再计算判断溢出。这里就按照申请3个字节算，其他也是一样的计算方法。`xWantedSize & portBYTE_ALIGNMENT_MASK`的值是我们算出来的3，然后`portBYTE_ALIGNMENT`是8，也就是内存对齐需要8-3=5个字节，然后加上前面需要申请的3个字节，也就是8，是大于3的，所以这种情况下不会溢出。可以看到的是，我们申请一个3个字节的大小，但是为了内存对齐，所以就对齐为8个字节。至于按照多少个字节对齐，那就是通过`portBYTE_ALIGNMENT`宏来控制。

```c
#define portBYTE_ALIGNMENT        8
#if portBYTE_ALIGNMENT == 32
    #define portBYTE_ALIGNMENT_MASK    ( 0x001f )
#elif portBYTE_ALIGNMENT == 16
    #define portBYTE_ALIGNMENT_MASK    ( 0x000f )
#elif portBYTE_ALIGNMENT == 8
    #define portBYTE_ALIGNMENT_MASK    ( 0x0007 )
#elif portBYTE_ALIGNMENT == 4
    #define portBYTE_ALIGNMENT_MASK    ( 0x0003 )
#elif portBYTE_ALIGNMENT == 2
    #define portBYTE_ALIGNMENT_MASK    ( 0x0001 )
#elif portBYTE_ALIGNMENT == 1
    #define portBYTE_ALIGNMENT_MASK    ( 0x0000 )
#else /* if portBYTE_ALIGNMENT == 32 */
    #error "Invalid portBYTE_ALIGNMENT definition"
#endif /* if portBYTE_ALIGNMENT == 32 */
void * pvPortMalloc( size_t xWantedSize )
{
    void * pvReturn = NULL;
    static uint8_t * pucAlignedHeap = NULL;

    /* portBYTE_ALIGNMENT 宏的作用是决定是否确保所有的块都已经正确的内存对齐。 */
    #if ( portBYTE_ALIGNMENT != 1 )
    {
        if( xWantedSize & portBYTE_ALIGNMENT_MASK )
        {
            /* 字节对齐需要检查内存溢出问题。 */
            if( ( xWantedSize + ( portBYTE_ALIGNMENT - ( xWantedSize & portBYTE_ALIGNMENT_MASK ) ) ) > xWantedSize )
            {
                xWantedSize += ( portBYTE_ALIGNMENT - ( xWantedSize & portBYTE_ALIGNMENT_MASK ) );
            }
            else
            {
                xWantedSize = 0;
            }
        }
    }
    #endif /* if ( portBYTE_ALIGNMENT != 1 ) */
	// ...
}
```



## 寻找堆的起始内存对齐地址

分析代码一开始的时候，就已经提到过`vTaskSuspendAll`是用于挂起所有的中断任务。接下来，我们要把关注点放在`pucAlignedHeap`这个静态变量上，首先是一个判断`NULL`，为空了以后再让这个指针指向一个内存对齐的地址。我们需要知道的一个点是静态的局部变量初始化了以后，再次进入这个函数是不会初始化的，这就意味着，这个if只会在第一次调用函数的时候执行，而第一次，我们需要确定堆地址对齐以后的边界地址。接下来分析这个复杂的表达式，其中`ucHeap`是一个全局的字节数组用于当堆内存。`ucHeap[ portBYTE_ALIGNMENT - 1 ]`拿到的是这个数组最后一个元素的地址，因为是字节数组，所以我们也可以认为这个就是堆的最高地址。接下来，这里不要认为是一个按位与，正确理解是一个取地址的含义。然后通过强制类型转换为`portPOINTER_SIZE_TYPE`类型，也就是指针大小的类型，无需关系这个类型是什么，只需要知道这个类型的大小和指针一样大就行，我这里是32位。

接着，`( portPOINTER_SIZE_TYPE ) portBYTE_ALIGNMENT_MASK` 是将 `portBYTE_ALIGNMENT_MASK` 强制转换为 `portPOINTER_SIZE_TYPE` 类型。`portBYTE_ALIGNMENT_MASK` 是一个掩码，前面已经知道它的值是`0x0007`，通过强制类型转换，可以把它扩展为跟`portPOINTER_SIZE_TYPE`类型一样的大小，也就是左边添0，此时也就是只有最低的三个为是1，其余都是0。然后一个`~`用于按位取反。取反之前，如果按位与与上`ucHeap[ portBYTE_ALIGNMENT - 1 ]`，那么拿到的是堆起始地址的最低3位，而取反以后再按位与则恰恰相反，是去掉最低的3位。这样就完成了找到内存对齐后堆的起始地址。

```c
if( pucAlignedHeap == NULL )
{
	/* 确保块开始在一个正确的对齐边界。 */
	pucAlignedHeap = ( uint8_t * ) ( ( ( portPOINTER_SIZE_TYPE ) & ucHeap[ portBYTE_ALIGNMENT - 1 ] ) & ( ~( ( portPOINTER_SIZE_TYPE ) portBYTE_ALIGNMENT_MASK ) ) );
}
```



## 分配内存

分配内存之前要做好各种检查，包括申请内存的大小是否合法（申请内存的大小不能是负数也不能是0个字节），是否有足够的内存可用于内存分配和是否会产生堆溢出问题。

这里，有一个全局的`xNextFreeByte`变量用于存储下一个空闲字节的下标。`pvReturn`是申请内存的起始地址，等于堆起始地址加上下一个空闲字节的索引。每次申请过以后，`xNextFreeByte`都会往后挪动，保证存储的是下一个空闲字节的索引。

```c
/* ucHeap数组的索引 */
static size_t xNextFreeByte = ( size_t ) 0;
/* 检查是否有足够的空间用于分配。 */
if( ( xWantedSize > 0 ) &&                                /* 有效大小 */
	( ( xNextFreeByte + xWantedSize ) < configADJUSTED_HEAP_SIZE ) &&
	( ( xNextFreeByte + xWantedSize ) > xNextFreeByte ) ) /* 检查溢出。 */
{
	/* 返回下一个空闲字节，然后将索引递增超过这个内存块。 */
	pvReturn = pucAlignedHeap + xNextFreeByte;
	xNextFreeByte += xWantedSize;
}
```



## Malloc追踪和内存分配失败Hook

`traceMALLOC`的作用是用于追踪`Malloc`申请内存，这里调用`traceMALLOC`，把申请内存的地址和申请的内存大小都传入了。一般可以用来做以下三件事。

- 内存泄漏：通过分析内存分配和释放的记录，开发者可以确定是否存在未释放的内存块，从而及时修复潜在的内存泄漏问题。

- 内存错误：跟踪内存分配可以帮助开发人员检测悬挂指针、重复释放等内存操作错误，提高程序的健壮性和可靠性。
- 性能优化：分析内存分配的模式和频率可以帮助开发者了解程序的内存使用情况，进而进行性能调优，减少内存碎片化、提高内存利用率等。

```c
traceMALLOC( pvReturn, xWantedSize );
#if ( configUSE_MALLOC_FAILED_HOOK == 1 )
{
    if( pvReturn == NULL )
    {
        vApplicationMallocFailedHook();
    }
}
#endif
```

想要使用这个来追踪内存分配，只需要定义一个`traceMALLOC`宏，然后定义一个函数，参数是`pvReturn`和`xWantedSize`。下面就是我写的一个例子用于追踪内存分配，然后打印信息。

```c
#define traceMALLOC MallocDebug
void MallocDebug(void * pvMemory, size_t xWantedSize)
{
    printf("pvMemory:%X\n", pvMemory);
    printf("xWantSize:%ud\n", xWantedSize);
}
```



接下来讲一下如何Hook内存分配失败的情况，也就是`FreeRTOS`为我们提前预留了，如果内存分配失败调用处理的接口。比如，我们想要在内存分配失败以后，退出程序，或者是调试等等。使用这个Hook，首先需要找到`configUSE_MALLOC_FAILED_HOOK`宏的定义，将其改为1，也就是启用这个Hook的功能。然后写一个`vApplicationMallocFailedHook`函数。这个的函数原型如下。

```c
void vApplicationMallocFailedHook( void );
```



## 内存分配的示意图

![heap_1.jpg](assets/heap_1.jpg)



## 原始代码

```c
void * pvPortMalloc( size_t xWantedSize )
{
    void * pvReturn = NULL;
    static uint8_t * pucAlignedHeap = NULL;

    /* portBYTE_ALIGNMENT 宏的作用是决定是否确保所有的块都已经正确的内存对齐。 */
    #if ( portBYTE_ALIGNMENT != 1 )
    {
        if( xWantedSize & portBYTE_ALIGNMENT_MASK )
        {
            /* 字节对齐需要检查内存溢出问题。 */
            if( ( xWantedSize + ( portBYTE_ALIGNMENT - ( xWantedSize & portBYTE_ALIGNMENT_MASK ) ) ) > xWantedSize )
            {
                xWantedSize += ( portBYTE_ALIGNMENT - ( xWantedSize & portBYTE_ALIGNMENT_MASK ) );
            }
            else
            {
                xWantedSize = 0;
            }
        }
    }
    #endif /* if ( portBYTE_ALIGNMENT != 1 ) */

    vTaskSuspendAll();
    {
        if( pucAlignedHeap == NULL )
        {
            /* 确保块开始在一个正确的对齐边界。 */
            pucAlignedHeap = ( uint8_t * ) ( ( ( portPOINTER_SIZE_TYPE ) & ucHeap[ portBYTE_ALIGNMENT - 1 ] ) & ( ~( ( portPOINTER_SIZE_TYPE ) portBYTE_ALIGNMENT_MASK ) ) );
        }

        /* 检查是否有足够的空间用于分配。 */
        if( ( xWantedSize > 0 ) &&                                /* 有效大小 */
            ( ( xNextFreeByte + xWantedSize ) < configADJUSTED_HEAP_SIZE ) &&
            ( ( xNextFreeByte + xWantedSize ) > xNextFreeByte ) ) /* 检查溢出。 */
        {
			/* 返回下一个空闲字节，然后将索引递增超过这个内存块。 */
            pvReturn = pucAlignedHeap + xNextFreeByte;
            xNextFreeByte += xWantedSize;
        }

        traceMALLOC( pvReturn, xWantedSize );
    }
    ( void ) xTaskResumeAll();

    #if ( configUSE_MALLOC_FAILED_HOOK == 1 )
    {
        if( pvReturn == NULL )
        {
            vApplicationMallocFailedHook();
        }
    }
    #endif

    return pvReturn;
}
```
