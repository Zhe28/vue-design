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

// objProxy.ok = false;
console.time();
effect(
  () => {
    console.log(`the function has been run. the value is ${objProxy.ok}`);
  },
  {
    scheduler(effectFn) {
      setTimeout(effectFn, 3000);
    },
  },
);

objProxy.ok = false;
console.timeEnd();
