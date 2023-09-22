# Quarkus学习
## 云原生
> 指构建和运行应用以充分利用通过云技术交付模式交付的分布式计算。云原生应用旨在充分利用云技术平台特有的可扩展性、弹性和灵活性优势。
## GraalVM（格劳尔虚拟机）

是一种通用的虚拟机，它支持多种编程语言，包括Java、JavaScript、Python、Ruby、R、WebAssembly等。GraalVM的目标是提供高性能、低内存消耗的运行环境，以支持各种语言和应用的混合使用。
*多语言支持：* GraalVM 不仅支持Java，还支持众多其他编程语言。这意味着你可以在同一个运行时环境中运行不同语言的代码，并且它们可以互相调用。

*高性能：* GraalVM 的即时编译器（JIT）具有出色的性能，使得它成为一种在各种应用中提供高吞吐量和低延迟的虚拟机。

*原生图像构建：* GraalVM 支持将Java应用程序编译成本地机器码，从而减少了启动时间和内存占用。这对于云原生和微服务应用程序特别有用。

*JavaScript支持：* GraalVM 包括JavaScript引擎，使得你可以在Java应用中嵌入JavaScript代码，或者使用JavaScript编写服务器端应用。

*WebAssembly支持：* GraalVM 支持WebAssembly，这是一种用于在浏览器和服务器上运行低级代码的技术。这意味着你可以在GraalVM中运行WebAssembly模块。

*扩展性：* GraalVM 的架构支持轻松扩展，允许添加新的语言运行时或优化编译器。

*开源社区：* GraalVM 是一个开源项目，拥有活跃的社区支持，你可以在GitHub上找到它的源代码和相关资源。

*适用场景：* GraalVM 在云计算、服务器端应用、嵌入式系统和数据科学等领域都有广泛的应用。

>GraalVM 是一种强大的多语言虚拟机，可以在各种场景中提供高性能和灵活性。

## 指令式与响应式

#### 1.线程的问题

1. 在传统的指令式方法中，框架分配一个线程来处理请求。因此，请求的整个处理都运行在这个工作线程上。这个模型的扩展性不太好。事实上，要处理多个并发请求，你需要多个线程。因此，应用程序的并发性受到线程数量的限制。此外，只要您的代码与远程服务交互，这些线程就会被阻塞。因此，这会导致资源的低效使用，因为您可能需要更多的线程，而每个线程在映射到OS线程时，在内存和CPU方面都有成本。
2. 响应式模型依赖于非阻塞 I/O和不同的执行模型。非阻塞I/O提供了一种处理并发I/O的有效方法。最小数量的线程称为I/O线程，可以处理许多并发I/O。使用这样的模型，请求处理不会委托给工作线程，而是直接使用这些I/O线程。它节省了内存和CPU，因为不需要创建工作线程来处理请求。它还改善了并发性，因为它消除了对线程数量的限制。最后，它还改善了响应时间，因为它减少了线程开关的数量。

```java
Uni<PanacheEntityBase> findById = Fruit.findById(id);
Uni<Fruit> findById2 = Fruit.<Fruit>findById(id);
```
`Fruit` 继承 `PanacheEntityBase`
指定返回类型为Fruit

## Muity响应式包

### Multi流中的转换方法`transformToMultiAndMerg`e和`transformToMultiAndConcatenate`的区别

```Java
Multi<Long> multi = Multi.createFrom().items(1L, 2L, 3L, 4L);
Random random = new Random();
multi.onItem().transformToMultiAndMerge(item -> Multi.createFrom().items(item * item)
        .call(x -> {
            Duration delay = Duration.ofMillis(random.nextInt(100) + 1);
            return Uni.createFrom().nullItem().onItem().delayIt().by(delay);
        })
).subscribe().with(x -> System.out.print("merge" + x + ", "));
multi.onItem().transformToMultiAndConcatenate(item -> Multi.createFrom().item(item * item)
        .call(x -> {
            Duration duration = Duration.ofMillis(random.nextInt(100) + 1);
            return Uni.createFrom().nullItem().onItem().delayIt().by(duration);
        })
).subscribe().with(x -> System.out.print("concatenate" + x + ", "));

// 可能的一种结果
// merge16, merge4, merge9, concatenate1, merge1, concatenate4, concatenate9, concatenate16,
```

可以发现在不定延时转换流中merge没有保持原来的顺序，而concatenate经过转换后依旧保持原来的顺序。

## quarkus中使用panache reactive工具使用原生sql查询

1. 在实体类上使用注解`@NamedNativeQueries`

```java
@NamedNativeQueries({
        @NamedNativeQuery(name = "Cat.findByName", query = "select * from cat where name = :name ", resultClass = Cat.class)
})
```

2. 需要在repository中使用sessionFactory调用命名查询

```java
@Inject
    Mutiny.SessionFactory sessionFactory;
    /**
     * 命名查询，使用原生SQL
     *
     * @param name 姓名
     * @return Uni<List<Cat>> 单项流
     */
    public Uni<List<Cat>> findCat(String name) {
        return sessionFactory.withSession(session -> session.createNamedQuery("Cat.findByName", Cat.class)
                .setParameter("name", name).getResultList());
    }
```
3. 或者创建原生语句(此处使用文本块)

```java
/**
     * 编写原生SQL语句
     *
     * @param id id
     * @return Uni<List < Cat>>
     */
    public Uni<List<Cat>> findByName(Long id) {
        return sessionFactory.withSession(session -> session.createNativeQuery(
                        """
                                SELECT c.*
                                FROM Cat c
                                join person p
                                on c.person_id=p.id
                                WHERE c.id = :id""", Cat.class)
                .setParameter("id", id).getResultList()
        );
    }
```

## 获取请求信息的问题

- 使用`@Context`注入上下文对象

```java
    @Context
    HttpServerRequest request;// 注意导包是 io.vertx.core.http.HttpServerRequest;而不是multy下的

    @Context
    UriInfo uriInfo;

    LOGGER.info("RequestMethod: " + request.method());
            LOGGER.info("URL: " + uriInfo.getPath());
            LOGGER.info("IP: " + request.remoteAddress());

```

## 事务例子

- 事务已用`Panache.WithTransaciton()`开启,Uni的组合流会报错，不明原因。可转Multi后组合，但是不再是单项流了，另一种解决方法是使用`transformToUni()`进行转换，但会嵌套。

```java
public Multi<Boolean> update(Account source, Account target) {
        Multi<Boolean> multi = sessionFactory.withSession((session) -> session.find(Account.class, source.id))
                .map(Objects::nonNull).toMulti();
        Multi<Boolean> multi1 = sessionFactory.withSession((session) -> session.find(Account.class, target.id))
                .map(Objects::nonNull).toMulti();


        return Multi.createBy().combining().streams(multi1, multi).asTuple().map(tuple -> tuple.getItem1() && tuple.getItem2());

    }

public static Uni<Boolean> transactionMoney(Account source, Account target) {

       Uni<Boolean> sourceSelect = findById(source.id)
               .map(Objects::nonNull);
       Uni<Boolean> targetSelect = findById(target.id)
               .map(Objects::nonNull);
       return sourceSelect.onItem().transformToUni(x ->
               x ? targetSelect : Uni.createFrom().item(false)
       ).onItem().transformToUni(flag -> {
           if (flag) {
               return update("set money=money-50 where id=?1", source.id).onItem().transformToUni(n -> {
                   if (n > 0) {
                       return update("set money=money+50 where id=?1", target.id).map(result -> result > 0);
                   }
                   return Uni.createFrom().item(false);
               });
           }
           return Uni.createFrom().item(() -> false);
       });

   }
```
