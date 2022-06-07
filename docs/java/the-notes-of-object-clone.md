---
title: Object.clone()的注意事项
isOriginal: true
---
先明确一点，`clone()` 方法是浅拷贝，而不是深拷贝，具体可以见下方的「JavaDoc」。

```java
public class Object {
    /**
     * Creates and returns a copy of this object.  The precise meaning
     * of "copy" may depend on the class of the object. The general
     * intent is that, for any object {@code x}, the expression:
     * <blockquote>
     * <pre>
     * x.clone() != x</pre></blockquote>
     * will be true, and that the expression:
     * <blockquote>
     * <pre>
     * x.clone().getClass() == x.getClass()</pre></blockquote>
     * will be {@code true}, but these are not absolute requirements.
     * While it is typically the case that:
     * <blockquote>
     * <pre>
     * x.clone().equals(x)</pre></blockquote>
     * will be {@code true}, this is not an absolute requirement.
     * <p>
     * By convention, the returned object should be obtained by calling
     * {@code super.clone}.  If a class and all of its superclasses (except
     * {@code Object}) obey this convention, it will be the case that
     * {@code x.clone().getClass() == x.getClass()}.
     * <p>
     * By convention, the object returned by this method should be independent
     * of this object (which is being cloned).  To achieve this independence,
     * it may be necessary to modify one or more fields of the object returned
     * by {@code super.clone} before returning it.  Typically, this means
     * copying any mutable objects that comprise the internal "deep structure"
     * of the object being cloned and replacing the references to these
     * objects with references to the copies.  If a class contains only
     * primitive fields or references to immutable objects, then it is usually
     * the case that no fields in the object returned by {@code super.clone}
     * need to be modified.
     * <p>
     * The method {@code clone} for class {@code Object} performs a
     * specific cloning operation. First, if the class of this object does
     * not implement the interface {@code Cloneable}, then a
     * {@code CloneNotSupportedException} is thrown. Note that all arrays
     * are considered to implement the interface {@code Cloneable} and that
     * the return type of the {@code clone} method of an array type {@code T[]}
     * is {@code T[]} where T is any reference or primitive type.
     * Otherwise, this method creates a new instance of the class of this
     * object and initializes all its fields with exactly the contents of
     * the corresponding fields of this object, as if by assignment; the
     * contents of the fields are not themselves cloned. Thus, this method
     * performs a "shallow copy" of this object, not a "deep copy" operation.
     * <p>
     * The class {@code Object} does not itself implement the interface
     * {@code Cloneable}, so calling the {@code clone} method on an object
     * whose class is {@code Object} will result in throwing an
     * exception at run time.
     *
     * @return     a clone of this instance.
     * @throws  CloneNotSupportedException  if the object's class does not
     *               support the {@code Cloneable} interface. Subclasses
     *               that override the {@code clone} method can also
     *               throw this exception to indicate that an instance cannot
     *               be cloned.
     * @see java.lang.Cloneable
     */
    protected native Object clone() throws CloneNotSupportedException;
}
```

文档中提到了，如果要使用 `clone()` 方法的话，那么对应的类需要实现 `Cloneable` 接口，并且返回的对象应该是通过调用 `super.clone()` 得到的。如果一个类以及它的父类（除了 `Object` 类）都能遵守这个约定的话，那么 `x.clone().getClass() == x.getClas()` 是一直成立的，来看下面这个例子。

```java
public class A implements Cloneable {

    protected int a ;
    
    public A() {
        System.out.println("A类的构造方法执行了");
    }

    public A(int a) {
        this.a = a;
    }

    @Override
    protected A clone() throws CloneNotSupportedException {
        return (A) super.clone();
    }
}

public class B extends A implements Cloneable {

    public B(int a) {
        super(a);
    }

    @Override
    protected B clone() throws CloneNotSupportedException {
        return (B) super.clone();
    }
}
```

虽然两个类中的 `clone()` 方法都限定为返回值为当前类，不过当 `B.clone()` 被调用时，那么 A 类中的 `(A) super.clone()` 只是相当于将克隆后的 B 对象用 A 引用接收后又返回给了 B 引用而已，本质上拿到的还是一个 B 对象。

但是 B 类如果不遵守约定，不是通过 `super.clone()` 来获取对象，而是直接手动创建对象的话，那么 `x.clone().getClass == x.getClass()` 就不一定会成立了。例如将 B 类的代码改成如下所示。

```java
public class B extends A implements Cloneable {
    
    public B() {
        System.out.println("B类的构造方法执行了");
    }

    public B(int a) {
        super(a);
    }

    @Override
    protected A clone() throws CloneNotSupportedException {
        final A a = new A(super.a);
        return a;
    }
}
```

先不说在 B 类中直接 `new` 了一个父类对象这种奇怪的操作，最重要的一点是，一旦破坏了这个约定，那么 `clone()` 的优势就丢失了。**因为通过** `**clone()**` **获取对象的时候，构造函数是不会被执行的**，如果一个类的构造函数比较复杂的话，那么通过手动创建对象来实现克隆的方式就会使得类的构造函数被调用，多了一些调用的开销。

再来看一下「JavaDoc」中的另一段说明。

>Otherwise, this method creates a new instance of the class of this object and initializes all its fields with exactly the contents of the corresponding fields of this object, as if by assignment; the contents of the fields are not themselves cloned. Thus, this method performs a "shallow copy" of this object, not a "deep copy" operation.

当 `clone()` 调用的时候，会创建一个当前类的新实例，然后用被克隆的对象中的实例域去初始化克隆对象的实例域，但是这个初始化的过程是不涉及到克隆的，只是简单的赋值。也就是说，这种克隆方式只是「浅克隆」，两个对象底层的成员变量的引用指向的对象都是一样的。

因此，如果当前类的克隆对象是需要完全独立于被克隆对象的话，那么还需要逐一调用成员变量的 `clone()`，保证成员变量也是独立的。