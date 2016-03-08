//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

var Zepto = (function() {
  /*  
  undefined   ：为对值 undefined 的引用
  key
  $
  classList
  emptyArray  : 空数组
  concat      ：数组的concat方法
  filter      ：数组的filter方法
  slice       ：数组的slice方法
  document    ：对window.document的引用
  elementDisplay  ：缓存元素display的默认值
  classCache  ：缓存查找类名的正则表达式
  cssNumber   ：这个对象里面的css不需要添加上px

  fragmentRE  ：匹配html标签，例如：<span>，$1为标签名
  singleTagRE ：匹配单一的html标签，例如：<span>或者<link />或者<span></span>
  tagExpanderRE ：匹配没有正确闭合的标签(就是这样形式的标签<div id="div"/>)，并且$1为标签的内容(即<div id="div"/>中的div id="div"，)，$2为标签名(前面例子中的div)。后面补全标签会用到
  rootNodeRE  ：匹配body或者html 
  capitalRE   ：匹配大写字母

  methodAttributes  ：
  adjacencyOperators：插入的方法名称
  table       ：table元素
  tableRow    ：tr元素
  containers  ：table相关的空元素
  readyRE
  simpleSelectorRE：匹配单一的selector
  class2type  ：后面进行初始化，保存Object.prototype.toString.call(value)结果对应的类型
  toString    ：Object.prototype.toString方法
  zepto       ：zepto对象
  camelize
  uniq
  tempParent  ：空的div
  propMap
  isArray     ：判断是否数组的方法
  */
  var undefined, key, $, classList, emptyArray = [], concat = emptyArray.concat, filter = emptyArray.filter, slice = emptyArray.slice,
    document = window.document,
    elementDisplay = {}, classCache = {},
    cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1,'opacity': 1, 'z-index': 1, 'zoom': 1 },
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
    rootNodeRE = /^(?:body|html)$/i,
    capitalRE = /([A-Z])/g,

    // special attributes that should be get/set via method calls
    methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],

    adjacencyOperators = [ 'after', 'prepend', 'before', 'append' ],
    table = document.createElement('table'),
    tableRow = document.createElement('tr'),
    containers = {
      'tr': document.createElement('tbody'),
      'tbody': table, 'thead': table, 'tfoot': table,
      'td': tableRow, 'th': tableRow,
      '*': document.createElement('div')
    },
    readyRE = /complete|loaded|interactive/,
    simpleSelectorRE = /^[\w-]*$/,
    class2type = {},
    toString = class2type.toString,
    zepto = {},
    camelize, uniq,
    tempParent = document.createElement('div'),
    propMap = {
      'tabindex': 'tabIndex',
      'readonly': 'readOnly',
      'for': 'htmlFor',
      'class': 'className',
      'maxlength': 'maxLength',
      'cellspacing': 'cellSpacing',
      'cellpadding': 'cellPadding',
      'rowspan': 'rowSpan',
      'colspan': 'colSpan',
      'usemap': 'useMap',
      'frameborder': 'frameBorder',
      'contenteditable': 'contentEditable'
    },
    isArray = Array.isArray ||
      function(object){ return object instanceof Array }

  // 判断元素和对应的selector是否吻合
  zepto.matches = function(element, selector) {
    // 如果没有element或者没有selector或者element元素不是一个Element节点，返回false
    if (!selector || !element || element.nodeType !== 1) return false 
    // 如果浏览器支持原生matchesSelector，就直接利用原生的。
    // var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector || 
    //                       element.oMatchesSelector || element.matchesSelector
    // if (matchesSelector) return matchesSelector.call(element, selector)
    // fall back to performing a selector:
    // 如果没有原生的节点，就自己实现
    // 原理：
    // 1. 如果element没有parentNode(也就是这个节点没有在DOM树上)，就把element append到空的div节点上，作为qsa的第一个参数
    // 2. 通过zepto.qsa获取对应selector的所有元素，并且查找有没有和element匹配的元素，结果记录到match变量(使用位操作处理了indexOf返回的结果，使其取反-1，使没有匹配的元素就返回0，找到就返回负数，)
    // 3. 如果之前append到空的div上，就移除这个element
    // 4. 返回match
    var match, parent = element.parentNode, temp = !parent
    if (temp) (parent = tempParent).appendChild(element)
    match = ~zepto.qsa(parent, selector).indexOf(element)
    temp && tempParent.removeChild(element)
    return match
  }

  // 判断obj的类型（不知道为什么要在这里判断obj是否等于null，因为下面的toString.call就可以判断，也不知道为什么最后要加上 || 'object'..）
  function type(obj) {
    return obj == null ? String(obj) :
      class2type[toString.call(obj)] || "object"
  }

  // 判断相应类型的函数
  // isFunction、isObject 通过上面的 type函数来实现
  // isWindow 通过检测obj == obj.window来实现(window对象有个window属性指向window，这样做是因为让我们可以写出window.open()这样的代码，否则就只能写open())
  // isDocument 通过检测nodeType是否为DOCUMENT_NODE来实现
  // isPlainObject原理：如果是对象&&不是window对象&&原型为Object.prototype()（也就是说它的直接父类是Object，此外，我觉得判断是否window的代码可以去掉。。）
  function isFunction(value) { return type(value) == "function" }
  function isWindow(obj)     { return obj != null && obj == obj.window }
  function isDocument(obj)   { return obj != null && obj.nodeType == obj.DOCUMENT_NODE }
  function isObject(obj)     { return type(obj) == "object" }
  function isPlainObject(obj) {
    return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
  }

  // 判断只要有length属性并且是number类型就是类数组
  function likeArray(obj) { return typeof obj.length == 'number' }

  // 去掉数组中为null的项
  function compact(array) { return filter.call(array, function(item){ return item != null }) }

  // flatten数组，实际作flatten处理的是$.fn.concat函数
  function flatten(array) { return array.length > 0 ? $.fn.concat.apply([], array) : array }

  // 转换为驼峰格式：'abc-def' -> 'abcDef'
  camelize = function(str){ return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' }) }

  // 转换格式：'abcDef' -> 'abc-def'
  function dasherize(str) {
    return str.replace(/::/g, '/') // :: -> /
           .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2') // ABCd -> AB_Cd
           .replace(/([a-z\d])([A-Z])/g, '$1_$2') // aB - > a_b
           .replace(/_/g, '-') // A_b -> A-b
           .toLowerCase() // A-b - > A-B
  }

  // 去除数组或者类数组中的重复项，使用数组的filter方法实现
  uniq = function(array){ return filter.call(array, function(item, idx){ return array.indexOf(item) == idx }) }

  // 创建匹配对应类名的正则表达式：匹配开始位置或者空格，加上类名，加上空格或者结尾的位置
  function classRE(name) {
    return name in classCache ?
      classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
  }

  // css值的类型为number并且不是cssNumer对象里面的属性就加上px
  function maybeAddPx(name, value) {
    return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
  }

  // 获取元素对应的display默认值，如果默认值为none，就设置为display，并且把结果缓存到elementDisplay中。
  function defaultDisplay(nodeName) {
    var element, display
    if (!elementDisplay[nodeName]) {
      element = document.createElement(nodeName)
      document.body.appendChild(element)
      display = getComputedStyle(element, '').getPropertyValue("display")
      element.parentNode.removeChild(element)
      display == "none" && (display = "block")
      elementDisplay[nodeName] = display
    }
    return elementDisplay[nodeName]
  }

  // 获取子元素，支持element.children就用原生的，否则用过滤掉不是ELEMENT_NODE的元素
  function children(element) {
    return 'children' in element ?
      slice.call(element.children) :
      $.map(element.childNodes, function(node){ if (node.nodeType == 1) return node })
  }

  // Z构造函数，初始化的时候会把dom和dom.length和selector保存起来
  function Z(dom, selector) {
    var i, len = dom ? dom.length : 0
    for (i = 0; i < len; i++) this[i] = dom[i]
    this.length = len
    this.selector = selector || ''
  }

  // `$.zepto.fragment` takes a html string and an optional tag name
  // to generate DOM nodes from the given html string.
  // The generated DOM nodes are returned as an array.
  // This function can be overridden in plugins for example to make
  // it compatible with browsers that don't support the DOM fully.
  // 
  // 作用：生成DOM节点
  // 解析：
  // 1、如果html参数是单一的标签，就直接使用createElement创建对应元素，保存到dom变量上
  // 2、否则：
  //    1.使用tagExpanderRE处理没有正确闭合的标签 
  //    2.如果没有name参数并且html参数是html片段，就将html参数片段的标签名赋值给name
  //    3.如果name不是tr、td、tbody 和 *，就给name赋值*
  //    4.name作为对象container的key，获取对应的value，赋值给container变量（也就是对应的预先创建好的元素）
  //    5.container.innerHTML = '' + html
  //    6.上面已经构成了完整的DOM，接下来就是要把html参数对应DOM赋值给dom
  //    7.最后把properties里面的attribute添加上去，调用$.fn.attr。此外还可以在properties里设置methodAttributes的属性，调用对应的$.fn.方法实现。
  zepto.fragment = function(html, name, properties) {
    var dom, nodes, container

    // A special case optimization for a single tag
    if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1))

    if (!dom) {
      if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")
      if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
      if (!(name in containers)) name = '*'

      container = containers[name]
      container.innerHTML = '' + html
      dom = $.each(slice.call(container.childNodes), function(){
        container.removeChild(this)
      })
    }

    if (isPlainObject(properties)) {
      nodes = $(dom)
      $.each(properties, function(key, value) {
        if (methodAttributes.indexOf(key) > -1) nodes[key](value)
        else nodes.attr(key, value)
      })
    }

    return dom
  }

  // `$.zepto.Z` swaps out the prototype of the given `dom` array
  // of nodes with `$.fn` and thus supplying all the Zepto functions
  // to the array. This method can be overridden in plugins.
  // 
  // 调用zepto.Z其实就是新建一个Z对象
  zepto.Z = function(dom, selector) {
    return new Z(dom, selector)
  }

  // `$.zepto.isZ` should return `true` if the given object is a Zepto
  // collection. This method can be overridden in plugins.
  // 判断是否Z对象
  zepto.isZ = function(object) {
    return object instanceof zepto.Z
  }

  // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
  // takes a CSS selector and an optional context (and handles various
  // special cases).
  // This method can be overridden in plugins.
  // 
  // 一、没有传入任何参数，就直接返回一个空数组
  // 二、如果selector是html片段，直接调用$().find或者zepto.qsa获取对应元素
  // 三、如果selecrot参数是一个函数，在dom完成加载的时候执行该函数;
  // 四、如果如果selector是一个Z对象，就直接返回selector自身
  // 五、如果给出的是数组、对象、html片段、或者css选择器，就获取其对应的dom数组，最后通过zepto.Z函数来返回Z对象
  zepto.init = function(selector, context) {
    var dom
    // If nothing given, return an empty Zepto collection
    if (!selector) return zepto.Z()
    // Optimize for string selectors
    else if (typeof selector == 'string') {
      selector = selector.trim()
      // If it's a html fragment, create nodes from it
      // Note: In both Chrome 21 and Firefox 15, DOM error 12
      // is thrown if the fragment doesn't begin with <
      if (selector[0] == '<' && fragmentRE.test(selector))
        dom = zepto.fragment(selector, RegExp.$1, context), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // If it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
    }
    // If a function is given, call it when the DOM is ready
    else if (isFunction(selector)) return $(document).ready(selector)
    // If a Zepto collection is given, just return it
    else if (zepto.isZ(selector)) return selector
    else {
      // normalize array if an array of nodes is given
      if (isArray(selector)) dom = compact(selector)
      // Wrap DOM nodes.
      else if (isObject(selector))
        dom = [selector], selector = null
      // If it's a html fragment, create nodes from it
      else if (fragmentRE.test(selector))
        dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null // 疑问：为什么这个的zepto.fragment会传入context进去
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // And last but no least, if it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
    }
    // create a new Zepto collection from the nodes found
    return zepto.Z(dom, selector)
  }

  // `$` will be the base `Zepto` object. When calling this
  // function just call `$.zepto.init, which makes the implementation
  // details of selecting nodes and creating Zepto collections
  // patchable in plugins.
  // 
  // 这就是zepto的入口函数$，不过里面什么也没干，所有实现都由
  $ = function(selector, context){
    return zepto.init(selector, context)
  }

  // 对象扩展，深复制用到递归来实现：如果是对象或者数组属性，就地道用自身递归。否则直接赋值。
  function extend(target, source, deep) {
    for (key in source)
      if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
        if (isPlainObject(source[key]) && !isPlainObject(target[key]))
          target[key] = {}
        if (isArray(source[key]) && !isArray(target[key]))
          target[key] = []
        extend(target[key], source[key], deep)
      }
      else if (source[key] !== undefined) target[key] = source[key]
  }

  // Copy all but undefined properties from one or more
  // objects to the `target` object.
  // 
  // 多个对象扩展，调用上面的extend函数来实现
  $.extend = function(target){
    var deep, args = slice.call(arguments, 1)
    if (typeof target == 'boolean') {
      deep = target
      target = args.shift()
    }
    args.forEach(function(arg){ extend(target, arg, deep) })
    return target
  }

  // `$.zepto.qsa` is Zepto's CSS selector implementation which
  // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
  // This method can be overridden in plugins.
  // $.zepto.qsa 是Zepto的css选择器实现，用了document.querySelectorAll并且添加了一些性能优化的代码
  zepto.qsa = function(element, selector){
    var found,
        maybeID = selector[0] == '#',// 如果selector的开头是#，那就有可能是id
        maybeClass = !maybeID && selector[0] == '.',// 如果selector的开头是.，那就有可能是css类
        // 去掉第一个字符是#和.的字符
        nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, // Ensure that a 1 char tag name still gets checked
        isSimple = simpleSelectorRE.test(nameOnly)// 判断是否单一的selector
        // 下面这一坨的所做的事情：
        // 1.如果有getElementById并且是单一的选择器并且有可能是id，那么就通过getElementById来获取元素(只有element为document或者DocumentFragment类型,并且selector为id才会进入这步)
        // 2.否则，如果element不是元素节点、Document节点和DocumentFragment节点，就返回空数组
        // 3.否则，如果不是单一选择器或者可能是id或者没有getElementsByClassName就使用querySelectorAll获取元素
        // 4.否则，如果可能是class，使用getElementsByClassName，否则使用getElementsByTagName
        // 5.注意，类数组都用使用Array.prototype.slice.call(类数组)的方法返回数组
    return (element.getElementById && isSimple && maybeID) ? // Safari DocumentFragment doesn't have getElementById
      ( (found = element.getElementById(nameOnly)) ? [found] : [] ) :
      (element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType !== 11) ? [] :
      slice.call(
        isSimple && !maybeID && element.getElementsByClassName ? // DocumentFragment doesn't have getElementsByClassName/TagName
          maybeClass ? element.getElementsByClassName(nameOnly) : // If it's simple, it could be a class
          element.getElementsByTagName(selector) : // Or a tag
          element.querySelectorAll(selector) // Or it's not simple, and we need to query all
      )
  }

  // 过滤函数，调用$().filter实现，返回Z对象
  function filtered(nodes, selector) {
    return selector == null ? $(nodes) : $(nodes).filter(selector)
  }

  // 有原生的contains函数就调用原生的，否者查找是否存在父节点等于parent来实现
  $.contains = document.documentElement.contains ?
    function(parent, node) {
      return parent !== node && parent.contains(node)
    } :
    function(parent, node) {
      while (node && (node = node.parentNode))
        if (node === parent) return true
      return false
    }

  // 某些方法会传入一些回调函数作为参数，对于这些回调函数，我们一般要对其进行处理：
  // 改变它的上下文(this值)，调用它的时候给它传入一些参数
  // 因此这个方法就是干上面说的那些事情
  function funcArg(context, arg, idx, payload) { // context是上下文，arg是回调函数(也有可能不是)，idx(Z对象中元素的index值)，payload(传入回调函数的内容)
    return isFunction(arg) ? arg.call(context, idx, payload) : arg
  }

  // 设置特性
  function setAttribute(node, name, value) {
    value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
  }

  // access className property while respecting SVGAnimatedString
  // 设置或者读取className，如果是svg元素就设置或者读取className.baseVal
  function className(node, value){
    var klass = node.className || '',
        svg   = klass && klass.baseVal !== undefined

    if (value === undefined) return svg ? klass.baseVal : klass
    svg ? (klass.baseVal = value) : (node.className = value)
  }

  // "true"  => true
  // "false" => false
  // "null"  => null
  // "42"    => 42
  // "42.5"  => 42.5
  // "08"    => "08"
  // JSON    => parse if valid
  // String  => self
  // 反序列化
  function deserializeValue(value) {
    try {
      return value ?
        value == "true" ||
        ( value == "false" ? false :
          value == "null" ? null :
          +value + "" == value ? +value :
          /^[\[\{]/.test(value) ? $.parseJSON(value) : // 以 { 或者 [ 开头就调用JSON.parse解析
          value )
        : value
    } catch(e) {
      return value
    }
  }

  $.type = type
  $.isFunction = isFunction
  $.isWindow = isWindow
  $.isArray = isArray
  $.isPlainObject = isPlainObject

  // 通过for遍历到有属性就是非空对象
  $.isEmptyObject = function(obj) {
    var name
    for (name in obj) return false
    return true
  }

  // 调用Array.prototype.indexOf来实现
  $.inArray = function(elem, array, i){
    return emptyArray.indexOf.call(array, elem, i)
  }

  $.camelCase = camelize

  // 调用String.prototype.trim实现
  $.trim = function(str) {
    return str == null ? "" : String.prototype.trim.call(str)
  }

  // plugin compatibility
  $.uuid = 0
  $.support = { }
  $.expr = { }
  $.noop = function() {}

  // 模仿es5的数组方法map，并且可以作用于对象。此外，还会去掉值为null的项目。最后flatten返回的数组。
  $.map = function(elements, callback){
    var value, values = [], i, key
    if (likeArray(elements))
      for (i = 0; i < elements.length; i++) {
        value = callback(elements[i], i)
        if (value != null) values.push(value)
      }
    else
      for (key in elements) {
        value = callback(elements[key], key)
        if (value != null) values.push(value)
      }
    return flatten(values)
  }

  // 类似es5的foreach，回调函数返回false时终结遍历，无论如何都会返回elements
  $.each = function(elements, callback){
    var i, key
    if (likeArray(elements)) {
      for (i = 0; i < elements.length; i++)
        if (callback.call(elements[i], i, elements[i]) === false) return elements
    } else {
      for (key in elements)
        if (callback.call(elements[key], key, elements[key]) === false) return elements
    }

    return elements
  }

  // 调用filter函数实现
  $.grep = function(elements, callback){
    return filter.call(elements, callback)
  }

  //$.parseJSON直接引用JSON.parse
  if (window.JSON) $.parseJSON = JSON.parse

  // Populate the class2type map
  // 填充class2type对象，使Object.prototype.toString.call()结果和对象类型一一对应。
  $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
    class2type[ "[object " + name + "]" ] = name.toLowerCase()
  })

  // Define methods that will be available on all
  // Zepto collections
  $.fn = {
    constructor: zepto.Z,
    length: 0,

    // Because a collection acts like an array
    // copy over these useful array functions.
    // 添加一些数组的方法
    // 此外，Z对象有了这些方法之后就会被认为是类数组，所以使用$()获取元素就会在控制台里面以数组的形式展现出来。
    forEach: emptyArray.forEach,
    reduce: emptyArray.reduce,
    push: emptyArray.push,
    sort: emptyArray.sort,
    splice: emptyArray.splice,
    indexOf: emptyArray.indexOf,

    // 先处理参数，使Z对象的参数都转换成数组，并且所有参数都push到一个数组里面。最后使这个数组concat调用这个方法的数组
    // (如果是Z对象就先装换成数组,注意使用的是concat.apply不是concat.call,也因此会flatten数组)
    concat: function(){
      var i, value, args = []
      for (i = 0; i < arguments.length; i++) {
        value = arguments[i]
        args[i] = zepto.isZ(value) ? value.toArray() : value
      }
      return concat.apply(zepto.isZ(this) ? this.toArray() : this, args)
    },

    // `map` and `slice` in the jQuery API work differently
    // from their array counterparts
    // 调用$.map实现
    map: function(fn){
      return $($.map(this, function(el, i){ return fn.call(el, i, el) }))
    },
    // 使用Array.prototype.slice实现
    slice: function(){
      return $(slice.apply(this, arguments))
    },

    // $(function(){}) 就是通过该函数实现，先检查document.readyState，如果dom树还没有构建完，就DOMContentLoaded事件触发的时候再调用该函数
    ready: function(callback){
      // need to check if document.body exists for IE as that browser reports
      // document ready when it hasn't yet created the body element
      if (readyRE.test(document.readyState) && document.body) callback($)
      else document.addEventListener('DOMContentLoaded', function(){ callback($) }, false)
      return this
    },
    // 如果没有传入参数idx，返回元素集合数组。否则根据idx返回相应的元素
    get: function(idx){
      return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
    },

    // 返回所有元素的数组 
    toArray: function(){ return this.get() },

    // 返回元素的个数
    size: function(){
      return this.length
    },

    // 删除元素的节点
    remove: function(){
      return this.each(function(){
        if (this.parentNode != null)
          this.parentNode.removeChild(this)
      })
    },

    // 利用原生的es5的every方法实现each遍历，返回false的时候停止遍历
    each: function(callback){
      emptyArray.every.call(this, function(el, idx){
        return callback.call(el, idx, el) !== false
      })
      return this
    },

    // 如果是函数的话，就调用两次not函数实现过滤
    // 否则直接使用数组的filter函数加上zepto.matches函数进行过滤
    // 返回过滤之后的Z对象
    filter: function(selector){
      if (isFunction(selector)) return this.not(this.not(selector))
      return $(filter.call(this, function(element){
        return zepto.matches(element, selector)
      }))
    },

    // 添加元素，通过调用$.fn.concat函数来合并数组，然后去除重复项，调用$()返回新的Z对象
    add: function(selector,context){
      return $(uniq(this.concat($(selector,context))))
    },

    // 直接调用zepto.matches函数判断
    is: function(selector){
      return this.length > 0 && zepto.matches(this[0], selector)
    },

    // 如果参数selector是一个函数，就类似于数组的filter函数那样过滤，只不过回调函数中返回true就过滤掉
    // 否则，如果selector是string类型，或者数组类型，就获取对应的dom节点元素，最后排除这些节点，组成新的Z对象
    not: function(selector){
      var nodes=[]
      if (isFunction(selector) && selector.call !== undefined)
        this.each(function(idx){
          if (!selector.call(this,idx)) nodes.push(this)
        })
      else {
        var excludes = typeof selector == 'string' ? this.filter(selector) :
          (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
        this.forEach(function(el){
          if (excludes.indexOf(el) < 0) nodes.push(el)
        })
      }
      return $(nodes)
    },

    // 调用自身的方法实现，注意返回的不是boolean值，而是数组。。
    has: function(selector){
      return this.filter(function(){
        return isObject(selector) ?
          $.contains(this, selector) :
          $(this).find(selector).size()
      })
    },

    // 调用Array.prototype.slice实现, 都是返回数组
    eq: function(idx){
      return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1)
    },
    first: function(){
      var el = this[0]
      return el && !isObject(el) ? el : $(el)
    },
    last: function(){
      var el = this[this.length - 1]
      return el && !isObject(el) ? el : $(el)
    },
 
    find: function(selector){
      var result, $this = this
      if (!selector) result = $() // 没有参数
      else if (typeof selector == 'object') // selector是个dom元素或者Z对象，最主要是通过$.contains来判断是否包含元素
        result = $(selector).filter(function(){
          var node = this
          return emptyArray.some.call($this, function(parent){
            return $.contains(parent, node)
          })
        })
      else if (this.length == 1) result = $(zepto.qsa(this[0], selector)) // selector是选择器并且Z对象this只有一个元素，调用zepto.qsa返回DOM元素数组
      else result = this.map(function(){ return zepto.qsa(this, selector) }) // selector是选择器并且Z对象this有多个元素，和上面一样，不过结合$.fn.map函数返回一个二维数组
      return result
    },

    // 不断地向上寻找元素的父节点，直到找到和selector相匹配的一个父节点
    closest: function(selector, context){
      var node = this[0], collection = false // node总是指向Z对象第一个元素的父节点(不限于直属父节点)，
      if (typeof selector == 'object') collection = $(selector) // selector参数为dom元素或者Z对象时，collection指向selector对应的Z对象
      // 不断的向上寻找父节点，直到和selector对应的元素或者css选择器相匹配
      while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
        node = node !== context && !isDocument(node) && node.parentNode
      return $(node)
    },

    // 通过$.map函数来获取所有的父节点，在map的回调函数中把父元素push进ancestors参数，然后$.map函数的返回值为所有节点的parentNode。
    // 最后过滤掉selector参数对应的DOM节点
    parents: function(selector){
      var ancestors = [], nodes = this
      while (nodes.length > 0)
        nodes = $.map(nodes, function(node){
          if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
            ancestors.push(node)
            return node
          }
        })
      return filtered(ancestors, selector)
    },

    // 通过$.fn.pluck获取所有的parentNode，然后使用uniq函数去掉重复的节点，最后使用filtered函数过滤掉
    parent: function(selector){
      return filtered(uniq(this.pluck('parentNode')), selector)
    },
    // 通过$.fn.map获取每一个节点的children，最后通过filtered过滤掉相关的selector
    children: function(selector){
      return filtered(this.map(function(){ return children(this) }), selector)
    },
    // 返回childNodes属性，但是frame或者iframe元素就通过contentDocument返回对应的Document元素
    contents: function() {
      return this.map(function() { return this.contentDocument || slice.call(this.childNodes) })
    },
    // 获取元素的parentNode下的子元素，过滤掉自身和selector参数对应的元素
    siblings: function(selector){
      return filtered(this.map(function(i, el){
        return filter.call(children(el.parentNode), function(child){ return child!==el })
      }), selector)
    },
    // 设置innerHTML = ''实现
    empty: function(){
      return this.each(function(){ this.innerHTML = '' })
    },
    // `pluck` is borrowed from Prototype.js
    // 使用$.map函数获取Z对象中元素的相关属性
    pluck: function(property){
      return $.map(this, function(el){ return el[property] })
    },
    // 如果在style特性里面设置了display为none，就把display改为空''。
    // 如果元素的计算样式为none，就在style特性里面设置display为该元素的默认display值
    show: function(){
      return this.each(function(){
        this.style.display == "none" && (this.style.display = '')
        if (getComputedStyle(this, '').getPropertyValue("display") == "none")
          this.style.display = defaultDisplay(this.nodeName)
      })
    },
    // 通过insertBefore插入新内容，然后把自身移除
    replaceWith: function(newContent){
      return this.before(newContent).remove()
    },
    // 通过structure参数生成每一个包裹元素，然后调用wrapAll对Z对象的每一个元素进行包裹
    wrap: function(structure){
      var func = isFunction(structure)
      if (this[0] && !func)
        var dom   = $(structure).get(0),
            // 有dom.parentNode说明传入的structure是DOM树上的一个节点。
            // 所以structure是DOM树上的一个节点或者Z对象里面的元素有多个，就要对包裹元素进行复制
            clone = dom.parentNode || this.length > 1 

      return this.each(function(index){
        $(this).wrapAll(
          func ? structure.call(this, index) :
            clone ? dom.cloneNode(true) : dom
        )
      })
    },
    // 使用structure构建相应的节点，使用insertBefore插入到DOM树中，然后遍历到structure节点的最里面的子元素，把Z对象里面的所有元素append进去。
    wrapAll: function(structure){
      if (this[0]) {
        $(this[0]).before(structure = $(structure))
        var children
        // drill down to the inmost element
        while ((children = structure.children()).length) structure = children.first() // 遍历到最连的元素
        $(structure).append(this)
      }
      return this
    },
    wrapInner: function(structure){
      var func = isFunction(structure)
      return this.each(function(index){
        var self = $(this), contents = self.contents(), // 获取元素的内容
            dom  = func ? structure.call(this, index) : structure // 将structure参数转换为对应的html片段
        contents.length ? contents.wrapAll(dom) : self.append(dom) // 如果正在处理的元素有子元素就调用wrapAll完成对内容进行包裹，否则直接append就可以了
      })
    },
    unwrap: function(){
      this.parent().each(function(){
        $(this).replaceWith($(this).children())
      })
      return this
    },
    clone: function(){
      return this.map(function(){ return this.cloneNode(true) })
    },
    hide: function(){
      return this.css("display", "none")
    },
    toggle: function(setting){
      return this.each(function(){
        var el = $(this)
        ;(setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide()
      })
    },
    // 获取每一个元素的previousElementSibling，组成新的Z对象，并且过滤掉selector参数所对应的元素
    prev: function(selector){ return $(this.pluck('previousElementSibling')).filter(selector || '*') },
    next: function(selector){ return $(this.pluck('nextElementSibling')).filter(selector || '*') },
    // 如果有传入html参数，就把Z对象里面元素的内容清空，然后append新内容。否则直接返回innerHTML
    html: function(html){
      return 0 in arguments ? // 0 in arguments 判断有没有参数传入
        this.each(function(idx){
          var originHtml = this.innerHTML
          $(this).empty().append( funcArg(this, html, idx, originHtml) )
        }) :
        (0 in this ? this[0].innerHTML : null)
    },
    // 和html类似
    text: function(text){
      return 0 in arguments ?
        this.each(function(idx){
          var newText = funcArg(this, text, idx, this.textContent)
          this.textContent = newText == null ? '' : ''+newText
        }) :
        (0 in this ? this.pluck('textContent').join("") : null)
    },
    attr: function(name, value){
      var result
      return (typeof name == 'string' && !(1 in arguments)) ?
        // 获取特性
        // 如果Z对象中没有节点或者第一个节点不是元素节点，返回undefined
        // 先用getAttribute获取特性，如果获取不到，使用直接访问的方法获取
        // (getAttribute和直接访问还是有区别的，例如一个元素没有定义id特性，使用getAttribute获得的是null，而直接访问获取的是空字符串''。)
        // (所以一个元素没有定义id特性，直接访问可以获取它的默认值而不是null)
        (!this.length || this[0].nodeType !== 1 ? undefined : 
          (!(result = this[0].getAttribute(name)) && name in this[0]) ? this[0][name] : result
        ) :
        // 设置特性，通过setAttribute设置
        this.each(function(idx){
          if (this.nodeType !== 1) return
          if (isObject(name)) for (key in name) setAttribute(this, key, name[key])
          else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name))) // 如果value参数是函数，通过funcArg函数获取对应的特性值
        })
    },
    // 通用setAttribute函数完成，里面使用了removeAttribute方法删除特性
    removeAttr: function(name){
      return this.each(function(){ this.nodeType === 1 && name.split(' ').forEach(function(attribute){
        setAttribute(this, attribute)
      }, this)})
    },
    // 和attr类似，而且更简单。不过prop不使用setAttribute和getAttrbute，这样的话在获取onclick和style这些特性时就会有所不同。
    // (例如获取style特性，使用attr会获取到字符串。而使用prop会获取到一个对象)
    prop: function(name, value){
      name = propMap[name] || name
      return (1 in arguments) ?
        this.each(function(idx){
          this[name] = funcArg(this, value, idx, this[name])
        }) :
        (this[0] && this[0][name])
    },
    // 使用$.fn.attr实现，没有使用原生的dataset
    data: function(name, value){
      var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase() // 把驼峰写法的name参数更换为用字符‘-’连接，并且加上data-前缀

      var data = (1 in arguments) ?
        this.attr(attrName, value) :
        this.attr(attrName)
      return data !== null ? deserializeValue(data) : undefined // 返回值转换为字符串，deserializeValue不过对对象进行处理
    },
    val: function(value){
      return 0 in arguments ?
        this.each(function(idx){
          this.value = funcArg(this, value, idx, this.value)
        }) :
        /*
        对于多选<select multiple>这种情况，会遍历select的所有option子元素，返回所有selected为true的值，返回值为一个数组
         */
        (this[0] && (this[0].multiple ?
           $(this[0]).find('option').filter(function(){ return this.selected }).pluck('value') :
           this[0].value)
        )
    },
    // 使用offset来获取
    offset: function(coordinates){
      /*
      设置offset的值：
      1、根据参数coordinates计算出想要设置的值coords.top和coords.left
      2、计算出offsetParent的offset，parentOffset.top和parentOffset.left
      3、上面的相减就是将要设置的位置的top和left值了。
      3、最后将Z对象里面position值为static的改为relative。然后就赋值top和left
       */
      if (coordinates) return this.each(function(index){
        var $this = $(this),
            coords = funcArg(this, coordinates, index, $this.offset()),
            parentOffset = $this.offsetParent().offset(),
            props = {
              top:  coords.top  - parentOffset.top,
              left: coords.left - parentOffset.left
            }

        if ($this.css('position') == 'static') props['position'] = 'relative'
        $this.css(props)
      })
      if (!this.length) return null // Z对象中没有元素
      if (!$.contains(document.documentElement, this[0])) // 节点没有在DOM树上，返回{top: 0, left: 0}
        return {top: 0, left: 0}
      // 使用元素的getBoundingCLientRect来获取元素的offset值
      var obj = this[0].getBoundingClientRect()
      return {
        left: obj.left + window.pageXOffset,// left要加上pageXoffset值，top类似。
        top: obj.top + window.pageYOffset,
        width: Math.round(obj.width),
        height: Math.round(obj.height)
      }
    },
    css: function(property, value){
      /*没有第二个参数，读取属性*/
      if (arguments.length < 2) {
        var computedStyle, element = this[0]
        if(!element) return
        computedStyle = getComputedStyle(element, '') // 获取元素的计算样式
        if (typeof property == 'string')
          return element.style[camelize(property)] || computedStyle.getPropertyValue(property) // 先通过style属性获取，没有的话再通过getPropertyValue获取
        // property为数组的情况，原理和上面一样，不过多个属性会通过对象形式返回
        else if (isArray(property)) {
          var props = {}
          $.each(property, function(_, prop){
            props[prop] = (element.style[camelize(prop)] || computedStyle.getPropertyValue(prop))
          })
          return props
        }
      }

      var css = ''
      if (type(property) == 'string') {
        if (!value && value !== 0) // value 为null、undefined、''等值都会移除这个property
          this.each(function(){ this.style.removeProperty(dasherize(property)) })
        else // value不为空的情况。有些没有加上px属性的就加上，然后拼接css
          css = dasherize(property) + ":" + maybeAddPx(property, value)
      } else { // 传入的参数为对象的情况，实现原理同上
        for (key in property)
          if (!property[key] && property[key] !== 0)
            this.each(function(){ this.style.removeProperty(dasherize(key)) })
          else
            css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
      }
      // 设置cssText的时候cssText会自动将存在的css覆盖掉，所以这里只要往cssText添加css就可以了。
      return this.each(function(){ this.style.cssText += ';' + css }) 
    },
    index: function(element){
      return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
    },
    // 通过classRE函数构建正则表达式来判断是否存在对应的className
    hasClass: function(name){
      if (!name) return false
      return emptyArray.some.call(this, function(el){
        return this.test(className(el))
      }, classRE(name)) // Array.prototytp.some 可以传入第二个参数，改变回调函数里的this值
    },
    addClass: function(name){
      if (!name) return this
      return this.each(function(idx){
        if (!('className' in this)) return
        classList = [] // 待添加的类push进这里
        var cls = className(this), newName = funcArg(this, name, idx, cls) // 根据name参数构建要添加的类
        newName.split(/\s+/g).forEach(function(klass){ 
          if (!$(this).hasClass(klass)) classList.push(klass) // 把没有的类push进classList
        }, this)
        classList.length && className(this, cls + (cls ? " " : "") + classList.join(" ")) // 改变新的className
      })
    },
    removeClass: function(name){
      return this.each(function(idx){
        if (!('className' in this)) return
        if (name === undefined) return className(this, '') // 如果没有name参数，直接去掉所有类
        classList = className(this)
        funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass){
          classList = classList.replace(classRE(klass), " ") // 把类去掉
        })
        className(this, classList.trim())
      })
    },
    toggleClass: function(name, when){
      if (!name) return this
      return this.each(function(idx){
        var $this = $(this), names = funcArg(this, name, idx, className(this))
        names.split(/\s+/g).forEach(function(klass){
          (when === undefined ? !$this.hasClass(klass) : when) ?
            $this.addClass(klass) : $this.removeClass(klass)
        })
      })
    },

    scrollTop: function(value){
      if (!this.length) return
      var hasScrollTop = 'scrollTop' in this[0]
      if (value === undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset // 没有传入参数返回scrollTop属性。window没有scrollTop就使用window.pageYOffset
      // 设置scrollTop，window没有scrollTop使用window.scrollTo代替  
      return this.each(hasScrollTop ?
        function(){ this.scrollTop = value } :
        function(){ this.scrollTo(this.scrollX, value) })
    },
    /* 和上面类似 */
    scrollLeft: function(value){
      if (!this.length) return
      var hasScrollLeft = 'scrollLeft' in this[0]
      if (value === undefined) return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset
      return this.each(hasScrollLeft ?
        function(){ this.scrollLeft = value } :
        function(){ this.scrollTo(value, this.scrollY) })
    },
    /* 返回的top值：元素的offset.top减去offsetParent的offset.top。此外还要减去元素的margin值和减去offsetParent的border值 */
    position: function() {
      if (!this.length) return

      var elem = this[0],
        // Get *real* offsetParent
        offsetParent = this.offsetParent(),
        // Get correct offsets
        offset       = this.offset(),
        parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset()

      // Subtract element margins
      // note: when an element has margin: auto the offsetLeft and marginLeft
      // are the same in Safari causing offset.left to incorrectly be 0
      offset.top  -= parseFloat( $(elem).css('margin-top') ) || 0
      offset.left -= parseFloat( $(elem).css('margin-left') ) || 0

      // Add offsetParent borders
      parentOffset.top  += parseFloat( $(offsetParent[0]).css('border-top-width') ) || 0
      parentOffset.left += parseFloat( $(offsetParent[0]).css('border-left-width') ) || 0

      // Subtract the two offsets
      return {
        top:  offset.top  - parentOffset.top,
        left: offset.left - parentOffset.left
      }
    },

    offsetParent: function() {
      return this.map(function(){
        var parent = this.offsetParent || document.body
        while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static") // 总感觉这里while循环永远都不会执行。。
          parent = parent.offsetParent
        return parent
      })
    }
  }

  // for now
  $.fn.detach = $.fn.remove

  // Generate the `width` and `height` functions
  // 生成$.fn.width和$.fn.height
  // 生成$.fn.width: 如果是window对象，就返回window.width。如果是documentdocumentElement对象，返回docuemnt.scrollWidth。否者调用$.fn.offset函数来获取width
  // 生成$.fn.height同理
  ;['width', 'height'].forEach(function(dimension){
    var dimensionProperty =
      dimension.replace(/./, function(m){ return m[0].toUpperCase() }) // width和height的第一个字母换成大写

    $.fn[dimension] = function(value){
      var offset, el = this[0]
      if (value === undefined) return isWindow(el) ? el['inner' + dimensionProperty] :
        isDocument(el) ? el.documentElement['scroll' + dimensionProperty] :
        (offset = this.offset()) && offset[dimension]
      else return this.each(function(idx){
        el = $(this)
        el.css(dimension, funcArg(this, value, idx, el[dimension]()))
      })
    }
  })

  // 递归深度遍历
  function traverseNode(node, fun) {
    fun(node)
    for (var i = 0, len = node.childNodes.length; i < len; i++)
      traverseNode(node.childNodes[i], fun)
  }

  // Generate the `after`, `prepend`, `before`, `append`,
  // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
  adjacencyOperators.forEach(function(operator, operatorIndex) {
    var inside = operatorIndex % 2 //=> prepend, append

    $.fn[operator] = function(){
      // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
      /* 生成要插入的节点nodes */
      var argType, nodes = $.map(arguments, function(arg) {
            argType = type(arg)
            return argType == "object" || argType == "array" || arg == null ?
              arg : zepto.fragment(arg)
          }),
          parent, copyByClone = this.length > 1
      if (nodes.length < 1) return this // 没有参数直接返回

      // 
      return this.each(function(_, target){
        parent = inside ? target : target.parentNode // 如果是prepend或者append的话，parent指向target

        // convert all methods to a "before" operation
        // 通过改变target的值，使所有的动作都转换为before操作
        target = operatorIndex == 0 ? target.nextSibling :
                 operatorIndex == 1 ? target.firstChild :
                 operatorIndex == 2 ? target :
                 null

        var parentInDocument = $.contains(document.documentElement, parent)

        nodes.forEach(function(node){
          if (copyByClone) node = node.cloneNode(true) // 如果Z对象里面有多个元素，就需要复制这些节点。
          else if (!parent) return $(node).remove()

          parent.insertBefore(node, target) // 上面已经把所有动作都改成用insertBefore来实现，所以这里统一调用insertBefore插入节点
          // 遍历插入的节点的子元素有没有script元素，如果有且该script标签不是指向外部的js，那就通过eval函数执行里面的代码
          // (只有插入script元素浏览器才会自动执行。如果插入的不是script元素，而是div元素里面包含script元素，那么里面的script代码就不会执行)
          if (parentInDocument) traverseNode(node, function(el){
            if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
               (!el.type || el.type === 'text/javascript') && !el.src)
              { debugger; 
              // window['eval'].call(window, el.innerHTML)
              }
          })
        })
      })
    }

    // after    => insertAfter
    // prepend  => prependTo
    // before   => insertBefore
    // append   => appendTo
    // 生成insertAfter、prependTo、insertBefore和appendTo，只是简单的语法糖调用after、prepend、before和append
    $.fn[inside ? operator+'To' : 'insert'+(operatorIndex ? 'Before' : 'After')] = function(html){
      $(html)[operator](this)
      return this
    }
  })

  zepto.Z.prototype = Z.prototype = $.fn

  // Export internal API functions in the `$.zepto` namespace
  zepto.uniq = uniq
  zepto.deserializeValue = deserializeValue
  $.zepto = zepto

  return $
})()

// If `$` is not yet defined, point it to `Zepto`
window.Zepto = Zepto
window.$ === undefined && (window.$ = Zepto)
