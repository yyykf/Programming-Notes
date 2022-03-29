直接上代码。

```java
public class HashMapTest {
    public static void main(String[] args) {
        final HashMap<String, String> hashMap = new HashMap<String, String>(4) {{
            put("A", "JAVA2 EE");
            put("B", "JAVA2 Card");
            put("C", "JAVA2 ME");
            put("D", "JAVA2 HE");
        }};
    }
}
```

第一眼看到这双括号初始化的时候是否有点迷惑。首先看第一对括号，它代表的是定义了一个继承于 `HashMap` 的匿名内部类 。而第二对括号则是一个实例代码块，实例代码块中则对该匿名内部类的对象进行了初始化。

看一下生成的字节码就明白了。

```java
Classfile /D:/Dev/IdeaProjects/work/demo-all/jdk-demo/src/main/java/cn/ykf/jdk/model/HashMapTest.class
  Last modified 2022-3-27; size 381 bytes
  MD5 checksum d792e869926238e58b769c0318318e62
  Compiled from "HashMapTest.java"
public class cn.ykf.jdk.model.HashMapTest
  minor version: 0
  major version: 52
  flags: ACC_PUBLIC, ACC_SUPER
Constant pool:
   #1 = Methodref          #5.#15         // java/lang/Object."<init>":()V
   #2 = Class              #16            // cn/ykf/jdk/model/HashMapTest$1
   #3 = Methodref          #2.#17         // cn/ykf/jdk/model/HashMapTest$1."<init>":(I)V
   #4 = Class              #18            // cn/ykf/jdk/model/HashMapTest
   #5 = Class              #19            // java/lang/Object
   #6 = Utf8               InnerClasses
   #7 = Utf8               <init>
   #8 = Utf8               ()V
   #9 = Utf8               Code
  #10 = Utf8               LineNumberTable
  #11 = Utf8               main
  #12 = Utf8               ([Ljava/lang/String;)V
  #13 = Utf8               SourceFile
  #14 = Utf8               HashMapTest.java
  #15 = NameAndType        #7:#8          // "<init>":()V
  #16 = Utf8               cn/ykf/jdk/model/HashMapTest$1
  #17 = NameAndType        #7:#20         // "<init>":(I)V
  #18 = Utf8               cn/ykf/jdk/model/HashMapTest
  #19 = Utf8               java/lang/Object
  #20 = Utf8               (I)V
{
  public cn.ykf.jdk.model.HashMapTest();
    descriptor: ()V
    flags: ACC_PUBLIC
    Code:
      stack=1, locals=1, args_size=1
         0: aload_0
         1: invokespecial #1                  // Method java/lang/Object."<init>":()V
         4: return
      LineNumberTable:
        line 9: 0

  public static void main(java.lang.String[]);
    descriptor: ([Ljava/lang/String;)V
    flags: ACC_PUBLIC, ACC_STATIC
    Code:
      stack=3, locals=2, args_size=1
         0: new           #2                  // class cn/ykf/jdk/model/HashMapTest$1
         3: dup
         4: iconst_4
         5: invokespecial #3                  // Method cn/ykf/jdk/model/HashMapTest$1."<init>":(I)V
         8: astore_1
         9: return
      LineNumberTable:
        line 12: 0
        line 20: 9
}
SourceFile: "HashMapTest.java"
InnerClasses:
     static #2; //class cn/ykf/jdk/model/HashMapTest$1
```

从上面的字节码可以看到，`new` 指令就是创建了一个 `HashMapTest$1` 类的对象，也就是我们说的继承自 `HashMap` 的匿名内部类。

```java
class cn.ykf.jdk.model.HashMapTest$1 extends java.util.HashMap<java.lang.String, java.lang.String> {
  final cn.ykf.jdk.model.HashMapTest this$0;

  cn.ykf.jdk.model.HashMapTest$1(cn.ykf.jdk.model.HashMapTest);
    Code:
       0: aload_0
       1: aload_1
       2: putfield      #1                  // Field this$0:Lcn/ykf/jdk/model/HashMapTest;
       5: aload_0
       6: invokespecial #2                  // Method java/util/HashMap."<init>":()V
       9: aload_0
      10: ldc           #3                  // String A
      12: ldc           #4                  // String JAVA2 EE
      14: invokevirtual #5                  // Method put:(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;
      17: pop
      18: aload_0
      19: ldc           #6                  // String B
      21: ldc           #7                  // String JAVA2 Card
      23: invokevirtual #5                  // Method put:(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;
      26: pop
      27: aload_0
      28: ldc           #8                  // String C
      30: ldc           #9                  // String JAVA2 ME
      32: invokevirtual #5                  // Method put:(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;
      35: pop
      36: aload_0
      37: ldc           #10                 // String D
      39: ldc           #11                 // String JAVA2 HE
      41: invokevirtual #5                  // Method put:(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;
      44: pop
      45: aload_0
      46: ldc           #12                 // String E
      48: ldc           #13                 // String JAVA2 SE
      50: invokevirtual #5                  // Method put:(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;
      53: pop
      54: getstatic     #14                 // Field java/lang/System.out:Ljava/io/PrintStream;
      57: aload_0
      58: getfield      #1                  // Field this$0:Lcn/ykf/jdk/model/HashMapTest;
      61: invokestatic  #15                 // Method cn/ykf/jdk/model/HashMapTest.access$000:(Lcn/ykf/jdk/model/HashMapTest;)I
      64: invokevirtual #16                 // Method java/io/PrintStream.println:(I)V
      67: return
}
```

这种一对双括号的初始化方式也称 `Double Curly Braces`，虽然写起来感觉很爽，看起来像是骚操作，但是生产中是完全不建议使用的。

首先是可读性的问题，如果此时有着多重嵌套的双括号，那么整段代码看起来就比较像是 JSON 的格式，但是很奇怪。

```java
Map source = new HashMap(){{
    put("firstName", "John");
    put("lastName", "Smith");
    put("organizations", new HashMap(){{
        put("0", new HashMap(){{
            put("id", "1234");
        }});
        put("abc", new HashMap(){{
            put("id", "5678");
        }});
    }});
}};
```

第二点就是每次声明一个新的嵌套时，都会导致一个不可复用的类被加载到 JVM 中，给类加载器带了不必要的负担。

最后就是可能出现内存泄漏的问题。因为从上面的字节码可以看到，这个继承自 `HashMap` 的匿名内部类是持有外部类 `this` 的引用的。如果在一个 Web 应用中，这个匿名内部类对象被暴露给了外部使用，那么有可能导致外部类对象无法被垃圾回收，因为它一直被内部类对象所持有。

以上，一句话总结，双括号初始化 `Map` 的方式就是「用着一时爽，回收火葬场」，因此请不要在生产中使用该方式。