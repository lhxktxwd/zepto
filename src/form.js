//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  $.fn.serializeArray = function() {
    var name, type, result = [],
      add = function(value) {
        debugger;
        if (value.forEach) return value.forEach(add) // 针对<select multiple>这种情况时，value参数为一个数组
        result.push({ name: name, value: value })
      }
    if (this[0]) $.each(this[0].elements, function(_, field){
      type = field.type, name = field.name
      // 过滤掉：没有name特性的元素、fieldset元素、被禁掉的元素、type为submit的元素、type为reset的元素、type为button的元素、type为file的元素
      // 和 没有被选中的type为raido或者checkbox的元素
      if (name && field.nodeName.toLowerCase() != 'fieldset' &&
        !field.disabled && type != 'submit' && type != 'reset' && type != 'button' && type != 'file' &&
        ((type != 'radio' && type != 'checkbox') || field.checked))
          add($(field).val())
    })
    return result
  }


  $.fn.serialize = function(){
    var result = []
    this.serializeArray().forEach(function(elm){
      result.push(encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value))
    })
    return result.join('&')
  }

  $.fn.submit = function(callback) {
    // 有传入callback参数，绑定submit事件
    if (0 in arguments) this.bind('submit', callback)
    // 没有传入callback参数，触发submit事件
    else if (this.length) {
      var event = $.Event('submit')
      this.eq(0).trigger(event)
      if (!event.isDefaultPrevented()) this.get(0).submit()
    }
    return this
  }

})(Zepto)
