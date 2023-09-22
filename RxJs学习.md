## RsJs学习

*RxJS的核心概念包括*:

`Observable` - 可观察对象,表示一个基于推送的异步数据流。
`Observer` - 观察者,是一个回调函数的集合,每个回调函数对应一个 `Observable` 发出的值。
`Subscription` - 订阅,表示 `Observable` 和 `Observer`之间的执行。
`Operators` - 操作符,允许复杂的异步代码以声明式的方式进行组合。
`Subject` - 主体,相当于 `EventEmitter`,用于把数据或事件多路推送给多个 `Observer。`
`Schedulers` - 调度器,控制并发并管理异步任务。

```javaScript
import {
  Observable,
  Subject,
  asyncScheduler,
  catchError,
  concatAll,
  from,
  fromEvent,
  interval,
  map,
  merge,
  observeOn,
  of,
  scan,
  switchMap,
  throttleTime,
} from "rxjs";
import { ajax } from "rxjs/ajax";

const btu = document.getElementsByTagName("button");
console.log("你好这里是RxJs", btu);

fromEvent(btu[0], "click")
  .pipe(scan((count) => count + 1, 0)) //类似于数组的reduce方法
  .subscribe((count) => console.log(`点击${count}times`));

// 允许每秒最多点击一次的方式
fromEvent(btu[1], "click")
  .pipe(
    throttleTime(1000),
    scan((count) => count + 1, 0)
  )
  .subscribe((count) => console.log(`${count}time`));
// 转换
fromEvent(btu[2], "click")
  .pipe(
    throttleTime(1000),
    map((event) => (event as MouseEvent).clientX),
    scan((count, clinetX) => count + clinetX, 0)
  )
  .subscribe((count) => console.log(count));

// 1.创建可观察对象
const observable = new Observable((subscriber) => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);

  setTimeout(() => {
    subscriber.next(4);
    subscriber.complete();
  }, 1000);
});

// 2.订阅
observable.subscribe({
  next(x) {
    console.log(`第一个订阅得到值:${x}`);
  },
  error(err) {
    console.error(`发生错误:${err}`);
  },
  complete() {
    console.log("完成！");
  },
});
observable.subscribe((x) => console.log(`第二个订阅得到值:${x}`));

// 可观察对象可以“返回”多个值，这个值还可以是延是“返回”，函数不可以

// 创建可观察对象,
// 使用函数创建
const observable2 = new Observable((subscriber) => {
  const intervalId = setInterval(() => {
    subscriber.next("你好");
  }, 1000);
  setInterval(() => {
    subscriber.next("peng!");
  }, 1000);
  return function unsubscribe() {
    console.log("我被取消订阅了");
    clearInterval(intervalId);
  };
}).subscribe((x) => console.log(x));

// 取消订阅
setTimeout(() => {
  // 会取消所有
  observable2.unsubscribe();
  console.log("取消订阅");
}, 3000);

of(1, 2, 3)
  .pipe(map((x) => x * x))
  .subscribe((x) => console.log(x));
// 从0开始迭代，间隔为1000ms
// interval(1000/*ms*/).subscribe(x=>console.log(x))

// 主题
// 主题类似于可观察对象，但可以多播到许多观察者。主题就像事件发射器：它们维护着许多侦听器的注册表。
const subject = new Subject<number>();

subject.subscribe((x) => console.log(`我是观察者A:${x}`));
subject.subscribe((x) => console.log(`我是观察者B:${x}`));

subject.next(1);
subject.next(2);

from([1, 2, 3]).subscribe(subject);

const observable3 = new Observable((subscriber) => {
  subscriber.next(10);
  subscriber.next(20);
  subscriber.next(30);
  subscriber.complete();
}).pipe(observeOn(asyncScheduler)); // 异步执行

console.log("asyncScheduler begin");
observable3.subscribe((x) => console.log(x));
console.log("asyncScheduler end");

const url = "https://api.github.com/users";
// axios
//   .get(url)
//   .then((res) => console.log(res))
//   .catch((error) => console.error(error));

const initStream = new Observable((subscriber) => {
  subscriber.next(url);
  subscriber.complete();
});
// initStream.subscribe((x) => console.log(x));

const refreshClickStream = fromEvent(btu[3], "click").pipe(
  map(() => {
    const randomOffset = Math.floor(Math.random() * 500);
    return `${url}?since=${randomOffset}`;
  })
);

const requestStream = merge(initStream, refreshClickStream);

const responseStream = requestStream.pipe(
  map((url) => {
    console.log("请求事件流", url);

    return ajax(url as string).pipe(
      map((res) => res.response),
      catchError((error) => {
        console.log("请求错误", error);
        return of(error);
      })
    );
  }),
  // 高级可观察对象扁平化，对高级流降级
  concatAll()
);

responseStream.subscribe((x) => {
  console.log("响应流");
  console.log(x);
});


const clicks = fromEvent(document, 'click');
const result = clicks.pipe(switchMap(() => interval(1000)));
result.subscribe(x => console.log("switchMap",x));
```
