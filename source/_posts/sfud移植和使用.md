---
title: sfud移植和使用
date: 2025-08-10 19:44:07
tags: Embedded
---

前段时间移植过sfud，这个库提供了对w25qxx这种flash的读写驱动。但是当时，因为文档对于移植部分不够仔细，于是就遇到了一些问题。记录一下如何移植sfud以及如何使用这个库。我的flash型号为w25q128，然后单片机是stm32f407vgt6，其他也应该是差不多的。



## 移植

### 定义flash

在`sfud_cfg.h`里面，由于有一个`SFUD_FLASH_DEVICE_TABLE`宏是下面这样使用。

```c
static sfud_flash flash_table[] = SFUD_FLASH_DEVICE_TABLE;
```

于是我们就需要定义这个宏，这个宏就是初始化这个数组。其中的`sfud_spi`内有`name`，另外就是`sfud_flash`也有`name`。`SFUD_W25_DEVICE_INDEX`这个一定要从0开始，要不然下标会出错。

```c
enum
{
    SFUD_W25_DEVICE_INDEX = 0,
};

#define SFUD_FLASH_DEVICE_TABLE                                               \
    {                                                                         \
        [SFUD_W25_DEVICE_INDEX] = {.name = "W25Q_Flash", .spi.name = "SPI2"}, \
    }
```



### 初始化



### 加锁和解锁

关于锁是`spi_lock`和`spi_unlock`函数，如果是裸机可以选择不加锁，因为没有数据竞争的情况下，没必要加锁。如果真的需要加锁，在单核MCU的情况下，只需要关中断就行。在这里可以按照下面这样子实现。

```c
static void spi_lock(const sfud_spi *spi) {
    __disable_irq();
}

static void spi_unlock(const sfud_spi *spi) {
    __enable_irq();
}
```





## 使用
