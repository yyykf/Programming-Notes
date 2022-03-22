我们知道，在 Spring 中，不管常见的切面编程、事务管理器还是异步功能，它们都是基于 AOP 来实现的，而 AOP 的核心就是动态代理。

而动态代理又分为了「JDK 代理」和「Cglib 代理」这两种，那么 Spring 默认的代理方式是什么呢？

先说结论，默认情况是使用 JDK 动态代理，只有在显式指定使用 「Cglib 代理」或者被代理类未实现接口的时候，Spring 才会使用「Cglib 代理」。

当我们要开启 AOP 功能、事务功能或者异步功能时，我们可以很方便地通过 `@EnableAspectJAutoProxy`、`@EnableTransactionManagement` 以及 `@EnableAsync` 注解来开启。注意到这三个注解内部都定义了一个相同的属性 `proxyTargetClass`，来看一下它们的「JavaDoc」是怎么写的。

```java
public @interface EnableAspectJAutoProxy {

	/**
	 * Indicate whether subclass-based (CGLIB) proxies are to be created as opposed
	 * to standard Java interface-based proxies. The default is {@code false}.
	 */
	boolean proxyTargetClass() default false;
}

public @interface EnableAsync {
	/**
	 * Indicate whether subclass-based (CGLIB) proxies are to be created as opposed
	 * to standard Java interface-based proxies.
	 * <p><strong>Applicable only if the {@link #mode} is set to {@link AdviceMode#PROXY}</strong>.
	 * <p>The default is {@code false}.
	 * <p>Note that setting this attribute to {@code true} will affect <em>all</em>
	 * Spring-managed beans requiring proxying, not just those marked with {@code @Async}.
	 * For example, other beans marked with Spring's {@code @Transactional} annotation
	 * will be upgraded to subclass proxying at the same time. This approach has no
	 * negative impact in practice unless one is explicitly expecting one type of proxy
	 * vs. another &mdash; for example, in tests.
	 */
	boolean proxyTargetClass() default false;
}

public @interface EnableTransactionManagement {

	/**
	 * Indicate whether subclass-based (CGLIB) proxies are to be created ({@code true}) as
	 * opposed to standard Java interface-based proxies ({@code false}). The default is
	 * {@code false}. <strong>Applicable only if {@link #mode()} is set to
	 * {@link AdviceMode#PROXY}</strong>.
	 * <p>Note that setting this attribute to {@code true} will affect <em>all</em>
	 * Spring-managed beans requiring proxying, not just those marked with
	 * {@code @Transactional}. For example, other beans marked with Spring's
	 * {@code @Async} annotation will be upgraded to subclass proxying at the same
	 * time. This approach has no negative impact in practice unless one is explicitly
	 * expecting one type of proxy vs another, e.g. in tests.
	 */
	boolean proxyTargetClass() default false;
}
```

从上面的「JavaDoc」可以知道，`proxyTargetClass` 属性指示了是否要代理目标类，也就是使用「Cglib 代理」。而默认情况下，这三个注解的该属性都是 `false`，代表不开启「Cglib 代理」。同时，从 `@EnableAsync` 和 `@EnableTransactionManagement` 中该属性的「JavaDoc」我们还可以知道，如果将 `proxyTargetClass` 指定为 `true` 的话，那么容器中所有需要代理的 Bean 都会受到该设置的影响，而不仅仅是那些标注了 `@Transactional` 和 `@Async` 注解的 Bean。

> 其实 `@EnableAsync` 和 `@EnableTransactionManagement` 注解的 `mode` 属性的「JavaDoc」中还提到了一个平常在使用事务或者异步时经常会踩的坑，就是类内调用事务方法或者异步方法不生效。因为该属性的默认值为 `AdviceMode.PROXY`。代表只有通过代理对象访问这些事务方法或者异步方法时，增强才会生效，而对于类内调用的事务方法或者异步方法，由于本质上是通过目标对象直接去访问的，并未经过代理对象，因此这些增强是不会生效的。如果想要这种类内调用的场景也能被增强，那就应该考虑 `AdviceMode.ASPECTJ` 模式。

至于具体的 AOP 代理对象创建过程中，`proxyTargetClass` 最终是怎么生效的，其实答案是藏在 `org.springframework.aop.framework.DefaultAopProxyFactory#createAopProxy` 方法中。

```java
public class DefaultAopProxyFactory implements AopProxyFactory, Serializable {

	@Override
	public AopProxy createAopProxy(AdvisedSupport config) throws AopConfigException {
		if (config.isOptimize() || config.isProxyTargetClass() || hasNoUserSuppliedProxyInterfaces(config)) {
			Class<?> targetClass = config.getTargetClass();
			if (targetClass == null) {
				throw new AopConfigException("TargetSource cannot determine target class: " +
						"Either an interface or a target is required for proxy creation.");
			}
			if (targetClass.isInterface() || Proxy.isProxyClass(targetClass)) {
				return new JdkDynamicAopProxy(config);
			}
			return new ObjenesisCglibAopProxy(config);
		}
		else {
			return new JdkDynamicAopProxy(config);
		}
	}
}
```

可以看到，如果当前的 AOP 配置指定了 `proxyTargetClass=true`，那么在创建 AOP 对象时，会检查一下被代理类是否为接口，或者已经是一个代理类了，如果是的话，则通过「JDK 代理」，否则才通过「Cglib 代理」。反正记住一句话，即使开启了 `proxyTargetClass`，那么也不保证最终的 AOP 代理对象一定是通过「Cglib 代理」生成的。

至于文档说的该配置会影响到所有容器中需要被代理的对象，大家自行到源码中找答案吧。

> 其实是因为我也不会，太久没看 Spring 源码了。大概是因为 `DefaultAopProxyFactory` 是一个全局的配置吧，挖个坑有空补上。（逃