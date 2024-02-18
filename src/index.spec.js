import { computed, effect, objProxy } from "./index.js";

// effect嵌套测试
//
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

// effect 的 调度测试
//
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

// effect 懒执行 测试
//
const effectFn = effect(
  function () {
    console.log(`lazy test.`);
  },
  { lazy: true },
);

console.log(effectFn);

// computed 实现
const obj = computed(() => objProxy.ok);
console.log(obj.value);
console.log(obj.value);

// 特殊的 effect 嵌套
effect(() => {
  console.log(obj.value);
});

objProxy.ok = false;
