首先，每次通过 `SqlSessionFactory`去开启一个 `SqlSession` 会话的时候，就会创建一个执行器 `Executor`，同时创建一个 `DefaultSqlSession` 会话。

> 从 `org.apache.ibatis.session.Configuration#newExecutor(org.apache.ibatis.transaction.Transaction, org.apache.ibatis.session.ExecutorType)` 可以看到默认是使用 `SimpleExecutor` 这个执行器，同时如果允许缓存的话，还会在这个执行器的基础上，使用 `CachingExecutor` 这个执行器进行装饰。

在 `BaseExecutor` 内部定义了一个类型为 `PerpetualCache` 的缓存`localCache`，该缓存的 Key 是一个类型为 `CacheKey`，Value 则是对应的数据集合 `List`。

> CacheKey 内部的东西看起来就是一些参数占位符和具体参数值等。

这个所谓的 `localCache` 其实就是所说的 Mybatis 的一级缓存，因为它是存在于 `Executor` 内部的，而每个 `Executor` 都只会被一个 `SqlSession` 引用，因此我们说 Mybatis 的一级缓存是 `SqlSession` 独有的。

在 `BaseExecutor` 的查询方法中有一个比较有意思的点，就是在执行查询之前，先往 `localCache` 中放入了一个标志，代表正在执行中。然后，不管查询是否能够完成，都要通过 `finally` 移除掉标识，这样子才不会出现查询出现异常导致一级缓存中一直保存着执行标识。

```java
private <E> List<E> queryFromDatabase(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, CacheKey key, BoundSql boundSql) throws SQLException {
    List<E> list;
    // 往一级缓存中放入了一个正在执行的标志
    localCache.putObject(key, EXECUTION_PLACEHOLDER);
    try {
        list = doQuery(ms, parameter, rowBounds, resultHandler, boundSql);
    } finally {
        // 通过finally确保缓存的正确性
        localCache.removeObject(key);
    }
    localCache.putObject(key, list);
    if (ms.getStatementType() == StatementType.CALLABLE) {
        localOutputParameterCache.putObject(key, parameter);
    }
    return list;
}
```

> 关于这个执行标识的使用，大概是在 `org.apache.ibatis.executor.BaseExecutor.DeferredLoad#canLoad` 中会使用到，向上可以追踪到 `org.apache.ibatis.executor.resultset.DefaultResultSetHandler#getNestedQueryMappingValue`。看起来好像是查询出 `ResultSet` 要做结果映射的时候，如果存在缓存，那就会根据该标识判断是否可以取出对应的结果？这一块不太确定。

而关于 Mybatis 的二级缓存，其实就是 `MappedStatement` 中的 `cache` 对象，因为 `MappedStatement` 是全局唯一的，它对应着某个 Mapper 文件中的某个方法，因此其内部的 `cache` 也是唯一的，这也是为什么说二级缓存是全局唯一的，整个应用共享的。

> 二级缓存就是要在 Mapper 配置文件中指定 `<cache/>` 标签。关于二级缓存源码再看一下。