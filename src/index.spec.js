import { computed, effect, reactive, readonly, shallowReactive, shallowReadonly, watch } from "./index.js";

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

// const obj = reactive({
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
// // 'foo' in obj 测试
// const obj = reactive({ foo: "foo" });
// effect(() => {
//   console.log(`foo in obj ? ${"foo" in obj}`);
// });
// obj.foo = "foo2";
//
// // for ... in 测试。 通过 debugger 可以看到已经可以触发收集依赖了
// effect(() => {
//   for (const propertyKey in obj) {
//     console.log(`iterate the obj , and the propertyKey is ${obj[propertyKey]}`);
//   }
// });
//
// // 增加响应式对象属性后触发依赖
// obj.bar = "bar";
//
// //  更新数据时触发依赖
// obj.bar = "bar2";
//
// // delete 关键字
// delete obj.bar;

/**
 * todo: 合理的触发响应
 * 1. 相同的值时会触发副作用函数，因为没必要，数值不动，副作用的执行结果都是相同的。
 * 2. 当对象继承时，读取原型的属性，会导致副作用函数连续触发两次。
 */

// const child = {};
// const parent = { foo: "foo", bar: "bar" };
//
// const childProxy = reactive(child);
// const parentProxy = reactive(parent);
// //
// // 相同的值
// effect(() => {
//   // 与副作用函数建立联系
//   console.log(`the reactive value is : ${parentProxy.foo}`);
// });
//
// parentProxy.foo = "foo";
//
// // 关于继承问题
// Object.setPrototypeOf(childProxy, parentProxy);
// effect(() => {
//   console.log(`parent property: bar -->${childProxy.bar}`);
// });
// /**
//  * 这是结果：
//  * the reactive value is : foo
//  * parent property: foo -->foo
//  * the reactive value is : foo
//  * 会发现多执行了一遍函数
//  * parent property: foo -->foo-changed
//  * parent property: foo -->foo-changed
//  */
// childProxy.bar = "bar-changed";

/**
 * todo: 深响应和浅响应
 * 由于之前的响应式默认是浅相应的。全部深相应需要将得到的结果在 getHandler 处理一遍。
 */
// // 深相应实例
// const deepReactive = reactive({ foo: { bar: "bar" } });
// effect(() => {
//   console.log(`the deepsReactive value { foo: { bar: "bar" } }, get the bar key value --> ${deepReactive.foo.bar}`);
// });
// deepReactive.foo.bar = "bar2";
// // 浅相应实例
// const _shallowReactive = shallowReactive({ foo: { bar: "bar" } });
// effect(() => {
//   console.log(
//     `the _shallowReactive value { foo: { bar: "bar" } }, get the bar key value --> ${_shallowReactive.foo.bar}`,
//   );
// });
// _shallowReactive.foo.bar = "bar2";

/**
 * todo: 深只读和浅只读
 * 只读的深浅响应式对象，很容易理解，修改结果时不给修改就是了。因为是只读，所以没有触发和收集副作用函数。
 * 但是问题来了，既然是只读并且不触发副作用函数，有什么必要？直接在创建对象时弄成 readonly 就行了？
 *
 * 在 getHandler 和 setHandler 中处理， getHandler 中不予触发 track, setHandler 中不予触发 trigger。不过书中的返回的时 true,
 * 直接返回 false 貌似也可以的。
 * 在 deletePropertyHandler 中也需要处理，毕竟是删除属性，不能删。
 * PS: 不知道例子是否是正确的， 跟书中的有些许的不同。书上只读取到了 _*.foo. 我写到了 bar 层。但是我看效果貌似是相同的。
 */

// const _shallowReadonly = shallowReadonly({ foo: { bar: "bar" } });
// const _readonly = readonly({ foo: { bar: "bar" } });
// effect(() => {
//   console.log(`shallowReadonly --> ${_shallowReadonly.foo.bar}`);
//   console.log(`readonly --> ${_readonly.foo.bar}`);
// });
// _shallowReadonly.foo = { bar: "bar2" };
// _readonly.foo.bar = "bar2";

/**
 * todo: 代理数组
 * 数组索引与 length :
 */

// 数组索引与 length
const arr = reactive(["foo"]);
effect(() => {
  console.log(arr.length);
});

arr[2] = "bar";
arr.length = 0;
