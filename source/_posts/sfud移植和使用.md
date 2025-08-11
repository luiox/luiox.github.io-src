---
title: sfud移植和使用
date: 2025-08-10 19:44:07
tags: Embedded
---

前段时间移植过sfud，这个库提供了对w25qxx这种flash的读写驱动。但是当时，因为文档对于移植部分不够仔细，于是就遇到了一些问题。记录一下如何移植sfud以及如何使用这个库。我的flash型号为w25q128，然后单片机是stm32f407vgt6，其他也应该是差不多的。

sfud是一个flash的驱动库，其github的仓库地址是：[https://github.com/armink/SFUD](https://github.com/armink/SFUD)。



## 移植

### 定义flash

在`sfud_cfg.h`里面，由于有一个`SFUD_FLASH_DEVICE_TABLE`宏是下面这样使用。

```c
static sfud_flash flash_table[] = SFUD_FLASH_DEVICE_TABLE;
```

于是我们就需要定义这个宏，这个宏就是初始化这个数组。其中的`sfud_spi`内有`name`，另外就是`sfud_flash`也有`name`。`SFUD_W25_DEVICE_INDEX`这个一定要从0开始，要不然下标会出错。这两个名字是无所谓的，想叫什么都可以。

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

初始化由`sfud_spi_port_init`函数实现，sfud的初始化函数的工作主要是对`sfud_flash`对象的初始化，每个`sfud_flash`对象都有一个索引，也就是前面定义时候的`SFUD_W25_DEVICE_INDEX`索引。并且加上一组spi的操作函数实现。

先通过`flash->index`判断是不是需要的`SFUD_W25_DEVICE_INDEX`，然后设置接口的函数指针。

```c
sfud_err sfud_spi_port_init(sfud_flash *flash) {
    sfud_err result = SFUD_SUCCESS;

    switch (flash->index) {
    case SFUD_W25_DEVICE_INDEX: {
        /* 同步 Flash 移植所需的接口及数据 */
        flash->spi.wr = spi_write_read;
        flash->spi.lock = spi_lock;
        flash->spi.unlock = spi_unlock;
        flash->spi.user_data = &spi2;
        /* about 100 microsecond delay */
        flash->retry.delay = retry_delay_100us;
        /* adout 60 seconds timeout */
        flash->retry.times = 60 * 10000;

        break;
    }
    }

    return result;
}
```

这个初始化过程，涉及了用户自己的额外数据`spi_user_data`。原因是，每个单片机的SPI所需的额外信息不一样。所以这个是由用户定义。在STM32中，如果器件的SPI的CS已经接低电平，那么实际上只需要一个`SPI_HandleTypeDef*`，即SPI的句柄即可。

```c
typedef struct {
    SPI_HandleTypeDef *spix;
    GPIO_TypeDef *cs_gpiox;
    uint16_t cs_gpio_pin;
} spi_user_data_t;

static spi_user_data_t spi2 = { .spix = &hspi2, .cs_gpiox =  Flash_CS_GPIO_Port, .cs_gpio_pin = Flash_CS_Pin };
```



### SPI读写函数

SPI的读写函数`spi_write_read`的实现是比较重要的部分。但是官方的注释如下。

> SPI write data then read data

写数据然后读数据，非常迷惑，我一开始搞不懂，到底如何判断这个函数调用的时候是应该先写还是先读。还是有可能写和读是数据都有，哪个优先。在我看了sfud的源码中，对`flash->spi.wr`的调用情况以后，我大致理解了，这个函数应该长啥样。

1. 只写不读类型，参考`result = flash->spi.wr(&flash->spi, &cmd, 1, NULL, 0);`这种的调用。
2. 又读又写类型，`return flash->spi.wr(&flash->spi, &cmd, 1, status, 1);`这种调用。

一般来说，又读又写，一定是先写才能读，因为需要先发命令过去，才能够收到数据。在demo的注释里面，我发现了一句内容如下。验证了我的猜想确实是如此。

> 先写缓冲区中的数据到 SPI 总线，数据写完后，再写 dummy(0xFF) 到 SPI 总线。

所以在HAL库下的实现应该像下面这样子。

```c
static sfud_err spi_write_read(const sfud_spi* spi, const uint8_t* write_buf, size_t write_size, uint8_t* read_buf,
                               size_t read_size)
{
    sfud_err result = SFUD_SUCCESS;
    uint8_t send_data, read_data;
    spi_user_data_t* spi_dev = (spi_user_data_t*)spi->user_data;

    if (write_size) {
        SFUD_ASSERT(write_buf);
    }
    if (read_size) {
        SFUD_ASSERT(read_buf);
    }
    // CS拉低，选中
    HAL_GPIO_WritePin(spi_dev->cs_gpiox, spi_dev->cs_gpio_pin, GPIO_PIN_RESET);

    if (read_size != NULL) {
        // 先写数据再读数据
        if (HAL_OK != HAL_SPI_Transmit(spi_dev->spix, (uint8_t*)write_buf, write_size, 1000))
            result = SFUD_ERR_TIMEOUT;
        if (HAL_OK != HAL_SPI_Receive(spi_dev->spix, (uint8_t*)read_buf, read_size, 1000))
            result = SFUD_ERR_TIMEOUT;
    }
    else {
        // 直接写数据
        if (HAL_OK != HAL_SPI_Transmit(spi_dev->spix, (uint8_t*)write_buf, write_size, 1000))
            result = SFUD_ERR_TIMEOUT;
    }
    // CS拉高，取消选中
    HAL_GPIO_WritePin(spi_dev->cs_gpiox, spi_dev->cs_gpio_pin, GPIO_PIN_SET);

    return result;
}
```



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



### 打印的实现

sfud里面大量使用`SFUD_DEBUG`和`SFUD_INFO`打印信息，这两个宏依赖于`sfud_log_debug`和`sfud_log_info`的实现。一般来说，嵌入式里面，直接`printf`重定向到串口就行，一旦重定向好以后，实现就下面这样子就可以了。

```c
void sfud_log_debug(const char* file, const long line, const char* format, ...)
{
    va_list args;

    /* args point to the first variable parameter */
    va_start(args, format);
    debug_print("[SFUD](%s:%ld) ", file, line);
    /* must use vprintf to print */
    vsnprintf(log_buf, sizeof(log_buf), format, args);
    printf("%s\r\n", log_buf);
    va_end(args);
}

void sfud_log_info(const char* format, ...)
{
    va_list args;

    /* args point to the first variable parameter */
    va_start(args, format);
    debug_print("[SFUD]");
    /* must use vprintf to print */
    vsnprintf(log_buf, sizeof(log_buf), format, args);
    printf("%s\r\n", log_buf);
    va_end(args);
}
```



## 使用

初始化sfud库还是很简单的，只需要`sfud_init`，其返回值可以判断是否初始化成功。

```c
if (sfud_init() == SFUD_SUCCESS) {
    sfud_demo(0, sizeof(sfud_demo_test_buf), sfud_demo_test_buf);
}
```

demo的部分，第一个参数是测试flash的起始地址，第二个参数是数据的大小，然后第三个参数是数据。接口还是比较简单的，擦除`sfud_erase`，读取`sfud_read`，写入`sfud_write`这么三个基本的接口。在仓库的README里面已经是很详细的说明了每个参数的作用。

```c
#define SFUD_DEMO_TEST_BUFFER_SIZE                     1024

static void sfud_demo(uint32_t addr, size_t size, uint8_t *data);

static uint8_t sfud_demo_test_buf[SFUD_DEMO_TEST_BUFFER_SIZE];

static void sfud_demo(uint32_t addr, size_t size, uint8_t *data) {
    sfud_err result = SFUD_SUCCESS;
    const sfud_flash *flash = sfud_get_device_table() + 0;
    size_t i;
    /* 生成数据 */
    for (i = 0; i < size; i++) {
        data[i] = i;
    }
    /* 擦除测试 */
    result = sfud_erase(flash, addr, size);
    if (result == SFUD_SUCCESS) {
        printf("Erase the %s flash data finish. Start from 0x%08X, size is %ld.\r\n", flash->name, addr,
                size);
    } else {
        printf("Erase the %s flash data failed.\r\n", flash->name);
        return;
    }
    /* 写数据测试 */
    result = sfud_write(flash, addr, size, data);
    if (result == SFUD_SUCCESS) {
        printf("Write the %s flash data finish. Start from 0x%08X, size is %ld.\r\n", flash->name, addr,
                size);
    } else {
        printf("Write the %s flash data failed.\r\n", flash->name);
        return;
    }
    /* 读取测试 */
    result = sfud_read(flash, addr, size, data);
    if (result == SFUD_SUCCESS) {
        printf("Read the %s flash data success. Start from 0x%08X, size is %ld. The data is:\r\n", flash->name, addr,
                size);
        printf("Offset (h) 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F\r\n");
        for (i = 0; i < size; i++) {
            if (i % 16 == 0) {
                printf("[%08X] ", addr + i);
            }
            printf("%02X ", data[i]);
            if (((i + 1) % 16 == 0) || i == size - 1) {
                printf("\r\n");
            }
        }
        printf("\r\n");
    } else {
        printf("Read the %s flash data failed.\r\n", flash->name);
    }
    /* 检查读取的数据 */
    for (i = 0; i < size; i++) {
        if (data[i] != i % 256) {
            printf("Read and check write data has an error. Write the %s flash data failed.\r\n", flash->name);
			break;
        }
    }
    if (i == size) {
        printf("The %s flash test is success.\r\n", flash->name);
    }
}
```

