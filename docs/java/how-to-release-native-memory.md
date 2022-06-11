---
title: Native内存的释放
isOriginal: true
---
### 1. Finalize
在对象即将被回收的时候，由垃圾回收线程调用对应的该方法，存在以下问题：

- 如果两个对象同时变成了 `Unreachable`，那么它们的 `finalize` 方法调用顺序是随机的，有可能一个对象 `finalize` 方法访问了另一个对象中的 native 对象，导致访问到了已经释放的空间。

- 一个对象的 `finlaize` 方法是可以在它的其他方法还在执行时被调用的，其他方法有可能访问其持有的 native 对象，从而导致 `use-after-free` 问题。

- 由于 native 对象是通过堆内对象来引用的，而引用对象很小，如果堆一直没达到GC门槛从而触发对象的 `finalize`，那有出现 native 内存溢出而堆还有很大空间。因此可能需要搭配 `system.gc` 去显示地尝试 GC，而频繁地触发 GC 可能又会影响到程序的性能，频率低的话又有可能导致对象没被及时回收，开发者是很难去把控这个度的。

- 当 `finalize` 中抛出异常时，由于垃圾回收线程要保证不影响其他对象的回收，因此会把这个对象 catch 后 “吃掉”，导致丢失了异常堆栈。

- `finalize` 可能导致僵尸对象，如果一个原本将要被 GC 的对象在其 `finalize` 方法将自身（`this`）重新赋值给了某个引用，从而完成了“复活”。而由于 JVM 规定一个对象的 `finalize` 方法最多只会调用一次，因此当它们真正被回收的时候，`finalize`反而不会被调用了。

总而言之，就是 `finalize` 调用时机是不确定的，由 JVM 决定。我们不能依靠这个不确定的调用时机去做一些比较重要的回收操作。

### 2. Cleaner
`Cleaner`通过继承虚引用 `PhantomReference`来追踪被引用对象 `Referent`，当 `Referent` 只被虚引用所引用而被 GC 回收后，`reference-handler thread`会去调用 `Cleaner.clean` 方法来完成对象的资源回收。

> A cleaner tracks a referent object and encapsulates a thunk of arbitrary cleanup code.  Some time after the GC detects that a cleaner's referent has become phantom-reachable, the reference-handler thread will run the cleaner.Cleaners may also be invoked directly; they are thread safe and ensure that they run their thunks at most once.

这里要一点需要注意的是，封装了清理动作的 `Runnable`尽量不要定义成非静态内部类或者 lambda 表达式，因为这有可能导致非静态内部类的对象持有了外部类的引用，导致 `Referent` 无法成为 `Phontom Reference`，从而无法完成清理。其工作原理如下图所示。

![./assets/cleaner.png](./assets/cleaner.png)

### 参考链接

- [Finalize被废弃，Native垃圾回收该怎么办？](https://juejin.cn/post/6921910427408400392)
- [ART虚拟机 | Finalize的替代者Cleaner](https://juejin.cn/post/6891918738846105614#heading-6)

