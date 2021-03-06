---
title: 简单工厂模式
isOriginal: true
---
《大话设计模式》一书中，开篇就用了一个计算器的例子来讲解简单工厂模式。简单来说，就是在设计计算器的时候，根据「单一职责原则」，可以将页面代码和计算代码分离，也就是分别建立一个界面类和一个计算类，界面类是上层类，通过调用计算类来完成计算。

紧接着，定义一个公共的计算接口，不同的运算操作分别实现各自的运算逻辑，即每种运算符对应一个运算类。

> 这里其实是策略模式吧。

简单工厂可以根据外部输入的运算符来返回对应的运算类，通过这种方式，使得运算类对上层透明，上层只需要传入运算符拿到对应的运算类进行调用即可。

```java
public class OperationFactory {
    
    public static Operation getOperation(String operator) {
        switch (operator) {
            case "+":
                return new AddOperation();
            case "-":
                return new SubOperation();
            case "*":
                return new MultiplyOperation();
            case "/":
                return new DivideOperation();
            default:
                return null;
        }
    }
}
```

最简单的实现方式就是像上面这样的，但是这种方式其实违背了开闭原则，每次新增运算类的时候都需要修改工厂方法，为其多增加一个分支。

为了使得代码更加符合开闭原则，我们可以通过一个 `Map` 来维护运算符和运算类的映射关系，每次新增运算操作的时候，只需要让 `Map` 多维护一个映射关系即可。

```java
public class OperationFactory {
    
    public static final Map<String, Operation> OPERATIONS = new HashMap<>(8);
    
    static {
        OPERATIONS.put("+", new AddOperation());
        OPERATIONS.put("-", new SubOperation());
        OPERATIONS.put("*", new MultiplyOperation());
        OPERATIONS.put("/", new DivideOperation());
    }
    
    public static Operation getOperation(String operator) {
        return OPERATIONS.get(operator);
    }
}
```

其实，如果我们此时有使用 `Spring` 的话，那我们有可能连这个映射关系都不用手动维护，可以利用 `Spring` 的自动注入来完成映射的维护。

需要注意，这种方式要确保工厂类和运算类都必须是 Bean，这样才可以被 `Spring` 管理起来。

首先需要改造运算接口，使每个运算类都可以通过 `getKey()` 方法向外提供一个标识符。

```java
public interface Operation {

    Number compute(Number a, Number b);

    String getKey();
}
```

接着利用 `Spring` 的主动注入以及初始方法，完成对运算类的映射关系维护。

```java
@Component
public class OperationFactory {

    public static final Map<String, Operation> OPERATIONS = new HashMap<>(8);

    @Resource
    private List<Operation> operations;

    @PostConstruct
    public void initOperations() {
        OPERATIONS.putAll(operations.stream().collect(Collectors.toMap(Operation::getKey, Function.identity())));
    }

    public static Operation getOperation(String operator) {
        return OPERATIONS.get(operator);
    }
}
```

以上就是简单工厂模式的介绍，应该算是一种很基础的设计模式了。