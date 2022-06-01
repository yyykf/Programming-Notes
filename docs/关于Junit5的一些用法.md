#### 1. @RepeatedTest 的使用

如果在测试某个用例的时候，需要重复执行多次，那么就可以使用 `@RepeatedTest` 指定重复执行的次数。**需要说明的是，使用 `@RepeatedTest` 标注的方法，返回值必须是 `void`，同时限定修饰符不能是 `private` 或者 `static`。**

> 测试用例的名称可以使用 `@DisplayName` 指定，如果没有的话默认则使用方法名。

![The default display name of RepeatedTest](https://typora-pics-1255993109.cos.ap-guangzhou.myqcloud.com/The%20default%20display%20name%20of%20RepeatedTest.png)

默认情况下，每次重复执行的名称会按照 `repetition {currentRepetition} of {totalRepetitions}` 的形式来展示，如果想要定制每次重复执行的名称，那么可以通过指定 `@RepeatedTest` 的 `name` 属性来实现自定义。

默认情况下，Junit 为我们提供了三个占位符，分别是 `{displayName}` 测试用例名称，`{currentRepetition}` 当前执行次数，`{totalRepetitions}` 总共执行次数，我们可以利用这些占位符来自定义格式，例如。

```java
@RepeatedTest(value = 2, name = "第 {currentRepetition}/{totalRepetitions} 次调度")
@DisplayName("测试提现失败")
void testWithdrawFail(RepetitionInfo repetitionInfo) {
}
```
![The custom display name of RepeatedTest](https://typora-pics-1255993109.cos.ap-guangzhou.myqcloud.com/The%20custom%20display%20name%20of%20RepeatedTest.png)

有些时候，我们还需要在用例中根据执行的次数来做一些不同的处理，那么此时就可以利用 `RepetitionInfo` 接口来获取到当前是重复执行第几次。使用的时候直接将其作为测试用例的方法即可，如下。

```java
@RepeatedTest(2)
@DisplayName("测试提现失败")
void testWithdrawFail(RepetitionInfo repetitionInfo) {
    BizResult result = paySeridService.handelPaySerid(getSerid(false));
    if (repetitionInfo.getCurrentRepetition() == 1) {
        // 第一次调度，转账失败
        assertFalse(result.isSucc());
    } else {
        // 第二次调度，更新调度结果成功
        assertTrue(result.isSucc());
    }
}
```

可以看下该接口的 JavaDoc。文档中写得很清楚，**该接口必须搭配 `@RepeatedTest` 使用，Junit 会帮我们自动注入对应的实例。**
同时，该接口也可以注入到 `@BeforeEach` 或者 `@AfterEach` 标注的方法上，这样在每次用例重复执行前/后，我们都可以在这些前置/后置方法中拿到当前执行的次数。

> 标注在 `@BeforeEach` 和 `@AfterEach` 一样要求相应的用例上标注了 `@RepeatedTest`，否则会抛出 org.junit.jupiter.api.extension.ParameterResolutionException。

```java
/**
 * {@code RepetitionInfo} is used to inject information about the current
 * repetition of a repeated test into {@code @RepeatedTest}, {@code @BeforeEach},
 * and {@code @AfterEach} methods.
 *
 * <p>If a method parameter is of type {@code RepetitionInfo}, JUnit will
 * supply an instance of {@code RepetitionInfo} corresponding to the current
 * repeated test as the value for the parameter.
 *
 * <p><strong>WARNING</strong>: {@code RepetitionInfo} cannot be injected into
 * a {@code @BeforeEach} or {@code @AfterEach} method if the corresponding test
 * method is not a {@code @RepeatedTest}. Any attempt to do so will result in a
 * {@link org.junit.jupiter.api.extension.ParameterResolutionException
 * ParameterResolutionException}.
 *
 * @since 5.0
 * @see RepeatedTest
 * @see TestInfo
 */
@API(status = STABLE, since = "5.0")
public interface RepetitionInfo {

	/**
	 * Get the current repetition of the corresponding
	 * {@link RepeatedTest @RepeatedTest} method.
	 */
	int getCurrentRepetition();

	/**
	 * Get the total number of repetitions of the corresponding
	 * {@link RepeatedTest @RepeatedTest} method.
	 *
	 * @see RepeatedTest#value
	 */
	int getTotalRepetitions();

}
```

#### 2.  @TestMethodOrder 的使用

正常情况下，测试用例是不应该和它们的执行顺序有关的，不过有些时候在集成测试或者功能测试时，我们需要使测试用例按照一定的顺序执行，那么这个时候就可以用上 `@TestMethodOrder` 了。

直接看一下 JavaDoc，文档中给出了一个例子，就是在测试类上标注 `@TestMethodOrder(MethodOrderer.OrderAnnotation.class)` ，并且在每个测试用例方法上标注 `@Order` 并指定其优先级，这样子测试用例就会根据 `@Order` 指定的大小，从小到大逐个执行测试用例了。

> 测试用例指的就是使用 `@Test` `@RepeatedTest` `@ParameterizedTest`  `@TestFactory`  `@TestTemplate` 所标注的方法。

```java
/*
 * Copyright 2015-2020 the original author or authors.
 *
 * All rights reserved. This program and the accompanying materials are
 * made available under the terms of the Eclipse Public License v2.0 which
 * accompanies this distribution and is available at
 *
 * https://www.eclipse.org/legal/epl-v20.html
 */

package org.junit.jupiter.api;

import static org.apiguardian.api.API.Status.EXPERIMENTAL;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Inherited;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.apiguardian.api.API;

/**
 * {@code @TestMethodOrder} is a type-level annotation that is used to configure
 * a {@link #value MethodOrderer} for the <em>test methods</em> of the annotated
 * test class or test interface.
 *
 * <p>In this context, the term "test method" refers to any method annotated with
 * {@code @Test}, {@code @RepeatedTest}, {@code @ParameterizedTest},
 * {@code @TestFactory}, or {@code @TestTemplate}.
 *
 * <p>If {@code @TestMethodOrder} is not explicitly declared on a test class,
 * inherited from a parent class, or declared on a test interface implemented by
 * a test class, test methods will be ordered using a default algorithm that is
 * deterministic but intentionally nonobvious.
 *
 * <h4>Example Usage</h4>
 *
 * <p>The following demonstrates how to guarantee that test methods are executed
 * in the order specified via the {@link Order @Order} annotation.
 *
 * <pre class="code">
 * {@literal @}TestMethodOrder(MethodOrderer.OrderAnnotation.class)
 * class OrderedTests {
 *
 *     {@literal @}Test
 *     {@literal @}Order(1)
 *     void nullValues() {}
 *
 *     {@literal @}Test
 *     {@literal @}Order(2)
 *     void emptyValues() {}
 *
 *     {@literal @}Test
 *     {@literal @}Order(3)
 *     void validValues() {}
 * }
 * </pre>
 *
 * @since 5.4
 * @see MethodOrderer
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@API(status = EXPERIMENTAL, since = "5.4")
public @interface TestMethodOrder {

	/**
	 * The {@link MethodOrderer} to use.
	 *
	 * @see MethodOrderer
	 * @see MethodOrderer.Alphanumeric
	 * @see MethodOrderer.OrderAnnotation
	 * @see MethodOrderer.Random
	 */
	Class<? extends MethodOrderer> value();

}
```

目前，Junit 为我们提供了三种默认的排序策略，分别是：

- Alphanumeric，按照测试用例的方法名的字母序进行执行。
- OrderAnnotation，按照 `@Order` 注解的值进行执行。
- Random，按照随机顺序执行。

