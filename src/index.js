/**
 * 副作用函数类型
 * @typedef {Object} options
 * @property {boolean} [lazy]
 * @property {Function} [scheduler]
 * @property {"post"} [flush]
 * @property {boolean} [immediate]
 */

/**
 * 收集到的副作用函数集合
 * @typedef {Set<effectFn>} effectFns
 */

/**
 * @typedef {object|Array|Function} target -target 类型
 */

/**
 * 副作用函数类型
 * @typedef {Function | Object} effectFn
 * @property {effectFn[]} deps -收集的副作用函数集合
 * @property {options} options -额外的选项
 */

/**
 * 数据存储桶结构
 * @typedef {WeakMap<any, Map<any, effectFns>>} bucket
 */

//
/**
 * 激活的副作用函数
 *  @type {effectFn}
 */
let activeEffect;

/**
 * effect 栈
 * @type {effectFn[]}
 */
const effectStack = [];
/**
 * 储存的 bucket 桶 ， 桶根据 target --> key --> functions三层结构
 *  @type {bucket}
 */
let bucket = new WeakMap();
/**
 * iterate_Key：for ... in 遍历时，依靠这个数值建立连接
 * @type {symbol}
 */
const ITERATE_KEY = Symbol();

/**
 * trigger 触发的类型
 * @readonly
 * @enum {string}
 */
const triggerType = {
  SET: "SET",
  ADD: "ADD",
  DELETE: "DELETE",
};

/**
 * 响应式对象变动，依赖触发
 * @function
 * @param {target} target  被代理的目标对象
 * @param {string|number} key  对象属性
 * @param {triggerType} type  触发响应的类型: 增加、删除、修改
 * @param {any} newValue 新设置的数值
 */
function trigger(target, key, type, newValue) {
  let depsMap = bucket.get(target);
  if (!depsMap) {
    return;
  }

  const effects = depsMap.get(key);
  const iterateEffects = depsMap.get(ITERATE_KEY);

  /**
   * 整理收集到的 effectFn 函数，防止遍历执行时内存溢出
   * @type {Set<effectFn>}
   */
  const effectsToRun = new Set();
  effects &&
    effects.forEach((effectFn) => {
      effectsToRun.add(effectFn);
    });

  // for ... in 循环时， 因为增加和删除都会影响对象的长度和 for 循环的次数，要重新执行一遍副作用函数
  if (type === triggerType.ADD || type === triggerType.DELETE) {
    iterateEffects &&
      iterateEffects.forEach((effectFn) => {
        effectsToRun.add(effectFn);
      });
  }
  // 当类型是 triggerType.add 时， 并且是数组时，将函数加入到effectsToRun中运行
  if (type === triggerType.ADD && Array.isArray(target)) {
    const lengthEffects = depsMap.get("length");
    lengthEffects &&
      lengthEffects.forEach((effectFn) => {
        if (effectFn !== activeEffect) {
          effectsToRun.add(effectFn);
        }
      });
  }

  // 通过索引删除元素时， 需要重新遍历数组
  if (Array.isArray(target) && key === "length") {
    depsMap.forEach((effectFns, key) => {
      // 对于 index 大于等于 length 的元素，需要把所有的关联的副作用函数重新执行一遍
      if (key >= newValue) {
        effectFns.forEach((effectFn) => {
          if (effectFn !== activeEffect) {
            effectsToRun.add(effectFn);
          }
        });
      }
    });
  }

  // 执行副作用函数
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
 * @param {target} target 被代理的目标对象
 * @param {any} key 对象属性
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

/**
 * 创建响应式代理对象
 * @param {target} obj 需要代理的对象
 * @param {boolean} isShallow 建立浅响应代理对象
 * @param {boolean} isReadonly 对象是否是只读
 * @return {any}
 */
function createReactive(obj, isShallow = false, isReadonly = false) {
  return new Proxy(obj, {
    deleteProperty(target, p) {
      // 只读属性无法更改数值
      if (isReadonly) {
        console.warn(`属性 ${String(p)} 只读，无法更改`);
        return true;
      }

      const hadKey = Object.prototype.hasOwnProperty.call(target, p);
      const res = Reflect.deleteProperty(target, p);
      if (res && hadKey) {
        trigger(target, p, triggerType.DELETE);
      }

      return res;
    },
    get(target, p, receiver) {
      // 读取 raw 属性， 返回 target 对象。
      if ("raw" === p) {
        return target;
      }

      // 只读属性不触发收集依赖
      // 或者 property 属性类型不是 symbol 值时，不触发依赖 ( for ... of 遍历时 property属性是 symbol [@@Symbol.iterator])
      if (!isReadonly && typeof p !== "symbol") {
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
      // for ... in 遍历时。检测对象是否是数组，如果是数组,使用 length 属性建立连接
      // 否则 ITERATE_KEY 属性建立连接
      track(target, Array.isArray(target) ? "length" : "ITERATE_KEY");
      return Reflect.ownKeys(target);
    },
    // 拦截 delete 操作符
    set(target, p, newValue, receiver) {
      // 只读属性无法更改数值
      if (isReadonly) {
        console.warn(`属性 ${String(p)} 只读，无法更改`);
        return true;
      }

      // 检测数值是否变动
      const oldValue = target[p];
      // 检测属性是否存在
      const type = Array.isArray(target)
        ? // 处理数组，检查 triggerType 类型
          Number(p) < target.length
          ? triggerType.SET
          : triggerType.ADD
        : // 处理对象，检查 triggerType 类型
          Object.prototype.hasOwnProperty.call(target, p)
          ? triggerType.SET
          : triggerType.ADD;
      const result = Reflect.set(target, p, newValue, receiver);

      // 检测是否是原始值
      if (target === receiver["raw"]) {
        /* (newValue === newValue || oldValue === oldValue)
         * 众所周知 NaN === NaN 结果是 false. （就我不知 -_-. 好像 isNaN() 函数也是可以的？)这里巧妙地利用了这点。
         * 当新旧的数值不同时， 不触发函数的 trigger. 因为没有必要。
         */
        if (newValue !== oldValue && (newValue === newValue || oldValue === oldValue)) {
          trigger(target, p, type, newValue);
        }
      }

      return result;
    },
  });
}

// 创建深响应式代理对象
export function reactive(obj) {
  return createReactive(obj, false, false);
}

// 创建浅响应式代理对象
export function shallowReactive(obj) {
  return createReactive(obj, true, false);
}

// 创建浅只读响应式代理对象
export function shallowReadonly(obj) {
  return createReactive(obj, true, true);
}

// 创建深只读代理响应式对象
export function readonly(obj) {
  return createReactive(obj, false, true);
}

// 清理副作用函数
function cleanup(effectFn) {
  effectFn.deps.forEach((effects) => {
    effects.delete(effectFn);
  });
  effectFn.deps.length = 0;
}

/**
 * effect 包装副作用函数，然后执行收集响应式对象，与副作用函数建立链接。属性变动时触发副作用函数重新执行
 * @param {Function}  fn 副作用函数
 * @param {options} options 额外的参数
 * @returns {effectFn | any} 返回包装后的副作用函数
 */
export function effect(fn, options = {}) {
  /**
   * 副作用函数包装
   * @type {effectFn}
   * @return {*}
   */
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

  if (!options.lazy) {
    effectFn();
  }

  return effectFn;
}

/**
 * computed 缓存计算结果，避免多次执行同样的函数，浪费性能
 * @param getter { Function }
 * @returns {{value:Function}}
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
 * @param source {any} 数据源：响应式对象属性或者getter
 * @param cb {Function} 执行的回调函数
 * @param options {options} 额外的参数
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

  /**
   * 过期的副作用函数
   * @param {Function} fn
   * @return {void}
   */
  function onInvalidate(fn) {
    cleanup = fn;
  }
}
