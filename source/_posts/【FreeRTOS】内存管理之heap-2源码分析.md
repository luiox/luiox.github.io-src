---
title: 【FreeRTOS】内存管理之heap-2源码分析
date: 2023-10-28 19:52:01
tags: FreeRTOS
---

# heap_2.c

`heap_2`的内存分配方式就与之前的`heap_1`差距比较大。我们主要关心`pvPortMalloc`和`vPortFree`函数。而`pvPortCalloc`只不过是对`pvPortMalloc`的进一步封装。下面我先列出`heap_2.c`中所有函数的作用。

| 函数名                | 作用                             |
| --------------------- | -------------------------------- |
| prvHeapInit           | 初始化堆                         |
| pvPortMalloc          | 申请内存（单纯申请，无其他操作） |
| vPortFree             | 归还内存                         |
| xPortGetFreeHeapSize  | 获取空闲内存大小                 |
| vPortInitialiseBlocks | 初始化块                         |
| pvPortCalloc          | 申请内存（初始化为某个值）       |

在对整个`heap_2`有了一定初步了解以后，接下来先看其中最重要的结构——链表。整个内存相关的操作都是围绕链表产生的，因此必须搞明白[链表](https://zh.wikipedia.org/wiki/%E9%93%BE%E8%A1%A8)是什么，然后再搞明白`FreeRTOS`中的这个链表。



## BlockLink_t

`FreeRTOS`通过`BlockLink_t`结构体来制作了一个链表，从而让内存块连接起来，方便管理。下面是其定义。

```c
typedef struct A_BLOCK_LINK
{
    struct A_BLOCK_LINK * pxNextFreeBlock;
    size_t xBlockSize;
} BlockLink_t;
```

如果对链表有一定理解的话，那么就会想到，我们写的经典链表都是分为数据域和指针域的。也就是说链表的节点，一部分用于存储数据，一部分用于存放指针，指向下一个节点。这里不一样的地方在于需要标识一个内存块到底是不是空闲的。如果按照常规思路，势必需要定义一个变量用于存储当前这个内存块是否是空闲的，但是`FreeRTOS`把`xBlockSize`拆开来，从里面拿出一个最高位当做是是否是空闲内存块的标志位。这么做的目的就是减少管理内存时候产生的内存消耗。可以看下面这些在`heap_2.c`里的宏。

```c
/* 假设一个字节是8个位! */
#define heapBITS_PER_BYTE           ((size_t)8)

/* 假定使用size_t类型的最大值作为堆的最大值. */
#define heapSIZE_MAX                (~((size_t)0))

/* 检查a和b相乘是否会导致溢出. */
#define heapMULTIPLY_WILL_OVERFLOW(a, b)    (((a) > 0) && ((b) > (heapSIZE_MAX / (a))))

/* 检查a和b相加是否会导致溢出. */
#define heapADD_WILL_OVERFLOW(a, b)         ((a) > ( heapSIZE_MAX - (b)))

/* BlockLink_t结构的xBlockSize成员的MSB用于跟踪块的分配状态。
 * 当BlockLink_t的xBlockSize成员的MSB被设置为1，则该块属于该应用程序。
 * 当该位为0时，该块是空闲堆空间的一部分。*/
#define heapBLOCK_ALLOCATED_BITMASK    (((size_t)1) << ((sizeof(size_t) * heapBITS_PER_BYTE) - 1))
#define heapBLOCK_SIZE_IS_VALID(xBlockSize)    (((xBlockSize) & heapBLOCK_ALLOCATED_BITMASK) == 0)
#define heapBLOCK_IS_ALLOCATED(pxBlock)        (((pxBlock->xBlockSize) & heapBLOCK_ALLOCATED_BITMASK) != 0)
#define heapALLOCATE_BLOCK(pxBlock)            ((pxBlock->xBlockSize ) |= heapBLOCK_ALLOCATED_BITMASK)
#define heapFREE_BLOCK(pxBlock)                ((pxBlock->xBlockSize ) &= ~heapBLOCK_ALLOCATED_BITMASK)
```

首先`heapBITS_PER_BYTE`定义了一个字节的大小，因为之后做位运算的时候，`sizeof`计算得到的仅仅只是字节数，而不是位数，需要乘上一个字节有多少个位。然后看`heapBLOCK_ALLOCATED_BITMASK`，这是定义了分配内存块时候使用的一个掩码。`(sizeof(size_t) * heapBITS_PER_BYTE)`就是我所说的，利用`sizeof`和一个字节有多少个位，来计算`size_t`类型有多少个位，之后的减一目的是为了留一个位用于存储内存块的状态。`((size_t)1)`把1先扩展到`size_t`的大小，然后左移前面计算出来的位数，把1移到`size_t`的最高位。下面是一个示意图。
![heap_2-1](assets/heap_2-1.jpg)

理解掩码以后，再来看`heapBLOCK_IS_ALLOCATED`宏，就能理解`(((pxBlock->xBlockSize) & heapBLOCK_ALLOCATED_BITMASK) != 0)`实际上就是通过按位与上掩码拿到`xBlockSize`的最高位。由此，也能推断出，最高位如果等于1代表这个内存块是被分配出去给应用程序了。在`FreeRTOS`原本的注释中写到`MSB`，实际上指的就是最高有效位（Most Significant Bit，MSB）。

接下来看剩余的宏，`heapBLOCK_SIZE_IS_VALID`用于判断一个内存块的大小是否是有效的。`(((xBlockSize) & heapBLOCK_ALLOCATED_BITMASK) == 0)`刚好就是与上最高位，判断这个是否等于0，如果是0，则是代表这个内存块是空闲，也就是内存块还是属于堆。`heapALLOCATE_BLOCK(pxBlock) `宏的作用是拿到内存块的大小，因为我们之前占用了最高位，所以不能直接通过`xBlockSize`拿到内存块大小，而是只取除了最高位以外的31位。`heapFREE_BLOCK`则是设置一个内存块为空闲的内存块，也就是把最高位设置为0。




## 初始化堆

`heap_2.c`中初始化堆的工作是在`prvHeapInit`函数中进行的，这个函数通过使用`static`，让其只能在本文件内使用。

首先，`pucAlignedHeap`是和之前`heap_1.c`里面一样，都是通过位运算来计算堆内存对齐以后的起始位置。

```c
PRIVILEGED_DATA static BlockLink_t xStart, xEnd;
static void prvHeapInit( void ) /* PRIVILEGED_FUNCTION */
{
    BlockLink_t * pxFirstFreeBlock;
    uint8_t * pucAlignedHeap;

    /* 确保堆从正确对齐的边界开始。 */
    pucAlignedHeap = ( uint8_t * ) ( ( ( portPOINTER_SIZE_TYPE ) & ucHeap[ portBYTE_ALIGNMENT - 1 ] ) & ( ~( ( portPOINTER_SIZE_TYPE ) portBYTE_ALIGNMENT_MASK ) ) );

    /* xStart用于保存指向空闲块列表中第一项的指针。void强制转换用于防止编译器警告。 */
    xStart.pxNextFreeBlock = ( void * ) pucAlignedHeap;
    xStart.xBlockSize = ( size_t ) 0;

    /* xEnd用于标记空闲块列表的结束。 */
    xEnd.xBlockSize = configADJUSTED_HEAP_SIZE;
    xEnd.pxNextFreeBlock = NULL;
    
    /* 开始时，有一个空闲块，它的大小可以占用整个堆空间。     */
    pxFirstFreeBlock = ( BlockLink_t * ) pucAlignedHeap;
    pxFirstFreeBlock->xBlockSize = configADJUSTED_HEAP_SIZE;
    pxFirstFreeBlock->pxNextFreeBlock = &xEnd;
}
```

`xStart`和`xEnd`是两个用于标识空闲列表的头和尾的结构。在初始化堆的时候，把整个堆都当成了空闲块，之后分配的时候就会更容易。



## pvPortMalloc

`heap_2`的`pvPortMalloc`跟之前`heap_1`完全不一样，为了能够回收内存，因此使用了链表来管理，这也就使得链表操作在内存管理里占了很大一部分。下面是这个函数内用的一些局部变量的定义。

```c
BlockLink_t * pxBlock;
BlockLink_t * pxPreviousBlock;
BlockLink_t * pxNewBlockLink;
PRIVILEGED_DATA static BaseType_t xHeapHasBeenInitialised = pdFALSE;
void * pvReturn = NULL;
size_t xAdditionalRequiredSize;
```

`pvPortMalloc`整个内存分配的过程还是一样，都要挂起所有任务，前面已经解释过为什么需要用`vTaskSuspendAll`和`xTaskResumeAll`了。

首先是利用一个静态变量在多次进入函数以后不会反复初始化的特性来做到一个判定是否是第一次进入，从而进行初始化堆的操作。

```c
/*如果这是第一次调用malloc，堆将需要
 *初始化以设置空闲块列表。*/
if( xHeapHasBeenInitialised == pdFALSE )
{
    prvHeapInit();
    xHeapHasBeenInitialised = pdTRUE;
}
```

第二步就是内存对齐，这里牵扯到两个常量，补充说明一下。可以看下面的定义，`heapSTRUCT_SIZE`是一个常量，它表示`BlockLink_t`结构体的大小加上对齐要求后的大小。`sizeof(BlockLink_t)`用于计算`BlockLink_t`结构体的大小，而`(portBYTE_ALIGNMENT - 1)`用于计算对齐要求减去1的值。然后，通过将这两个值相加并使用按位与操作符`&`与上一个掩码`~((size_t)portBYTE_ALIGNMENT_MASK)`，可以确保`heapSTRUCT_SIZE`满足对齐要求。

接下来，`heapMINIMUM_BLOCK_SIZE`是一个常量，它表示堆中最小块的大小。根据代码中的定义，最小块的大小是`heapSTRUCT_SIZE`的两倍。为什么这里规定最小块是两倍，因为如果一个内存块，管理内存所占用的内存大小比申请的内存大小还要大，那就造成了大量的浪费，因此也提醒我们，申请内存的时候不要申请很小，一次性多申请一些，之后再怎么使用，可以我们自己决定如何分割内存。

```c
static const uint16_t heapSTRUCT_SIZE = ( ( sizeof( BlockLink_t ) + ( portBYTE_ALIGNMENT - 1 ) ) & ~( ( size_t ) portBYTE_ALIGNMENT_MASK ) );
#define heapMINIMUM_BLOCK_SIZE    ( ( size_t ) ( heapSTRUCT_SIZE * 2 ) )
```

接着看，`xAdditionalRequiredSize`是额外的内存大小，也就是用于对齐我们申请内存的大小。之前尽管已经对`BlockLink_t`做了内存对齐，但是想要申请的内存大小可能不是内存对齐的，因此这里还是需要再对齐一次。`heapADD_WILL_OVERFLOW`这个宏的作用是判断两个相加的时候会不会产生溢出，因为我们把最高位拿过来用于标记内存块的状态了。

```c
if( xWantedSize > 0 )
{
    /*需要的大小必须增加，以便它可以包含一个BlockLink_t
     *除了请求的字节数之外，还需要一个结构。
     *可能还需要一些额外的增量来对齐。*/
    xAdditionalRequiredSize = heapSTRUCT_SIZE + portBYTE_ALIGNMENT - ( xWantedSize & portBYTE_ALIGNMENT_MASK );

    if( heapADD_WILL_OVERFLOW( xWantedSize, xAdditionalRequiredSize ) == 0 )
    {
        xWantedSize += xAdditionalRequiredSize;
    }
    else
    {
        xWantedSize = 0;
    }
}
```

之后便是检查和分配内存，这里一开始先判断了`xWantedSize`是否是可取的，因为如果想要申请的内存太大，就会导致后面分配内存时候出错。然后再是确保`xWantedSize`不是负数并且不能超过堆剩余的空闲内存大小，`xFreeBytesRemaining`是一个文件内的静态变量用于记录堆的空闲内存大小。`pxPreviousBlock`和`pxBlock`是两个指针，`while`用于遍历分配出去内存块的链表，直到找遍链表或者是找到一个足够大小的内存块。这个内存块的链表从头到尾，内存块的大小是从小到大，这样就可以保证分配出去的内存块一定是满足条件的最小内存块。

这里遍历链表的时候用了一个双指针的技巧。先以题目[删除链表的倒数第 N 个结点](https://leetcode.cn/problems/remove-nth-node-from-end-of-list/)为例子来说明这个技巧。这个题目的要求是删除链表的倒数第N个节点。从题解，可以看出来，两个指针错位了N个位置的时候，由于`second`指针快N个位置，并且两个指针以一样的速度移动，因此当`second`指针到链表结束的时候，`first`指针刚好在离结束的N个位置。

```c
struct ListNode* removeNthFromEnd(struct ListNode* head, int n) {
    struct ListNode* dummy = malloc(sizeof(struct ListNode));
    dummy->val = 0, dummy->next = head;
    struct ListNode* first = head;
    struct ListNode* second = dummy;
    for (int i = 0; i < n; ++i) {
        first = first->next;
    }
    while (first) {
        first = first->next;
        second = second->next;
    }
    second->next = second->next->next;
    struct ListNode* ans = dummy->next;
    free(dummy);
    return ans;
}
```

回到`FreeRTOS`这个源码上，体现的就是，利用`pxBlock`比`pxPreviousBlock`快一个位置，这样就能获取到倒数第1个位置的值了，因为最后`pxPreviousBlock`必然会比`pxBlock`先到`NULL`。

```c
if( heapBLOCK_SIZE_IS_VALID( xWantedSize ) != 0 )
{
    if( ( xWantedSize > 0 ) && ( xWantedSize <= xFreeBytesRemaining ) )
    {
        /* 块按字节顺序存储-从开始遍历列表
         * (最小)块，直到找到一个足够大小的块。 */
        pxPreviousBlock = &xStart;
        pxBlock = xStart.pxNextFreeBlock;

        while( ( pxBlock->xBlockSize < xWantedSize ) && ( pxBlock->pxNextFreeBlock != NULL ) )
        {
            pxPreviousBlock = pxBlock;
            pxBlock = pxBlock->pxNextFreeBlock;
        }

        /* 如果我们找到了结束标记，那么就没有找到足够大小的块。 */
        if( pxBlock != &xEnd )
        {
            /* 返回内存空间跳过BlockLink_t结构开头。 */
            pvReturn = ( void * ) ( ( ( uint8_t * ) pxPreviousBlock->pxNextFreeBlock ) + heapSTRUCT_SIZE );

            /* 该块正在返回使用，因此必须从空闲块列表取出。 */
            pxPreviousBlock->pxNextFreeBlock = pxBlock->pxNextFreeBlock;

            /* 如果块大于要求，则可以将其分成两个。 */
            if( ( pxBlock->xBlockSize - xWantedSize ) > heapMINIMUM_BLOCK_SIZE )
            {
                /* 该块将被分成两个。创建一个新块
                 * 表示请求的字节数。void*转换的目的是                   
                 * 用于防止编译器发出字节对齐警告。*/
                pxNewBlockLink = ( void * ) ( ( ( uint8_t * ) pxBlock ) + xWantedSize );

                /* 计算从单个块分割的两个块的大小 */
                pxNewBlockLink->xBlockSize = pxBlock->xBlockSize - xWantedSize;
                pxBlock->xBlockSize = xWantedSize;

                /* 插入新的块到空闲块列表. */
                prvInsertBlockIntoFreeList( ( pxNewBlockLink ) );
            }

            xFreeBytesRemaining -= pxBlock->xBlockSize;

            /*块正在被返回-它被分配和拥有            
             *由应用程序执行，并且没有“next”块。*/
            heapALLOCATE_BLOCK( pxBlock );
            pxBlock->pxNextFreeBlock = NULL;
        }
    }
}
```

这里`if( pxBlock != &xEnd )`实际上就是因为没有现成的内存块可以用于直接分配，因此要从空闲内存中分割出去一块合适的内存。

下面，从头开始，带入数据来说明具体的申请内存的细节。以申请20、40个字节的内存为例子来说明。首先，程序第一次调用`pvPortMalloc`的时候，先挂起所有的任务，然后`xWantedSize`是20，`xHeapHasBeenInitialised`是`pdFALSE`，因此要进入到`prvHeapInit`里面，之后把`xHeapHasBeenInitialised`设置为`pdTRUE`。进入到`prvHeapInit`里面，先假定`ucHeap`的地址是`0x20000058`，`pucAlignedHeap`通过`(uint8_t*) ( ( ( uint32_t) &ucHeap[ 8 - 1 ] ) & ( ~( ( uint32_t) 0x0007) ) )`被对齐为`0x20000060`。`xStart`的`pxNextFreeBlock`也是指向`pucAlignedHeap`，然后`xBlockSize`是0，`xEnd`是`( ( size_t ) ( 17 * 1024 ) ) - 8`也就是17400。在`prvHeapInit`的最后，初始化了一个自由内存块，其大小为`configADJUSTED_HEAP_SIZE`，也是就是调整以后堆的大小，开始于堆的起始位置，然后下一个空闲链表的指针指向`xEnd`。

接下来先计算`heapSTRUCT_SIZE`的值，`( ( 8 + ( 8- 1 ) ) & ~( ( size_t ) 0x0007) )`也就是8。计算`8 + 8 - ( 20 & 0x0007)`得到`xAdditionalRequiredSize`的值是12。因为不会溢出，所以`xWantedSize`加上对齐所需要的12个字节，就从20个字节变成了32个字节。

接着，又是判断`xWantedSize`的合法性，`pxPreviousBlock`指向了`xStart`的地址，`pxBlock`指向的是`xStart.pxNextFreeBlock`也就是堆通过内存对齐以后的起始地址。`xStart.pxNextFreeBlock.xBlockSize`也就是求之前初始化堆的时候，空闲内存块的大小，这个就是堆的大小，是绝对大于`xWantedSize`，所以`while`循环不会进去。

又因为没有找到结束标记，因此还是可以分配内存的。先用一个`pxNewBlockLink`指向新的空闲内存块的地址（`0x20000060+32`），然后`xBlockSize`是17400-32。然后原来以堆起始坐标开始的那个链表节点，把它的`xBlockSize`设置为32。之后再调用`prvInsertBlockIntoFreeList`把`pxNewBlockLink`插入到空闲链表里面。接下来分析这个插入链表的操作，这个`prvInsertBlockIntoFreeList`是一个宏，定义如下。

```c
#define prvInsertBlockIntoFreeList( pxBlockToInsert )                   \
    {                                                                   \
        BlockLink_t * pxIterator;                                       \
        size_t xBlockSize;                                              \
                                                                        \
        xBlockSize = pxBlockToInsert->xBlockSize;                       \
                                                                        \
        /* 遍历列表，直到找到一个比我们插入的块尺寸还要大的块 */                \
        for(pxIterator = &xStart;                                       \
            pxIterator->pxNextFreeBlock->xBlockSize < xBlockSize;       \
            pxIterator = pxIterator->pxNextFreeBlock)                   \
        {                                                               \
            /* 这里什么也不做-只是迭代到正确的位置。 */                       \
        }                                                               \
                                                                        \
        /* 更新列表以包含插入到正确位置的块 */                               \
        pxBlockToInsert->pxNextFreeBlock = pxIterator->pxNextFreeBlock; \
        pxIterator->pxNextFreeBlock = pxBlockToInsert;                  \
    }
```

往`prvInsertBlockIntoFreeList`传入`pxNewBlockLink`，会被展开为如下内容。`xBlockSize`也是就`17400-32`，然后就会进入到`for`循环。一开始`pxIterator`指向的是`xStart`，之后因为，`xStart`的下一个，也就是前面分配出去的内存的大小，这个是小于`xBlockSize`的，这会导致`pxIterator`往后。这样循环，直到`pxIterator`指向了前面分配出去内存块的时候，它的下一个`xEnd`是大于它的，然后就停止循环。把`pxNewBlockLink->pxNextFreeBlock`指向`pxIterator->pxNextFreeBlock`，也就是`xEnd`，然后`pxIterator->pxNextFreeBlock`指向我们这个新的空闲内存块。此时就形成了`xStart -> 0x20000060+32 -> xEnd -> NULL`这种链表。其中`0x20000060 `就是那个分配出去的内存块。

```c
{
    BlockLink_t * pxIterator;                               
    size_t xBlockSize;
                                                            
    xBlockSize = pxNewBlockLink->xBlockSize;                 
                                                               
    /* 遍历列表，直到找到一个比我们插入的块尺寸还要大的块 */  
    for(pxIterator = &xStart;                              
        pxIterator->pxNextFreeBlock->xBlockSize < xBlockSize;
        pxIterator = pxIterator->pxNextFreeBlock)         
    {                                                  
        /* 这里什么也不做-只是迭代到正确的位置。 */  
    }

    /* 更新列表以包含插入到正确位置的块 */ 
    pxNewBlockLink->pxNextFreeBlock = pxIterator->pxNextFreeBlock;
    pxIterator->pxNextFreeBlock = pxNewBlockLink;
}
```

插入空闲链表完成以后，就会通过`xFreeBytesRemaining`维护空闲内存的大小，然后利用`heapALLOCATE_BLOCK`宏设置`pxBlock`这个分配出去内存的大小，然后把`pxBlock`的下一个设成成为NULL，因为它已经被分配出去了。

接下来再用图回忆一遍，内存分配的过程。

首先是内存对齐。

![heap_2-2](assets/heap_2-2.jpg)

然后再是初始化堆，产生一个空闲内存块。

![heap_2-3](assets/heap_2-3.jpg)

接着是内存分配。

![heap_2-4](assets/heap_2-4.jpg)



## vPortFree

有了前面的了解，`vPortFree`就简单多了。下面直接看代码。首先是用`puc`来存储传入的`pv`指针所指向的地址，通过一个`if`来避免对`NULL`指针的释放。`FreeRTOS`中的注释“被释放的内存将立即具有BlockLink_t结构在这之前”，意思就是要让`puc`指针恢复到指向`BlockLink_t`结构的位置。通过前面的图，可以知道在用户申请内存块前面的`heapSTRUCT_SIZE`（这里就是8）个字节的位置刚好就是`BlockLink_t`结构的起始地址。再通过一个`pxLink`指针对`BlockLink_t`结构进行操作。`configASSERT`是一个断言，判断是否为真。必须为真才能正常运行，否则就说明这个内存块的`BlockLink_t`结构被修改，或者说是被破坏了导致的不合法。

再通过`heapBLOCK_IS_ALLOCATED`和`pxLink->pxNextFreeBlock`来确定这个内存块确实是一个被分配给用户的内存块。`heapFREE_BLOCK`这个释放内存块，就是把`BlockLink_t`结构中的最高位设置为0，表示这是一个空闲内存块。`configHEAP_CLEAR_MEMORY_ON_FREE`这个宏，是为了能够在清理内存的时候自动把空闲内存设置为0。

最后，又是挂起所有任务，然后将这个空闲内存块添加到空闲块链表中，然后维护`xFreeBytesRemaining`，把这个空闲内存的大小加回去。最后的最后，再恢复所有的任务。

```c
void vPortFree( void * pv )
{
    uint8_t * puc = ( uint8_t * ) pv;
    BlockLink_t * pxLink;

    if( pv != NULL )
    {
        /* 被释放的内存将立即具有BlockLink_t结构在这之前。 */
        puc -= heapSTRUCT_SIZE;

        /* 这种意想不到的强制转换是为了防止一些编译器发出字节对齐警告。*/
        pxLink = ( void * ) puc;

        configASSERT( heapBLOCK_IS_ALLOCATED( pxLink ) != 0 );
        configASSERT( pxLink->pxNextFreeBlock == NULL );

        if( heapBLOCK_IS_ALLOCATED( pxLink ) != 0 )
        {
            if( pxLink->pxNextFreeBlock == NULL )
            {
                /* 块被返回到堆中——它不再是分配。 */
                heapFREE_BLOCK( pxLink );
                #if ( configHEAP_CLEAR_MEMORY_ON_FREE == 1 )
                {
                    ( void ) memset( puc + heapSTRUCT_SIZE, 0, pxLink->xBlockSize - heapSTRUCT_SIZE );
                }
                #endif

                vTaskSuspendAll();
                {
                    /* 将此块添加到空闲块列表中。 */
                    prvInsertBlockIntoFreeList( ( ( BlockLink_t * ) pxLink ) );
                    xFreeBytesRemaining += pxLink->xBlockSize;
                    traceFREE( pv, pxLink->xBlockSize );
                }
                ( void ) xTaskResumeAll();
            }
        }
    }
}
```



## pvPortCalloc

`pvPortCalloc`本质上就是调用`pvPortMalloc`来申请一个`xNum * xSize`大小的内存。

```c
void * pvPortCalloc( size_t xNum,
                     size_t xSize )
{
    void * pv = NULL;

    if( heapMULTIPLY_WILL_OVERFLOW( xNum, xSize ) == 0 )
    {
        pv = pvPortMalloc( xNum * xSize );

        if( pv != NULL )
        {
            ( void ) memset( pv, 0, xNum * xSize );
        }
    }

    return pv;
}
```



## 带注释的pvPortMalloc代码

```d
void * pvPortMalloc( size_t xWantedSize )
{
    BlockLink_t * pxBlock;
    BlockLink_t * pxPreviousBlock;
    BlockLink_t * pxNewBlockLink;
    PRIVILEGED_DATA static BaseType_t xHeapHasBeenInitialised = pdFALSE;
    void * pvReturn = NULL;
    size_t xAdditionalRequiredSize;

    vTaskSuspendAll();
    {
        /*如果这是第一次调用malloc，堆将需要
         *初始化以设置空闲块列表。*/
        if( xHeapHasBeenInitialised == pdFALSE )
        {
            prvHeapInit();
            xHeapHasBeenInitialised = pdTRUE;
        }

        if( xWantedSize > 0 )
        {
            /*需要的大小必须增加，以便它可以包含一个BlockLink_t
             *除了请求的字节数之外，还需要一个结构。
             *可能还需要一些额外的增量来对齐。*/
            xAdditionalRequiredSize = heapSTRUCT_SIZE + portBYTE_ALIGNMENT - ( xWantedSize & portBYTE_ALIGNMENT_MASK );

            if( heapADD_WILL_OVERFLOW( xWantedSize, xAdditionalRequiredSize ) == 0 )
            {
                xWantedSize += xAdditionalRequiredSize;
            }
            else
            {
                xWantedSize = 0;
            }
        }

        /* 检查我们尝试分配的块大小是否太大     
         * 顶部位已设置。BlockLink_t的块大小成员的顶部位   
         * 结构用于确定谁拥有块-应用程序或内核  ，
         * 所以它必须是空闲的。*/
        if( heapBLOCK_SIZE_IS_VALID( xWantedSize ) != 0 )
        {
            if( ( xWantedSize > 0 ) && ( xWantedSize <= xFreeBytesRemaining ) )
            {
                /* 块按字节顺序存储-从开始遍历列表
                 * (最小)块，直到找到一个足够大小的块。 */
                pxPreviousBlock = &xStart;
                pxBlock = xStart.pxNextFreeBlock;

                while( ( pxBlock->xBlockSize < xWantedSize ) && ( pxBlock->pxNextFreeBlock != NULL ) )
                {
                    pxPreviousBlock = pxBlock;
                    pxBlock = pxBlock->pxNextFreeBlock;
                }

                /* 如果我们找到了结束标记，那么就没有找到足够大小的块。 */
                if( pxBlock != &xEnd )
                {
                    /* 返回内存空间跳过BlockLink_t结构开头。 */
                    pvReturn = ( void * ) ( ( ( uint8_t * ) pxPreviousBlock->pxNextFreeBlock ) + heapSTRUCT_SIZE );

                    /* 该块正在返回使用，因此必须从空闲块列表取出。 */
                    pxPreviousBlock->pxNextFreeBlock = pxBlock->pxNextFreeBlock;

                    /* 如果块大于要求，则可以将其分成两个。 */
                    if( ( pxBlock->xBlockSize - xWantedSize ) > heapMINIMUM_BLOCK_SIZE )
                    {
                        /* 该块将被分成两个。创建一个新块
                         * 表示请求的字节数。void*转换的目的是                   
                         * 用于防止编译器发出字节对齐警告。*/
                        pxNewBlockLink = ( void * ) ( ( ( uint8_t * ) pxBlock ) + xWantedSize );

                        /* 计算从单个块分割的两个块的大小 */
                        pxNewBlockLink->xBlockSize = pxBlock->xBlockSize - xWantedSize;
                        pxBlock->xBlockSize = xWantedSize;

                        /* 插入新的块到空闲块列表. */
                        prvInsertBlockIntoFreeList( ( pxNewBlockLink ) );
                    }

                    xFreeBytesRemaining -= pxBlock->xBlockSize;

                    /*块正在被返回-它被分配和拥有            
                     *由应用程序执行，并且没有“next”块。*/
                    heapALLOCATE_BLOCK( pxBlock );
                    pxBlock->pxNextFreeBlock = NULL;
                }
            }
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

