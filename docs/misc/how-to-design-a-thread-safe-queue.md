---
title: 关于实现一个内存安全队列的思路
isOriginal: true
---
首先 `java.util.concurrent.Executors#newFixedThreadPool(int)` 和 ` java.util.concurrent.Executors#newSingleThreadExecutor()` 等线程池默认底层使用的任务队列都是大小为 `Integer.MAAX_VALUE` 的 `LinkedBlockingQueue`，在这种情况下，队列近似无界，容易发生OOM。

为了避免OOM，我们可以从队列入手，通过限制队列的入队来保证内存不溢出。

#### 思路1:  保证JVM最低的可用内存
通过 `ManagementFactory.getMemoryMXBean()` 获取到 `MemoryMXBean`，利用 `MemoryMXBean` 获取到当前JVM的堆可用内存，当可用内存小于阈值的时候，说明JVM内存比较吃紧，这时候就禁止元素入队，保证内存不被进一步消耗，从而避免了OOM。

这种思路是从JVM的角度出发的，通过保证JVM的可用内存来避免OOM。
具体实现参考：

- [[ISSUE #10020] add MemorySafeLinkedBlockingQueue #10021](https://github.com/apache/dubbo/pull/10021/files#diff-6769ed7929148bd3bbfc88ac0cdd9ba38216a10352cbb3ab6d4dcc51ea8110d0)

#### 思路2: 限制队列最大的可用内存
为队列定义一个最大可用内存的字段，每次元素入队时，通过 `Instrumentation` 来统计元素的占用内存，并以此判断队列是否还可以容纳该元素，出队时则将元素对应的占用内存量归还给队列。

思路其实类似于限流的令牌桶或者信号量，每次入队时，需要队列还有足够的容纳能力，否则需要等待，出队时则归还对应资源。

这种思路则是从队列的角度出发的，通过限制队列的最大使用内存来避免OOM。

具体实现参考：
- [[ISSUE #9721] add memory limited linked blocking queue #9722](https://github.com/apache/dubbo/pull/9722/files)
- [[ISSUE #3318] Fix keep waiting for acquiring memory unexpectedly #3335](https://github.com/apache/incubator-shenyu/pull/3335)

这种思路其实有个弊端，那就是一般放在任务队列中的对象只是一个门面对象，其中一般会含有其他对象的引用。而通过 `Instrumentation` 统计的大小只是这个对象的大小，但是有可能所引用的对象占用了更大的空间，所以这个统计是不太准确，无法限制住真正的内存占用。

具体讨论参考：
- [这个队列的思路是真的好，现在它是我简历上的亮点了。](https://juejin.cn/post/7105968458851942414#comment)
