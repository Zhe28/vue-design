import { computed, createProxy, effect, objProxy, watch } from "./index.js";

/**
 * todo: effect嵌套测试
 */
// effect(function () {
// objProxy.ok ? objProxy.text : "not set";
// });
// setTimeout(function () {
// objProxy.ok = false;
// }, 3000);

// effect(function() {
// 	console.log("this is effecfFn1.");
// 	effect(function() {
// 		console.log("this is effectFn2.");
// 		let tmp2 = objProxy.ok;
// 	});
// 	let tmp = objProxy.ok;
// });

/**
 * todo: effect 的 调度测试
 */
// objProxy.ok = false;
// console.time();
// effect(
//   () => {
//     console.log(`the function has been run. the value is ${objProxy.ok}`);
//   },
//   {
//     scheduler(effectFn) {
//       setTimeout(effectFn, 3000);
//     },
//   },
// );

// objProxy.ok = false;
// console.timeEnd();

/**
 * todo: effect 懒执行 测试
 */
// const effectFn = effect(
//   function () {
//     console.log(`lazy test.`);
//   },
//   { lazy: true },
// );

// console.log(effectFn);

// // computed 实现
// const obj = computed(() => objProxy.ok);
// console.log(obj.value);
// console.log(obj.value);

/**
 * todo: 特殊的 effect 嵌套
 */
// effect(() => {
//   console.log(obj.value);
// });

// objProxy.ok = false;

// const obj = createProxy({
//   foo: "foo",
//   bar: "bar",
// });
//
// watch(
//   () => obj.foo,
//   (newValue, oldValue) => {
//     console.log("the value has changed.", `and the newValue : ${newValue}, oldValue : ${oldValue}`);
//   },
// );
//
// // watch的立即调用
// watch(
//   () => obj.foo,
//   (newValue, oldValue) => {
//     console.log("immediate start. and the value on there -->", newValue, oldValue);
//   },
//   {
//     immediate: true,
//   },
// );
//
// // obj.bar = "bar has changed."
// obj.foo = "foo has changed.";

/**
 * todo: 过期的副作用函数
 */
// 条件不好实现，暂时不做。

/**
 * todo: 代理 object. 主要的几个 js关键字 "in" "for .. in" "delete"
 * 具体的一些东西在 ecma 官方文档中，我这里是跟书中的标准一样的， "ecma262” 网址 https://262.ecma-international.org/14.0/
 */
// 'foo' in obj 测试
const obj = createProxy({ foo: "foo" });
effect(() => {
  console.log(`foo in obj ? ${"foo" in obj}`);
});
obj.foo = "foo2";

// for ... in 测试。 通过 debugger 可以看到已经可以触发收集依赖了
effect(() => {
  for (const propertyKey in obj) {
    console.log(`iterate the obj , and the propertyKey is ${obj[propertyKey]}`);
  }
});

// 增加响应式对象属性后触发依赖
obj.bar = "bar";

//  更新数据时触发依赖
obj.bar = "bar2";

// delete 关键字
delete obj.bar;
