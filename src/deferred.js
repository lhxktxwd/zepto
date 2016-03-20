//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.
//
//     Some code (c) 2005, 2013 jQuery Foundation, Inc. and other contributors

;(function($){
  var slice = Array.prototype.slice

  function Deferred(func) {
    var tuples = [
          // action, add listener, listener list, final state
          [ "resolve", "done", $.Callbacks({once:1, memory:1}), "resolved" ],
          [ "reject", "fail", $.Callbacks({once:1, memory:1}), "rejected" ],
          [ "notify", "progress", $.Callbacks({memory:1}) ]
        ],
        state = "pending", // Deferred 对象刚开始的状态
        promise = {
          state: function() {
            return state
          },
          always: function() {
            deferred.done(arguments).fail(arguments)
            return this
          },
          then: function(/* fnDone [, fnFailed [, fnProgress]] */) {
            var fns = arguments
            return Deferred(function(defer){
              // 遍历tuples数组
              $.each(tuples, function(i, tuple){
                var fn = $.isFunction(fns[i]) && fns[i] // 获取参数函数
                deferred[tuple[1]](function(){ // 
                  var returned = fn && fn.apply(this, arguments)
                  if (returned && $.isFunction(returned.promise)) {
                    returned.promise()
                      .done(defer.resolve)
                      .fail(defer.reject)
                      .progress(defer.notify)
                  } else {
                    var context = this === promise ? defer.promise() : this,
                        values = fn ? [returned] : arguments
                    defer[tuple[0] + "With"](context, values)
                  }
                })
              })
              fns = null
            }).promise()
          },

          promise: function(obj) {
            return obj != null ? $.extend( obj, promise ) : promise
          }
        },
        deferred = {} // 将要返回的dtd对象

    $.each(tuples, function(i, tuple){
      var list = tuple[2], // $.Callbacks对象
          stateString = tuple[3] // 'resolved' 或者 'rejected'

      promise[tuple[1]] = list.add // promise的done方法指向是$.Callbacks对象的add方法

      // 添加 成功或者失败 时的回调函数
      if (stateString) {
        list.add(function(){
          state = stateString
        }, tuples[i^1][2].disable, tuples[2][2].lock)
      }

      // 添加resolve、reject 和 notify 方法
      deferred[tuple[0]] = function(){
        deferred[tuple[0] + "With"](this === deferred ? promise : this, arguments)
        return this
      }

      // 添加resolveWith、rejectWith 和 notifyWith 方法
      deferred[tuple[0] + "With"] = list.fireWith
    })

    // 使用promise对象扩展deferred对象
    promise.promise(deferred)
    if (func) func.call(deferred, deferred)
    return deferred
  }

  // 其实就是构建新的deferred
  $.when = function(sub) {
    var resolveValues = slice.call(arguments), // 传入的dtd对象数组
        len = resolveValues.length, // 参数个数
        i = 0,
        remain = len !== 1 || (sub && $.isFunction(sub.promise)) ? len : 0, // 
        deferred = remain === 1 ? sub : Deferred(), // 如果传入了多个参数，就新建一个Deferred对象作为主要的Deferred对象
        progressValues, progressContexts, resolveContexts,

        // 当有多个参数时，利用该函数来生成每一个promise参数的成功和进行中的函数
        // 也就是放到每一个$.Callbacks集合中的函数
        updateFn = function(i, ctx, val){ // i为每一个参数的下标
          return function(value){
            ctx[i] = this //把当前的promise对象放到resolveresolveContexts 或者 progressContexts数组中
            val[i] = arguments.length > 1 ? slice.call(arguments) : value // 把触发reject或者progress方法中的参数保存起来
            if (val === progressValues) {
              deferred.notifyWith(ctx, val)
            } else if (!(--remain)) {
              deferred.resolveWith(ctx, val)
            }
          }
        }

    // 如果有多个参数
    if (len > 1) {
      progressValues = new Array(len)
      progressContexts = new Array(len)
      resolveContexts = new Array(len) // 每一个调用了resolve的promise对象
      // 遍历参数
      for ( ; i < len; ++i ) {
        // 如果参数是promise对象
        if (resolveValues[i] && $.isFunction(resolveValues[i].promise)) {
          // 给promise参数传入自定义的成功、失败和进行中的回调函数
          resolveValues[i].promise()
            .done(updateFn(i, resolveContexts, resolveValues))
            .fail(deferred.reject)
            .progress(updateFn(i, progressContexts, progressValues))
        // 如果对应参数已经执行完毕了，remain减一
        } else {
          --remain
        }
      }
    }
    if (!remain) deferred.resolveWith(resolveContexts, resolveValues)
    return deferred.promise()
  }

  $.Deferred = Deferred
})(Zepto)
