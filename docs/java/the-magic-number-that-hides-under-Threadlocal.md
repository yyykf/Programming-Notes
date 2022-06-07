---
title: 隐藏在ThreadLocal中的魔数
isOriginal: true
---
ThraedLocal 中的 Hash 码增量 `0x61c88647` 有什么含义呢？

```java
public class ThreadLocal<T> {
    private final int threadLocalHashCode = nextHashCode();

    private static AtomicInteger nextHashCode = new AtomicInteger();

    private static final int HASH_INCREMENT = 0x61c88647;
    // ....
}
```

首先我们先来 Get 一个概念，叫做黄金分割率 ![img](https://typora-pics-1255993109.cos.ap-guangzhou.myqcloud.com/512c823afe20cbcc364d48b771b485a7.svg)。当我们将 ![img](https://typora-pics-1255993109.cos.ap-guangzhou.myqcloud.com/7f48d4a68765673379b41e1b1ee20edf.svg) 和 ![img](https://typora-pics-1255993109.cos.ap-guangzhou.myqcloud.com/f19901f1c817ad846a411e6712e8db66.svg) 相乘时可以得到 `2654435769`，它对应的二进制表示为 `1001 1110 0011 0111 0111 1001 1011 1001`，可以看到已经超过了 int 的表示范围，将其强转为 int 后可以得到 `-1640531527`，其绝对值 `1640531527` 对应的十六进制表示就是 `0x61c88647`。换句话说，这个数就是 32 位数字对应的黄金分割数。感兴趣的话可以用以下代码实验一下。

```java
public static void main(String[] args) {
    // 黄金分割 0.618
    final double goldRatio = (Math.sqrt(5) - 1) / 2;
    System.out.println(goldRatio);
    // 2654435769
    final long val = (long) ((1L << 32) * goldRatio);
    System.out.println(val);
    // -1640531527
    System.out.println((int) val);
    // 相反数，1640531527
    System.out.println((1L << 32) - val);
    // 0x61c88647
    System.out.println(Integer.toHexString((int) ((1L << 32) - val)));
}
```

知道这个知识点后，我们再简单说一下 `ThreadLocal` 的实现。`ThreadLocal` 用于存放线程本地变量，它实际上是将自身作为 `key`，对应的线程本地变量作为 `value`，放入线程的 `ThreadLocalMap` 中的。 `ThreadLocalMap` 是一个类似于 `HashMap` 的实现，不过它并没有去实现 `Map` 的相关接口，而是自己实现了 `key-value` 的存储逻辑。

同时，`ThreadLocalMap` 是通过生成一个有规律的数值序列来作为元素的哈希值的，并不是像常见的通过 `hashCode()` 计算哈希值。更重要的一点是，我们常见的 `HashMap` 对于哈希冲突是使用拉链法来解决的，而`ThreadLocalMap` 则是采用开放寻址法中的线性探测来解决哈希冲突，每次出现哈希冲突时，都会按顺序探测下一个可用的槽位。因为 `ThreadLocalMap` 的桶长度是一直大于等于所需元素的数量的，所以一定能找到一个可用的槽位，这也是开放寻址法的一个前提。

探测过程相对来说是一个比较费时的操作，因此 `ThreadLocalMap` 需要让生成的哈希值最终能够均匀地散列在数组中的各个位置。此时 `0x61c88647` 这个魔数就派上用场了，它可以让元素散列地特别均匀。`ThreadLocalMap` 每次生成哈希值时，都会在上一个元素的哈希值的基础上加上 `0x61c88647`，可以通过以下代码模拟散列结果。

```java
public static void main(String[] args) {
    Map<Integer, Integer> idxMap = new HashMap<>();
    // 黄金分割点 @see ThreadLocal#HASH_INCREMENT
    int HASH_INCREMENT = 0x61c88647;
    int hash;
    int index;
    for (int i = 1; i < 1000; i++) {
        // 每个元素相差的hash值就是HASH_INCREMENT
        hash = i * HASH_INCREMENT + HASH_INCREMENT;
        index = hash & (1024 - 1);

        // 记录每个index的次数
        idxMap.merge(index, 1, Integer::sum);

        System.out.printf("斐波那契数列散列结果：%d，普通散列结果：%d%n", index, String.valueOf(i).hashCode() & (1024 - 1));
    }

    System.out.println(idxMap);
    System.out.printf("是否出现哈希冲突: %b", idxMap.entrySet().stream().anyMatch(entry -> entry.getValue() > 1));
}
```

最后给出一个提示，当使用 `ThreadLocal` 时，尽量不要使用太多的 `ThreadLocal` 来分别存储不同的变量，可以考虑直接存放 `Map` 本地变量。因为太多的 `ThreadLocal` 有可能导致 `ThreadLocalMap` 出现哈希冲突，多了一些开销。

### 参考链接

- [What is the meaning of 0x61C88647 constant in ThreadLocal.java](https://stackoverflow.com/questions/38994306/what-is-the-meaning-of-0x61c88647-constant-in-threadlocal-java)