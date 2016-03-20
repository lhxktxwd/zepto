//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.
//     具体api可以看jQuery的，官网上没有这个模块的api，而且参数只支持对象形式！
;(function($){
  // Create a collection of callbacks to be fired in a sequence, with configurable behaviour
  // Option flags:
  //   - once: Callbacks fired at most one time. // 是否只触发一次回调函数
  //   - memory: Remember the most recent context and arguments // 是否保存最后一次调用回调函数的上下文和参数
  //   - stopOnFalse: Cease iterating over callback list // 是否遇到回调函数返回false的时候停止执行接下来的回调函数
  //   - unique: Permit adding at most one instance of the same callback // 是否只允许添加不存在的回调函数
  $.Callbacks = function(options) {
    options = $.extend({}, options)

    var memory, // Last fire value (for non-forgettable lists) // 最后一个回调函数的返回值
        fired,  // Flag to know if list was already fired // 回调函数是否执行过
        firing, // Flag to know if list is currently firing // 是否正在执行回调函数
        firingStart, // First callback to fire (used internally by add and fireWith) // 第一个执行的回调函数
        firingLength, // End of the loop when firing // 需要执行的回调函数个数
        firingIndex, // Index of currently firing callback (modified by remove if needed) // 目前执行的回调函数的下标
        list = [], // Actual callback list // 回调函数列表 
        stack = !options.once && [], // Stack of fire calls for repeatable lists // 当once选项为true，该变量的值为false。否则保存这等待触发的参数
        fire = function(data) {
          memory = options.memory && data // 如果设置了memory选项，保存参数data，下次调用add方法的时候立刻触发回调函数
          fired = true
          firingIndex = firingStart || 0
          firingStart = 0
          firingLength = list.length

          firing = true
          // 执行每一个callback
          for ( ; list && firingIndex < firingLength ; ++firingIndex ) {
            // 如果执行回调函数返回false并且设置了stopOnFalse为true，停止执行之后的回调函数，并且memory也设置为false
            if (list[firingIndex].apply(data[0], data[1]) === false && options.stopOnFalse) {
              memory = false
              break
            }
          }
          firing = false

          if (list) {
            if (stack) stack.length && fire(stack.shift()) // 触发stack中待触发的参数
            else if (memory) list.length = 0 // once 和 memory 选项都为 true
            else Callbacks.disable()
          }
        },

        Callbacks = {
          add: function() {
            if (list) {
              var start = list.length, // 将要push到list数组的下标
                  add = function(args) {
                    $.each(args, function(_, arg){
                      // 参数为单个函数，选项unique不为true或者没有重复的函数，把该参数
                      if (typeof arg === "function") {
                        if (!options.unique || !Callbacks.has(arg)) list.push(arg)
                      }
                      // 参数为数组，回调自身来继续添加函数
                      else if (arg && arg.length && typeof arg !== 'string') add(arg)
                    })
                  }
              add(arguments)
              if (firing) firingLength = list.length
              // memory参数为true，立刻使用最后一次传入的数据调用该回调函数
              else if (memory) {
                firingStart = start
                fire(memory)
              }
            }
            return this
          },

          remove: function() {
            if (list) {
              $.each(arguments, function(_, arg){
                var index
                // 删除每一个参数里面的对应的回调函数
                while ((index = $.inArray(arg, list, index)) > -1) {
                  list.splice(index, 1)
                  // Handle firing indexes
                  // 处理回调函数集合触发的过程中，删除回调函数的情况
                  if (firing) {
                    if (index <= firingLength) --firingLength
                    if (index <= firingIndex) --firingIndex
                  }
                }
              })
            }
            return this
          },

          /**
           * 查询是否有匹配回调函数
           * @param  {Function} fn 选传
           * @return {Boolean}     有传入fn参数的情况下，返回true代表有匹配参数。否则返回true代表集合中有回调函数
           */
          has: function(fn) {
            return !!(list && (fn ? $.inArray(fn, list) > -1 : list.length))
          },
          empty: function() {
            firingLength = list.length = 0
            return this
          },
          // 把list设置为undefined就不能触发fire、add和remove功能，因为执行这些功能的时候会对list变量作判断
          // 把stack设置为undefined就等于清空了待触发的参数
          // 把memory设置为undefined就等同于清除了选项memory
          disable: function() {
            list = stack = memory = undefined
            return this
          },
          disabled: function() {
            return !list
          },
          lock: function() {
            stack = undefined;
            if (!memory) Callbacks.disable()
            return this
          },
          locked: function() {
            return !stack
          },
          fireWith: function(context, args) {
            // 已经触发过并且选项once为true，直接返回(选项once为true时stack变量的值为false)
            if (list && (!fired || stack)) {
              args = args || []
              args = [context, args.slice ? args.slice() : args]
              if (firing) stack.push(args) // 
              else fire(args)
            }
            return this
          },
          fire: function() {
            return Callbacks.fireWith(this, arguments)
          },
          fired: function() {
            return !!fired
          }
        }

    return Callbacks
  }
})(Zepto)
