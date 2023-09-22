```java
//它代表一个接收参数但不返回结果的操作。
@FunctionalInterface
public interface Consumer<T> {

  void accept(T t);

}
```
常见的使用场景包括:
1. 遍历集合中的每个元素并对其执行操作
2. 将方法引用作为`Consumer`传入,如`File::delete`
3. 日志记录中的一些场景
4. 接收并处理消息队列中的每个消息
所以`Consumer`代表执行一个对参数的操作,通常用在forEach遍历或消息处理的场景中。与`Supplier`形成对比,`Supplier`生产数据,`Consumer`消费数据。

```java
// 代表一个没有参数只返回T类型结果的函数。
@FunctionalInterface
public interface Supplier<T> {

    T get();

}
```
常用在:

1. 需要一个提供数据的方法时
2. 用作延迟初始化
3. 在一些需要回调的场景下获取数据
4. 与Stream组合生成数据
```java
//这里T表示输入参数类型,R表示返回值类型。
@FunctionalInterface
public interface Function<T, R> {

  R apply(T t);

}
```
Function可用来表示:

1. 类型转换
2. 提取或转换对象的字段
3. 计算
4. 格式化等操作
