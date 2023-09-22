### `emitOn`和`runSubscriptionOn`有什么区别？

1. 都是将命令式转换为响应式
2. `emitOn`获取上游事件（item、completion、failure）并使用指定的executor将流重传到下游，它会影响后续操作符执行的位置（直到使用另一个emitOn操作）
3. `runSubscriptionOn`应用于订阅过程。它请求上游在指定的执行器线程上运行他的subscription(即在自己上游调用`subscribe方法`)


#### The Mutiny equivalents are:

`map -> onItem().transform()`
`flatMap -> onItem().transformToUniAndMerge` and
`onItem().transformToMultiAndMerge`
`concatMap -> onItem().transformToUniAndConcatenate` and `onItem().transformToMultiAndConcatenate`

### 链式操作快捷方式

| 快捷方式 | 等价于 |
| ---- | ---- |
| `uni.map(x -> y)` | `uni.onItem().transform(x -> y)` |
| `uni.flatMap(x -> uni2)	` | `uni.onItem().transformToUni(x -> uni2)` |
| `uni.chain(x -> uni2)	` | `uni.onItem().transformToUni(x -> uni2)` |
| `uni.invoke(x -> System.out.println(x))` | `uni.onItem().invoke(x -> System.out.println(x))` |
| `uni.call(x -> uni2)` | `uni.onItem().call(x -> uni2)` |
| `uni.eventually(() -> System.out.println("eventually"))`| `uni.onItemOrFailure().invoke((ignoredItem, ignoredException) -> System.out.println("eventually"))` |
| `uni.eventually(() -> uni2)	` | `uni.onItemOrFailure().call((ignoredItem, ignoredException) -> uni2)` |
| `uni.replaceWith(x)` | `uni.onItem().transform(ignored -> x)`|
| `uni.replaceWith(uni2)` | `uni.onItem().transformToUni(ignored -> uni2)` |
| `uni.replaceIfNullWith(x)` | `uni.onItem().ifNull().continueWith(x)`|


### *组合流*和*合并、连接流*有什么区别

*组合流*：具有同步等待性，它会等待其它流的item的完成，将来自多个流的item组合为一个元组，只要其中一个流失败，则组合流向下游传播故障并停止发射流。当其中一个流发送completion事件，则组合流完成

*合并、连接流*：合并流是无序的，失败也会传播到合并流，在这之后不糊发出任何项（item）。只有当所有观察到的流都完成时，合并流才会发出完成事件。
想要保持流的顺序使用*连接流*：他是等待一个流的完成然后再订阅第二个流，会确保第一个流已经发送完所有项，依次类推
