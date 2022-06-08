---
title: 模板模式
isOriginal: true
---
模版模式（Template Pattern）属于行为型模式，它的核心就是由抽象类定义好一个模版方法，其中规定了各个步骤的执行顺序，但是具体的步骤实现交由子类去实现。类似于领导布置了任务，然后下层员工怎么执行由下层员工自己决定。

在 JDK 类库中就用到了该设计模式。`AbstractQueuedSynchronizer` 类定义了独占获取资源的步骤，即 `acquire()` 方法，但是具体的获取方法 `tryAcquire` 方法并没有实现，需要子类去实现。

```java
public abstract class AbstractQueuedSynchronizer
    extends AbstractOwnableSynchronizer
    implements java.io.Serializable {

    public final void acquire(int arg) {
        if (!tryAcquire(arg) &&
            acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
            selfInterrupt();
    }
    
    /** 需要子类实现 */
    protected boolean tryAcquire(int arg) {
        throw new UnsupportedOperationException();
    }
    
    /** 默认实现 */
    final boolean acquireQueued(final Node node, int arg) {
        // ...
    }
    
}
```
例如 `ReentrantLock.FairSync` 就继承了 `AbstractQueuedSynchronizer` 类，并且实现了 `tryAcquire()` 方法。
```java
public class ReentrantLock implements Lock, java.io.Serializable {

    abstract static class Sync extends AbstractQueuedSynchronizer {
        // ...
    }
    
    static final class FairSync extends Sync {

        final void lock() {
            acquire(1);
        }

        /** 具体实现 */
        protected final boolean tryAcquire(int acquires) {
            // ...
        }
    }
}
```
这里有一些小细节，注意 `AbstractQueuedSynchronizer` 中的模版方法 `acquire()` 使用了 `final` 修饰，这样可以防止子类修改了步骤的执行顺序，保证所有子类都是按相同的执行顺序去执行的。同时，对于需要子类实现的 `tryAcquire()` 方法，可以像上面那样使用 `protected` 修饰后给出一个默认实现，也可以给方法加上 `abstract` 使其成为抽象方法。

这个就取决于具体的场景了，如果该方法没有默认实现，一定需要子类来实现的话，就可以加上 `abstract` 修饰。
