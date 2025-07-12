---
title: 记录掉进micropython的pyb的Servo的坑
date: 2025-07-12 22:31:06
tags: Daily
---

这几天我在学习OpenMV，我就只是想生成一个PWM，然后控制舵机，然后就栽在这个上面了好几天。文档翻来覆去解决不了我的问题。于是记录一下我的解决方案吧。



## pyb库的Servo

我是一开始通过[https://book.openmv.cc/MCU/pyb.html#servo](https://book.openmv.cc/MCU/pyb.html#servo)看到pyb库有一个Servo，看着挺简单的，只需要指定舵机的位置，然后就直接让他转多少角度（`angle`函数），而且可以设置速度。然后就悲剧了。我仔细阅读了一下`angle`函数的描述，它的内容如下。

> -  **Servo**.angle([**angle**, **time=0**])[¶](https://docs.openmv.io/library/pyb.Servo.html#pyb.Servo.angle)
>
> If no arguments are given, this function returns the current angle.
>
> If arguments are given, this function sets the angle of the **servo**:
>
> - `angle` is the angle to move to in degrees.
> - `time` is the number of milliseconds to take to get to the specified angle. If omitted, then the **servo** moves as quickly as possible to its new position.

我就写了下面这样子的代码。

```python
s1 = Servo(1)  # P7
s1.angle(50)
```

似乎可以运行，但是我就考虑到一个问题是，精度问题，我不可能一度一度转，原因是按照距离来算，1米的情况下，转动1度的移动距离是$Distance=\tan(1^\circ) \times 1\,\text{m}\approx 0.017455\,\text{m}$，几乎都要贴到出界的范围了。只要多一点的就会出去的那种，完全不能忍受。

另外，我发现还有一种是`pulse_width`，我也不知道为什么这个没效果，反正在我的示波器上，我给了20000作为参数，是没有脉冲的，我就放弃用这个了。



## pyb库的Pwm

pyb库的Pwm也是一个坑，在我使用Servo不行了以后就开始看原始Pwm的代码。我知道这玩意不难，但是这文档也太简陋了，不管是星瞳科技的文档还是micropython的文档都一塌糊涂。根本解决不了我的问题。

星瞳科技的文档就下面这段，我一开始看着，还行啊，通过控制占空比来控制。

```python
from pyb import Pin, Timer

p = Pin('P7') # P7 has TIM4, CH1
tim = Timer(4, freq=1000)
ch = tim.channel(1, Timer.PWM, pin=p)
ch.pulse_width_percent(50)
```

因为之前Servo的经验，然后我就尝试`pulse_width_percent`这个函数能不能传入一个小数，这样子不就提高精度了吗？要不然，一个180度的舵机，加百分之一，一下就多了1.8度，这直接超过边界了，完全不可控。

我就把这个第六行的代码改成`ch.pulse_width_percent(50.1)`，然后，这OpenMV的IDE，就给我弹窗，爆一个很可爱的错误。大大的`TypeError: can't convert float to int`。然后我就开始读这个函数的文档。文档关于这个函数的描述如下

> - timerchannel.pulse_width_percent(**[**value**]**)[¶](https://docs.openmv.io/library/pyb.Timer.html#pyb.timerchannel.pulse_width_percent)
>
> Get or set the pulse width percentage associated with a channel. The value is a number between 0 and 100 and sets the percentage of the timer period for which the pulse is active. The value can be an integer or floating-point number for more accuracy. For example, a value of 25 gives a duty cycle of 25%.

他说是0到100的值，然后说是25就代表25%的占空比，那我咋不能用50.1表示50.1%的占空比呢。它也没有说明类型，必须等到填进去一个浮点数，才给你报错。

然后我就没办法，我就只能找一个设置原始值的函数，还真让我找到了，是`pulse_width`。这个参数也是有意思，他也不说传入的`value`是什么东西。

> - timerchannel.pulse_width(**[**value**]**)[¶](https://docs.openmv.io/library/pyb.Timer.html#pyb.timerchannel.pulse_width)
>
>   Get or set the pulse width value associated with a channel. capture, compare, and pulse_width are all aliases for the same function. pulse_width is the logical name to use when the channel is in **PWM** mode.In edge aligned mode, a pulse_width of `period + 1` corresponds to a duty cycle of 100% In center aligned mode, a pulse width of `period` corresponds to a duty cycle of 100%
>
> - timerchannel.callback(fun)[¶](https://docs.openmv.io/library/pyb.Timer.html#pyb.timerchannel.callback)
>
>   Set the function to be called when the timer channel triggers. `fun` is passed 1 argument, the timer object. If `fun` is `None` then the callback will be disabled.
>
> - timerchannel.capture(**[**value**]**)[¶](https://docs.openmv.io/library/pyb.Timer.html#pyb.timerchannel.capture)
>
>   Get or set the capture value associated with a channel. capture, compare, and pulse_width are all aliases for the same function. capture is the logical name to use when the channel is in input capture mode.
>
> - timerchannel.compare(**[**value**]**)[¶](https://docs.openmv.io/library/pyb.Timer.html#pyb.timerchannel.compare)
>
>   Get or set the compare value associated with a channel. capture, compare, and pulse_width are all aliases for the same function. compare is the logical name to use when the channel is in output compare mode.
>

这文档也是逆天，叽里咕噜说了一大堆，跟没说没啥区别。也不告诉我，这个参数啥意思。



然后呢，我就一个一个值试，然后拿示波器看波形。一直试到10000差不多有点波形了。我就两倍两倍加，发现40000差不多是慢占空比，然后我问了一下GPT，50hz下，40000的`pulse_width`是满占空比，然后它就一顿推导，发现单位是ns，因为时钟是2Mhz的，这参数的`value`也不标一下单位，如果是秒或者毫秒，我不得加小数传入，单位又不一样了。



## 探索pyb源码

然后我就开始翻micropython的pyb库的源码，终于在[https://github.com/micropython/micropython/blob/8f8f8539827a4d38dd51e4960fe54a0ed8ab08ea/ports/stm32/timer.c#L1581](https://github.com/micropython/micropython/blob/8f8f8539827a4d38dd51e4960fe54a0ed8ab08ea/ports/stm32/timer.c#L1581)，发现了一些东西。确实是得用channel的`pulse_width `来设置最原始的脉冲宽度值。它没有说明单位是什么，就纯粹是计数值。如果是计数值，那文档里吱个声也就不用我一个一个猜了。

然后仔细看Servo的实现的源码，那真是一言难尽了。一看对象定义，它这里是有定义的，`pulse`是以10us为单位，然后到文档里面就没有了。真是坑死我也。有点感觉是意义不明确的10us。

```c
typedef struct _pyb_servo_obj_t {
    mp_obj_base_t base;
    const machine_pin_obj_t *pin;
    uint8_t pulse_min;          // units of 10us
    uint8_t pulse_max;          // units of 10us
    uint8_t pulse_centre;       // units of 10us
    uint8_t pulse_angle_90;     // units of 10us; pulse at 90 degrees, minus pulse_centre
    uint8_t pulse_speed_100;    // units of 10us; pulse at 100% forward speed, minus pulse_centre
    uint16_t pulse_cur;         // units of 10us
    uint16_t pulse_dest;        // units of 10us
    int16_t pulse_accum;
    uint16_t time_left;
} pyb_servo_obj_t;
```

然后我就去看我之前出错的`angle`函数。按照我之前出错的情况来看，是因为没有启用`MICROPY_PY_BUILTINS_FLOAT`这个宏，使用他以`mp_obj_get_int`方式打开我的浮点数，所以就炸了。但是如果是用`mp_obj_get_float`拿的我传入的浮点数，应该是没问题的。

```c
/// \method angle([angle, time=0])
/// Get or set the angle of the servo.
///
///   - `angle` is the angle to move to in degrees.
///   - `time` is the number of milliseconds to take to get to the specified angle.
static mp_obj_t pyb_servo_angle(size_t n_args, const mp_obj_t *args) {
    pyb_servo_obj_t *self = MP_OBJ_TO_PTR(args[0]);
    if (n_args == 1) {
        // get angle
        return mp_obj_new_int((self->pulse_cur - self->pulse_centre) * 90 / self->pulse_angle_90);
    } else {
        #if MICROPY_PY_BUILTINS_FLOAT
        self->pulse_dest = self->pulse_centre + (int16_t)((mp_float_t)self->pulse_angle_90 * mp_obj_get_float(args[1]) / MICROPY_FLOAT_CONST(90.0));
        #else
        self->pulse_dest = self->pulse_centre + self->pulse_angle_90 * mp_obj_get_int(args[1]) / 90;
        #endif
        if (n_args == 2) {
            // set angle immediately
            self->time_left = 0;
        } else {
            // set angle over a given time (given in milli seconds)
            self->time_left = mp_obj_get_int(args[2]) / 20;
            self->pulse_accum = 0;
        }
        servo_timer_irq_callback();
        return mp_const_none;
    }
}
```

最后，我发现一个惊喜的地方就是pyb库的代码风格确实很好。看下面这个callback。他基本上所有的外设都会有一个`xxx_irq_callback`，然后再在中断服务函数里面调用。这种方案可以统一处理中断函数的编写，而不是让外设的中断代码散落到各个地方。

```c
void servo_timer_irq_callback(void) {
    bool need_it = false;
    for (int i = 0; i < PYB_SERVO_NUM; i++) {
        pyb_servo_obj_t *s = &pyb_servo_obj[i];
        if (s->pulse_cur != s->pulse_dest) {
            // clamp pulse to within min/max
            if (s->pulse_dest < s->pulse_min) {
                s->pulse_dest = s->pulse_min;
            } else if (s->pulse_dest > s->pulse_max) {
                s->pulse_dest = s->pulse_max;
            }
            // adjust cur to get closer to dest
            if (s->time_left <= 1) {
                s->pulse_cur = s->pulse_dest;
                s->time_left = 0;
            } else {
                s->pulse_accum += s->pulse_dest - s->pulse_cur;
                s->pulse_cur += s->pulse_accum / s->time_left;
                s->pulse_accum %= s->time_left;
                s->time_left--;
                need_it = true;
            }
            // set the pulse width
            *(&TIM5->CCR1 + s->pin->pin) = s->pulse_cur;
        }
    }
    if (need_it) {
        __HAL_TIM_ENABLE_IT(&TIM5_Handle, TIM_IT_UPDATE);
    } else {
        __HAL_TIM_DISABLE_IT(&TIM5_Handle, TIM_IT_UPDATE);
    }
}
```



## 最终解决方案

反正我是没有耐心去调试pyb库的Servo了，我是觉得我用不好它的Servo实现，我就基于pyb的Pwm实现了一个MServo类。对于精度精准控制的情况下，舵机的Pwm必须是以最原始的改变脉冲宽度来控制的。所以我传入的就是计数，这样子会容易控制一些。我也不去搞他那个10us的奇怪东西了，我感觉那个是最奇怪的地方，然后文档也不解释，代码就稀里糊涂写。

```python
from pyb import Pin, Timer

class MServo:
    """
    id should be 1 or 2.
    id 1 means that P7, use the TIM4 CH1.
    id 2 means that P8, use the TIM4 CH2.
    """
    def __init__(self, id, tim_freq = 50):
        if id == 1:
            self.p = Pin('P7') # P7 has TIM4, CH1
            self.tim = Timer(4, freq=tim_freq)
            self.ch = self.tim.channel(1, Timer.PWM, pin=self.p)
        elif id == 2:
            self.p = Pin('P8') # P8 has TIM4, CH2
            self.tim = Timer(4, freq=tim_freq)
            self.ch = self.tim.channel(2, Timer.PWM, pin=self.p)
        else:
            raise ValueError ('the id is unvaild.')

    """
    when tim_freq is 50hz, then the max pulse width is 40000.
    the timer freq is 2Mhz, then the per count is 1 / 2Mhz = 0.5us.
    so the max pulse width is 20ms / 0.5us = 40000.
    """
    def pulse_width(self, width):
        return self.ch.pulse_width(width)

    """
    get the current pulse width
    """
    def current_pulse_width(self, width):
        return self.ch.pulse_width()
```



写于2025年7月12日，23点30分。
