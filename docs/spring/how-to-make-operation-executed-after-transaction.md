---
title: 关于在Spring事务后执行业务操作的场景
isOriginal: true
---
比如现在有一个场景是当事务成功提交后，我们需要发送短信通知用户或者发送MQ通知消费方，那么我们可能是这样做的。

```java
@Transactional
public void doSometing() {
    // 业务操作...
 
    // 发送短信或者MQ
    sendSms();
    // sendMq();
}
```

这样有个问题就是，当触发发送逻辑的时候，我们的事务并未完成提交。假如是 MQ 消息，那么消费方有可能在事务提交之前就开始消费消息，当消费方依赖于此时业务操作中的数据的话，那么有可能就消费失败了。

为了避免这种情况，我们可以利用 Spring 的事件监听机制来使得发送操作延迟到事务提交后。

首先在业务方，我们需要拿到 Spring 中的事件发布器，可以通过实现 `ApplicationEventListenerAware` 接口来获取到。

```java
@Component
public class MyServiceImpl implements ApplicationEventPublisherAware {
    
    private ApplicationEventPublisher applicationEventPublisher;
    
    @Override
    public void setApplicationEventPublisher(ApplicationEventPublisher applicationEventPublisher) {
        this.applicationEventPublisher = applicationEventPublisher;
    }
}
```

如果想要更简洁一点，那么也可以直接通过 `@Resource` 或者 `@Autowired` 让 Spring 帮我们自动注入。

不管使用哪种方式，一定要确保我们的业务类是被 Spring 管理的 Bean。

有了事务发布器后，我们还需要有一个事件监听器来监听发布的事件。一般情况下，我们是使用 `@EventListener` 来标注我们的监听方法，但是此时我们的事件监听是和事务挂钩的，因此需要使用 `@TransactionalEventListener` 来标注，其「JavaDoc」如下所示。

```java
/**
 * An {@link EventListener} that is invoked according to a {@link TransactionPhase}.
 *
 * <p>If the event is not published within an active transaction, the event is discarded
 * unless the {@link #fallbackExecution} flag is explicitly set. If a transaction is
 * running, the event is processed according to its {@code TransactionPhase}.
 *
 * <p>Adding {@link org.springframework.core.annotation.Order @Order} to your annotated
 * method allows you to prioritize that listener amongst other listeners running before
 * or after transaction completion.
 *
 * @author Stephane Nicoll
 * @author Sam Brannen
 * @since 4.2
 */
@Target({ElementType.METHOD, ElementType.ANNOTATION_TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@EventListener
public @interface TransactionalEventListener {

	/**
	 * Phase to bind the handling of an event to.
	 * <p>The default phase is {@link TransactionPhase#AFTER_COMMIT}.
	 * <p>If no transaction is in progress, the event is not processed at
	 * all unless {@link #fallbackExecution} has been enabled explicitly.
	 */
	TransactionPhase phase() default TransactionPhase.AFTER_COMMIT;

	/**
	 * Whether the event should be processed if no transaction is running.
	 */
	boolean fallbackExecution() default false;

	/**
	 * Alias for {@link #classes}.
	 */
	@AliasFor(annotation = EventListener.class, attribute = "classes")
	Class<?>[] value() default {};

	/**
	 * The event classes that this listener handles.
	 * <p>If this attribute is specified with a single value, the annotated
	 * method may optionally accept a single parameter. However, if this
	 * attribute is specified with multiple values, the annotated method
	 * must <em>not</em> declare any parameters.
	 */
	@AliasFor(annotation = EventListener.class, attribute = "classes")
	Class<?>[] classes() default {};

	/**
	 * Spring Expression Language (SpEL) attribute used for making the event
	 * handling conditional.
	 * <p>The default is {@code ""}, meaning the event is always handled.
	 * @see EventListener#condition
	 */
	String condition() default "";

}
```

这里面有两个属性比较重要的，就是 `phase`，该属性指定了要在事务的哪个阶段处理监听的事件，默认情况下是 `TransactionPhase.AFTER_COMMIT`，即事务提交后才处理事件。根据业务需要，我们也可以选择配置为其他的事务阶段，例如 `BEFORE_COMMIT` 事务提交前、`AFTER_ROLLBACK` 事务回滚后以及 `AFTER_COMPLETION` 事务完成后。

`AFTER_COMPLETION` 是一个比较粗粒度的控制，包括了 `AFTER_COMMIT` 和 `AFTER_ROLLBACK`，因此如果需要更细粒度的控制，应该考虑后两者。

另一个比较重要的属性就是 `fallbackExecution`，该属性表示当处理事件时，如果没有事务存在是否应该继续处理事件。默认值就是 `false`，也就是一定要有绑定在线程上的事务存在时才会处理触发的事件。官方文档中也提到了这一点，因为事务监听器的实现就是基于被 `PlatformTransactionManager` 所管理的，与线程绑定的事务实现的。

> @TransactionalEventListener only works with thread-bound transactions managed by PlatformTransactionManager. A reactive transaction managed by ReactiveTransactionManager uses the Reactor context instead of thread-local attributes, so from the perspective of an event listener, there is no compatible active transaction that it can participate in.

了解完 `@TransactionalEventListener` 的基本介绍后，我们来定义一个事务监听器。

```java
@TransactionalEventListener(Message.class)
public void sendMessageAfterTransaction(Message message) {
    // 发送短信或者MQ
    sendSms();
    // sendMq();
}
```

这里我们指定了监听 `Message` 这个类的事件，同时行为是默认的事务提交后。其实在 Spring 4.2 之前，我们监听的事件必须是 `ApplicationEvent` 的子类，不过后面 Spring 改造了一下，可以发布任何类型的事件，因为最终 Spring 会帮我们包装成 `PayloadApplicationEvent` 事件，它也是 `ApplicationEvent` 事件的子类。

通过上述方式，我们就可以很轻松地利用 Spring 来完成事务提交后再发送短信或者MQ的操作，其实这就是一个典型的观察者模式。

## 题外话

关于 Spring 是怎么实现在事务完成前后处理事件的，其实我们可以从源码中一窥究竟。先从事件发布入手，也就是 `org.springframework.context.support.AbstractApplicationContext#publishEvent(java.lang.Object)`。

```java
public abstract class AbstractApplicationContext extends DefaultResourceLoader
		implements ConfigurableApplicationContext {
	/**
	 * Publish the given event to all listeners.
	 * <p>Note: Listeners get initialized after the MessageSource, to be able
	 * to access it within listener implementations. Thus, MessageSource
	 * implementations cannot publish events.
	 * @param event the event to publish (may be an {@link ApplicationEvent}
	 * or a payload object to be turned into a {@link PayloadApplicationEvent})
	 */
	@Override
	public void publishEvent(Object event) {
		publishEvent(event, null);
	}
    
	/**
	 * Publish the given event to all listeners.
	 * @param event the event to publish (may be an {@link ApplicationEvent}
	 * or a payload object to be turned into a {@link PayloadApplicationEvent})
	 * @param eventType the resolved event type, if known
	 * @since 4.2
	 */
	protected void publishEvent(Object event, @Nullable ResolvableType eventType) {
		Assert.notNull(event, "Event must not be null");

		// Decorate event as an ApplicationEvent if necessary
		ApplicationEvent applicationEvent;
		if (event instanceof ApplicationEvent) {
			applicationEvent = (ApplicationEvent) event;
		}
		else {
			// 对于不是 ApplicationEvent 的事件，将其封装成 PayloadApplicationEvent，第一个参数 source 使用当前容器，代表该事件是当前容器发布的
			applicationEvent = new PayloadApplicationEvent<>(this, event);
			if (eventType == null) {
				eventType = ((PayloadApplicationEvent<?>) applicationEvent).getResolvableType();
			}
		}

		// Multicast right now if possible - or lazily once the multicaster is initialized
		if (this.earlyApplicationEvents != null) {
			this.earlyApplicationEvents.add(applicationEvent);
		}
		else {
      			// 将当前事件发布出去
			getApplicationEventMulticaster().multicastEvent(applicationEvent, eventType);
		}

		// Publish event via parent context as well...
		if (this.parent != null) {
			if (this.parent instanceof AbstractApplicationContext) {
				((AbstractApplicationContext) this.parent).publishEvent(event, eventType);
			}
			else {
				this.parent.publishEvent(event);
			}
		}
	}
}
```

Spring 的文档确实已经很细节了，`publishEvent(Object event)` 的「JavaDoc」提到了因为 `Listener` 监听器是在 `MessageSource` 之后初始化的，所以 `MessageSource` 是不可以发布事件的。

从上面可以看到，如果事件不是 `ApplicationEvent` 的子类，那么 Spring 会将其封装为一个 `PayloadApplicationEvent`，其内部持有了我们要发布的事件对象。紧接着 Spring 会获取到容器内的事件广播器 `ApplicationEventMulticaster`，将事务广播给所有监听该事件的监听器。

```java
public class SimpleApplicationEventMulticaster extends AbstractApplicationEventMulticaster {
    
	@Override
	public void multicastEvent(final ApplicationEvent event, @Nullable ResolvableType eventType) {
    		// 事件的类型
		ResolvableType type = (eventType != null ? eventType : resolveDefaultEventType(event));
		Executor executor = getTaskExecutor();
    		// 获取到监听该事件类型的所有监听器，并同步或异步调用
		for (ApplicationListener<?> listener : getApplicationListeners(event, type)) {
			if (executor != null) {
				executor.execute(() -> invokeListener(listener, event));
			}
			else {
        			// 同步调用监听器
				invokeListener(listener, event);
			}
		}
	}
    
	/**
	 * Invoke the given listener with the given event.
	 * @param listener the ApplicationListener to invoke
	 * @param event the current event to propagate
	 * @since 4.1
	 */
	protected void invokeListener(ApplicationListener<?> listener, ApplicationEvent event) {
		ErrorHandler errorHandler = getErrorHandler();
		if (errorHandler != null) {
			try {
				doInvokeListener(listener, event);
			}
			catch (Throwable err) {
				errorHandler.handleError(err);
			}
		}
		else {
      			// 调用监听器
			doInvokeListener(listener, event);
		}
	}
    
	private void doInvokeListener(ApplicationListener listener, ApplicationEvent event) {
		try {
      			// 调用监听器
			listener.onApplicationEvent(event);
		}
		catch (ClassCastException ex) {
			String msg = ex.getMessage();
			if (msg == null || matchesClassCastMessage(msg, event.getClass())) {
				// Possibly a lambda-defined listener which we could not resolve the generic event type for
				// -> let's suppress the exception and just log a debug message.
				Log logger = LogFactory.getLog(getClass());
				if (logger.isTraceEnabled()) {
					logger.trace("Non-matching event type for listener: " + listener, ex);
				}
			}
			else {
				throw ex;
			}
		}
	}
}


public abstract class AbstractApplicationEventMulticaster
		implements ApplicationEventMulticaster, BeanClassLoaderAware, BeanFactoryAware {
	/**
	 * Return a Collection of ApplicationListeners matching the given
	 * event type. Non-matching listeners get excluded early.
	 * @param event the event to be propagated. Allows for excluding
	 * non-matching listeners early, based on cached matching information.
	 * @param eventType the event type
	 * @return a Collection of ApplicationListeners
	 * @see org.springframework.context.ApplicationListener
	 */
	protected Collection<ApplicationListener<?>> getApplicationListeners(
			ApplicationEvent event, ResolvableType eventType) {

		Object source = event.getSource();
		Class<?> sourceType = (source != null ? source.getClass() : null);
		ListenerCacheKey cacheKey = new ListenerCacheKey(eventType, sourceType);

		// Quick check for existing entry on ConcurrentHashMap...
		ListenerRetriever retriever = this.retrieverCache.get(cacheKey);
		if (retriever != null) {
			return retriever.getApplicationListeners();
		}

		if (this.beanClassLoader == null ||
				(ClassUtils.isCacheSafe(event.getClass(), this.beanClassLoader) &&
						(sourceType == null || ClassUtils.isCacheSafe(sourceType, this.beanClassLoader)))) {
			// Fully synchronized building and caching of a ListenerRetriever
			synchronized (this.retrievalMutex) {
				retriever = this.retrieverCache.get(cacheKey);
				if (retriever != null) {
					return retriever.getApplicationListeners();
				}
				retriever = new ListenerRetriever(true);
				Collection<ApplicationListener<?>> listeners =
						retrieveApplicationListeners(eventType, sourceType, retriever);
				this.retrieverCache.put(cacheKey, retriever);
				return listeners;
			}
		}
		else {
			// No ListenerRetriever caching -> no synchronization necessary
      			// 检索监听该事件类型的监听器
			return retrieveApplicationListeners(eventType, sourceType, null);
		}
	}
    
	/**
	 * Actually retrieve the application listeners for the given event and source type.
	 * @param eventType the event type
	 * @param sourceType the event source type
	 * @param retriever the ListenerRetriever, if supposed to populate one (for caching purposes)
	 * @return the pre-filtered list of application listeners for the given event and source type
	 */
	private Collection<ApplicationListener<?>> retrieveApplicationListeners(
			ResolvableType eventType, @Nullable Class<?> sourceType, @Nullable ListenerRetriever retriever) {

		List<ApplicationListener<?>> allListeners = new ArrayList<>();
		Set<ApplicationListener<?>> listeners;
		Set<String> listenerBeans;
		synchronized (this.retrievalMutex) {
			listeners = new LinkedHashSet<>(this.defaultRetriever.applicationListeners);
			listenerBeans = new LinkedHashSet<>(this.defaultRetriever.applicationListenerBeans);
		}

		// Add programmatically registered listeners, including ones coming
		// from ApplicationListenerDetector (singleton beans and inner beans).
		for (ApplicationListener<?> listener : listeners) {
			if (supportsEvent(listener, eventType, sourceType)) {
				if (retriever != null) {
					retriever.applicationListeners.add(listener);
				}
				allListeners.add(listener);
			}
		}
    
    		// 省略其他检索步骤...
		return allListeners;
}
```

可以看到，Spring 首先会根据事件类型到容器中检索支持该事件类型的监听器，检索过程中还会涉及到一些缓存的检查，避免重复检索。当拿到支持该事件的事件监听器之后，取决于当前的配置，Spring 会选择使用线程池异步处理事件，也可能直接就调用监听器来处理事件。

到了最关键的一步，当检索到监听器后，其中会含有一个 `org.springframework.transaction.event.ApplicationListenerMethodTransactionalAdapter` 的监听器，它就是来处理这些和事务处理阶段有关的事件的。

```java
class ApplicationListenerMethodTransactionalAdapter extends ApplicationListenerMethodAdapter {
    
    private final TransactionalEventListener annotation;

    @Override
	public void onApplicationEvent(ApplicationEvent event) {
		if (TransactionSynchronizationManager.isSynchronizationActive() &&
				TransactionSynchronizationManager.isActualTransactionActive()) {
      			// 如果当前线程存在活跃的事务，那就创建一个事务相关的钩子，用于在事务各个阶段被触发
			TransactionSynchronization transactionSynchronization = createTransactionSynchronization(event);
			TransactionSynchronizationManager.registerSynchronization(transactionSynchronization);
		}
		else if (this.annotation.fallbackExecution()) {
			if (this.annotation.phase() == TransactionPhase.AFTER_ROLLBACK && logger.isWarnEnabled()) {
				logger.warn("Processing " + event + " as a fallback execution on AFTER_ROLLBACK phase");
			}
      			// 如果没有事务存在，但是 fallbackExecution 为 true，那就直接调用监听器中的方法
			processEvent(event);
		}
		else {
			// No transactional event execution at all
			if (logger.isDebugEnabled()) {
				logger.debug("No transaction is active - skipping " + event);
			}
		}
	}
    
	private TransactionSynchronization createTransactionSynchronization(ApplicationEvent event) {
		return new TransactionSynchronizationEventAdapter(this, event, this.annotation.phase());
	}

	private static class TransactionSynchronizationEventAdapter extends TransactionSynchronizationAdapter {

		private final ApplicationListenerMethodAdapter listener;

		private final ApplicationEvent event;

		private final TransactionPhase phase;

		public TransactionSynchronizationEventAdapter(ApplicationListenerMethodAdapter listener,
				ApplicationEvent event, TransactionPhase phase) {

			this.listener = listener;
			this.event = event;
			this.phase = phase;
		}
		@Override
		public void beforeCommit(boolean readOnly) {
			if (this.phase == TransactionPhase.BEFORE_COMMIT) {
				processEvent();
			}
		}

		@Override
		public void afterCompletion(int status) {
			if (this.phase == TransactionPhase.AFTER_COMMIT && status == STATUS_COMMITTED) {
        			// 配置了事务提交后，并且当前事务为已提交
				processEvent();
			}
			else if (this.phase == TransactionPhase.AFTER_ROLLBACK && status == STATUS_ROLLED_BACK) {
        			// 配置了事务回滚后，并且当前事务为已回滚
				processEvent();
			}
			else if (this.phase == TransactionPhase.AFTER_COMPLETION) {
        			// 配置了事务完成后
				processEvent();
			}
		}

		protected void processEvent() {
			this.listener.processEvent(this.event);
		}
}
```

好了，到这里就真相大白了。Spring 最终是使用 `ApplicationListenerMethodTransactionalAdapter` 监听器来监听事件的。当事件被触发的时候，首先检查一下当前线程是否事务，或者配置了 `fallbackExecution=true`，否则不处理事件。

- 如果存在事务的话，那么注册一个事务钩子到当前线程的事务中，这个事务钩子最终会由事务管理器在事务执行的不同阶段来触发，触发的时候取决于当前的配置以及事务状态，去选择是否处理事件。
- 如果不存在事务但是配置了 `fallbackExecution`，那就直接处理事件，也就是调用我们使用 `@TransactionalEventListener` 注解标注的方法。

至于事务钩子为什么可以生效，那就是事务管理器的事了，这里就不多赘述了，有兴趣的话可以自行 Debug 学习。

```java
public abstract class AbstractPlatformTransactionManager implements PlatformTransactionManager, Serializable {

    private void processCommit(DefaultTransactionStatus status) throws TransactionException {
		try {
			boolean beforeCompletionInvoked = false;

			try {
				boolean unexpectedRollback = false;
				prepareForCommit(status);
        			// 触发事务提交前钩子
				triggerBeforeCommit(status);
        			// 触发事务完成前钩子
				triggerBeforeCompletion(status);
				beforeCompletionInvoked = true;

				if (status.hasSavepoint()) {
					if (status.isDebug()) {
						logger.debug("Releasing transaction savepoint");
					}
					unexpectedRollback = status.isGlobalRollbackOnly();
					status.releaseHeldSavepoint();
				}
				else if (status.isNewTransaction()) {
					if (status.isDebug()) {
						logger.debug("Initiating transaction commit");
					}
					unexpectedRollback = status.isGlobalRollbackOnly();
          				// 事务提交
					doCommit(status);
				}
				else if (isFailEarlyOnGlobalRollbackOnly()) {
					unexpectedRollback = status.isGlobalRollbackOnly();
				}

				// Throw UnexpectedRollbackException if we have a global rollback-only
				// marker but still didn't get a corresponding exception from commit.
				if (unexpectedRollback) {
					throw new UnexpectedRollbackException(
							"Transaction silently rolled back because it has been marked as rollback-only");
				}
			}
			catch (UnexpectedRollbackException ex) {
				// can only be caused by doCommit
				triggerAfterCompletion(status, TransactionSynchronization.STATUS_ROLLED_BACK);
				throw ex;
			}
			catch (TransactionException ex) {
				// can only be caused by doCommit
				if (isRollbackOnCommitFailure()) {
					doRollbackOnCommitException(status, ex);
				}
				else {
					triggerAfterCompletion(status, TransactionSynchronization.STATUS_UNKNOWN);
				}
				throw ex;
			}
			catch (RuntimeException | Error ex) {
				if (!beforeCompletionInvoked) {
					triggerBeforeCompletion(status);
				}
				doRollbackOnCommitException(status, ex);
				throw ex;
			}

			// Trigger afterCommit callbacks, with an exception thrown there
			// propagated to callers but the transaction still considered as committed.
			try {
			        // 触发事务提交后钩子
				triggerAfterCommit(status);
			}
			finally {
			        // 触发事务完成钩子
				triggerAfterCompletion(status, TransactionSynchronization.STATUS_COMMITTED);
			}

		}
		finally {
			cleanupAfterCompletion(status);
		}
	}
```

## 参考链接

- [Transaction-bound Events](https://docs.spring.io/spring-framework/docs/current/reference/html/data-access.html#transaction-event)
