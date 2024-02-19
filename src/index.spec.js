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
