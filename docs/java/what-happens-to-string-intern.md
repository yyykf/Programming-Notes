---
title: String.intern()发生了啥
isOriginal: true
---
首先来看一段八股文经常能见到类似的代码段，如下所示。

```java
String s3 = new String("1") + new String("1");	// 语句1
s3.intern();									// 语句2
String s4 = "11";								// 语句3

System.out.println(s3 == s4);
```

如果说上面这段代码的运行结果是 `true` 的话，会不会有小伙伴感觉到摸不着头脑呢？我们先来看一下 `String#intern()` 方法的「JavaDoc」是怎么说的（以下内容基于**「OracleJDK 1.8.0_202」**）。

```java
/**
 * Returns a canonical representation for the string object.
 * <p>
 * A pool of strings, initially empty, is maintained privately by the
 * class {@code String}.
 * <p>
 * When the intern method is invoked, if the pool already contains a
 * string equal to this {@code String} object as determined by
 * the {@link #equals(Object)} method, then the string from the pool is
 * returned. Otherwise, this {@code String} object is added to the
 * pool and a reference to this {@code String} object is returned.
 * <p>
 * It follows that for any two strings {@code s} and {@code t},
 * {@code s.intern() == t.intern()} is {@code true}
 * if and only if {@code s.equals(t)} is {@code true}.
 * <p>
 * All literal strings and string-valued constant expressions are
 * interned. String literals are defined in section {@jls 3.10.5} of the
 * <cite>The Java Language Specification</cite>.
 *
 * @return  a string that has the same contents as this string, but is
 *          guaranteed to be from a pool of unique strings.
 */
public native String intern();
```

简单翻译一下，`String` 类私下维护了一个字符串常量池（其实就是「StringTable」）。当某个字符串对象的 `intern()` 方法被调用时：

- 如果字符串常量池中未含有相同的字符串（通过 `equals()` 方法判断是否相同），那么该字符串对象就会被添加到字符串常量池中，同时返回一个指向该字符串对象的引用。
- 如果字符串常量池中已经含有相同的字符串，那么就直接返回常量池中字符串对象的引用。

也就是说，如果「字符串对象A」和「字符串对象B」的内容是相同的话（即 `a.equals(b) == true`），那么 `a.intern() == b.intern()` 就是成立的，最终都是指向同一个常量池中的字符串。

同时，所有的字符串字面量和字符串常量都是存在常量池中，也就是「JavaDoc」中所说的 `interned`。

#### 「语句1」发生了啥？

在了解 `intern()` 的作用后，我们再来看一下文章开头的代码段中的「语句1」。

```java
@IntrinsicCandidate
public String(String original) {
    this.value = original.value;
    this.coder = original.coder;
    this.hash = original.hash;
}
```

`new String("1")` 所调用的构造函数已经在上面展示了，千万不要忘记，该构造函数的参数 `"1"` 就是一个字面量，因此第一次调用 `new String("1")` 后常量池中会存在字符串 `"1"`，同时堆中也存在一个内容为 `"1"` 的字符串对象。而当第二次执行 `new String("1")` 的时候，由于常量池中已经存在 `"1"` 了，所以只会在堆中再次生成一个内容为 `"1"` 的字符串对象。最终经过拼接后，堆中生成了一个内容为 `"11"` 的字符串对象。此时在内存中是这样子的。

![img](https://typora-pics-1255993109.cos.ap-guangzhou.myqcloud.com/1645866108520-a9127a80-f3ab-4214-9f79-706203f57f1f.png)

可能有小伙伴会说，不对啊，语句1最终会得到一个内容为 `"11"` 的字符串对象，那么常量池中不是会有一个 `"11"` 吗？

其实没有的，因为「语句1」经过编译后，底层是变成了使用 `StringBuilder` 来拼接字符串，看一下编译后的字节码。

![img](https://typora-pics-1255993109.cos.ap-guangzhou.myqcloud.com/1645863359504-80d1f950-c191-4c4e-8414-2ea66c0f1a4d.png)

对于「语句1」来说，编译后的字节码可以分为 6 个步骤：

1. 调用 `new StringBuilder()` 创建了一个 `StringBuilder` 对象。
2. 创建了一个 `String` 对象，其内容为 `"1"`，注意这里的 `LDC "1"` 表示将 `"1"` 从常量池中推至操作数栈顶。

1. 调用了 `StringBuilder.add(String)` 将新创建的字符串对象的内容 `"1"` 拼接进去。
2. 同第2步。

1. 同第3步。
2. 最后调用了 `StringBuilder.toString()` 将拼接后的内容转成一个新的字符串对象。

可以看到，在整个拼接过程中，并没有出现过 `"11"` 的字面量，而编译器也没有那么智能，一眼就看出最终的内容是 `"11"`，所以最终字符串常量池中并没有存在 `"11"`。

这里再多说一句，只要不是字符串字面量的拼接或者常量替换（见下面的代码段），那么最终编译后都是使用 `new StringBuilder()` 来进行字符串拼接的。

```java
// 字面量的拼接，直接为 "aa"
String a = "a" + "a";
// 常量替换，d 直接替换为 "bc"
final String b = "b";
final String c = "c";
String d = b + c;

// 会使用 StringBuilder 拼接
String e = "a" + new String("e");
```

#### 「语句2」发生了啥？

继续往下看，「语句2」直接调用了 `intern()` 方法，那么按照上面的文档，由于此时常量池中并不存在 `"11"` 的对象，因此 `"11"` 的字符串字面量会被添加到常量池中，此时的内存区域是这样的。

![img](https://typora-pics-1255993109.cos.ap-guangzhou.myqcloud.com/1645869231736-4e3770b5-5758-4475-a5af-405b8dcd493b.png)

这里有一点需要提一下，在 「JDK 1.7」之前，`intern()` 会拷贝一个对象将其放入常量池中，此时的常量池是位于 `Perm`区的，并不是堆。而到了 「JDK 1.7」时，`intern()` 不再拷贝一份内容放入常量池了，而是直接在常量池保存一个引用，这个引用指向了堆中的对象。

因此，如果是使用 「JDK 1.6」的话，那么文章开头的代码运行结果将会是 `false`，因为最终 `s3` 指向了堆中的对象，而 `s4` 指向了常量池中的对象。

#### 「语句3」发生了啥？

看到这里应该很清晰了，「语句3」直接使用字面量 `"11"` 创建了一个新的字符串的对象，而由于此时常量池中已经有 `"11"`了，所以会直接将该引用赋值给 `s4`，而该引用实际上就是指向堆中的 `"11"` 对象的，所以最终的结果就是 `true`。

![img](https://typora-pics-1255993109.cos.ap-guangzhou.myqcloud.com/1645869778010-40dd40e4-d037-456c-a653-faf875a19079.png)

最后附上两张不同版本下的分析图。

- 「JDK 1.7」之前

![intern_jdk6](https://typora-pics-1255993109.cos.ap-guangzhou.myqcloud.com/intern_jdk6.png)

- 「JDK 1.7」及之后

![intern_after_jdk7](https://typora-pics-1255993109.cos.ap-guangzhou.myqcloud.com/intern_after_jdk7.png)