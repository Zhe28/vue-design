let activeEffect;
const effectStack = [];
let bucket = new WeakMap();

/**
 * 依赖触发
 * @param target 被代理的目标对象
 * @param key 对象属性
 * @param type 触发响应的类型: 增加、删除、修改
 */
function trigger(target, key, type) {
  let depsMap = bucket.get(target);
  if (!depsMap) {
    return;
  }

  const effects = depsMap.get(key);
  const iterateEffects = depsMap.get(ITERATE_KEY);

  // if (!effects) {
  //   return;
  // }

  const effectsToRun = new Set();
  effects &&
    effects.forEach((effect) => {
      effectsToRun.add(effect);
    });

  // 因为增加和删除都会影响对象的长度和 for 循环的次数，要重新执行一遍副作用函数
  if (type === triggerType.add || type === triggerType.delete) {
    iterateEffects &&
      iterateEffects.forEach((effect) => {
        effectsToRun.add(effect);
      });
  }

  effectsToRun.forEach((effect) => {
    // avoid maximum call stack size exceeded
    if (activeEffect !== effect) {
      if (effect.options.scheduler) {
        return effect.options.scheduler(effect);
      } else {
        effect();
      }
    }
  });
}

/**
 * 建立响应式对象和副作用函数的联系
 * @param target 被代理的目标对象
 * @param key 对象属性
 */
function track(target, key) {
  if (!activeEffect) {
    return;
  }
  let depsMap = bucket.get(target);
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()));
  }
  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }
  deps.add(activeEffect);
  activeEffect.deps.push(deps);
}

const ITERATE_KEY = Symbol();
const triggerType = { set: "SET", add: "ADD", delete: "DELETE" };

// 创建响应式代理对象
function createReactive(obj, isShallow = false, isReadonly = false) {
  return new Proxy(obj, {
    set(target, p, newValue, receiver) {
      // 只读属性无法更改数值
      if (isReadonly) {
        console.warn(`属性 ${p} 只读，无法更改`);
        return true;
      }

      // 检测数值是否变动
      const oldValue = target[p];
      // 检测属性是否存在
      const type = Object.prototype.hasOwnProperty.call(target, p) ? triggerType.set : triggerType.add;
      const result = Reflect.set(target, p, newValue, receiver);

      // 检测是否是原始值
      if (target === receiver["raw"]) {
        /**  (newValue === newValue || oldValue === oldValue)
         * 众所周知 NaN === NaN 结果是 false. （就我不知 -_-. 好像 isNaN() 函数也是可以的？)这里巧妙地利用了这点。
         * 当新旧的数值不同时， 不触发函数的 trigger. 因为没有必要。
         */
        if (newValue !== oldValue && (newValue === newValue || oldValue === oldValue)) {
          trigger(target, p, type);
        }
      }

      return result;
    },
    get(target, p, receiver) {
      // 读取 raw 属性， 返回 target 对象。
      if ("raw" === p) {
        return target;
      }

      // 只读属性不触发收集依赖
      if (!isReadonly) {
        track(target, p);
      }

      const res = Reflect.get(target, p, receiver);

      // 深浅响应式对象的结果不同处理方式
      if (isShallow) {
        return res;
      }
      if (typeof res === "object" && obj !== null) {
        return isReadonly ? readonly(res) : reactive(res);
      }

      return res;
    },
    // 拦截带 in 的响应式变量
    has(target, p) {
      track(target, p);
      return Reflect.has(target, p);
    },
    // 拦截 for ... in 的响应式变量
    ownKeys(target) {
      track(target, ITERATE_KEY);
      return Reflect.ownKeys(target);
    },
    // 拦截 delete 操作符
    deleteProperty(target, p) {
      // 只读属性无法更改数值
      if (isReadonly) {
        console.warn(`属性 ${p} 只读，无法更改`);
        return true;
      }

      const hadKey = Object.prototype.hasOwnProperty.call(target, p);
      const res = Reflect.deleteProperty(target, p);
      if (res && hadKey) {
        trigger(target, p, triggerType.delete);
      }

      return res;
    },
  });
}

// 深响应式代理对象
export function reactive(obj) {
  return createReactive(obj, false, false);
}

// 浅响应式代理对象
export function shallowReactive(obj) {
  return createReactive(obj, true, false);
}

// 浅只读响应式代理对象
export function shallowReadonly(obj) {
  return createReactive(obj, true, true);
}

// 深只读代理响应式对象
export function readonly(obj) {
  return createReactive(obj, false, true);
}

function cleanup(effectFn) {
  effectFn.deps.forEach((effects) => {
    effects.delete(effectFn);
  });
  effectFn.deps.length = 0;
}

/**
 * effect 包装副作用函数，然后执行收集响应式对象，与副作用函数建立链接。属性变动时触发副作用函数重新执行
 * @param fn 副作用函数
 * @param options 额外的参数
 * @returns {function(): *} 返回包装后的副作用函数
 */
export function effect(fn, options = { lazy: false }) {
  const effectFn = () => {
    cleanup(effectFn);
    activeEffect = effectFn;
    effectStack.push(activeEffect);
    const res = fn();
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
    return res;
  };
  effectFn.options = options;
  effectFn.deps = [];
  6;

  if (!options.lazy) {
    effectFn();
  }

  return effectFn;
}

/**
 * computed 缓存计算结果，避免多次执行同样的函数，浪费性能
 * @param getter getter
 * @returns {*|{readonly value: *}}
 */
export function computed(getter) {
  let value;
  let dirty = true;
  const effectFn = effect(getter, {
    lazy: true,
    scheduler() {
      // 副作用函数重新执行后dirty值变脏
      dirty = true;
      trigger(obj, value);
    },
  });

  const obj = {
    get value() {
      if (dirty) {
        // 重新获取值，dirty取消脏值
        dirty = false;
        value = effectFn();
      }
      track(obj, value);
      return value;
    },
  };

  return obj;
}

/**
 * watch 监听响应式对象属性数值是否变动，变动则执行相对应的函数
 * @param source 响应式对象属性或者getter
 * @param cb 执行的回调函数
 * @param options 额外的参数
 */
export function watch(source, cb, options = {}) {
  let getter;
  if (typeof source === "function") {
    getter = source;
  } else {
    getter = () => traverse(source);
  }
  let newValue, oldValue;
  let cleanup;

  const effectFn = effect(getter, {
    lazy: true,
    scheduler: () => {
      // 判断调度函数中判断 flush 是否为 'post' ， 如果是，放到为任务队列中运行。
      if (options.flush === "post") {
        Promise.resolve().then(job);
      } else {
        job();
      }
    },
  });

  if (options.immediate) {
    job();
  } else {
    oldValue = effectFn();
  }

  // 遍历属性节点， 建立联接
  function traverse(source, seen = new Set()) {
    // 判断是否是基础类型
    if (typeof source !== "object" || source === null || source === undefined || seen.has(source)) {
      return;
    }

    seen.add(source);
    for (const key in source) {
      traverse(source[key], seen);
    }
    return source;
  }

  function job() {
    newValue = effectFn();

    if (cleanup) {
      cleanup();
    }
    cb(newValue, oldValue, onInvalidate);
    oldValue = newValue;
  }

  // 过期的副作用函数
  function onInvalidate(fn) {
    cleanup = fn;
  }
}
