var Zepto = (function() {
	// 私有变量($和zepto不是私有变量，它们暴露出去)
	var undefined, emptyArray = [], filter = emptyArray.filter, slice = emptyArray.slice;
		$, zepto = {};

	// 私有函数
	function likeArray() {}
	function Z() {}

	// 构建Z对象的主要函数
	zepto.matches = function() {};
	zepto.fragment = function() {};
	zepto.Z = function() {};
	zepto.isZ = function() {};
	zepto.init = function() {};
	zepto.qsa = function() {};

	// Z对象的公用方法
	$.fn = {
		constructor: zepto.Z,
	    length: 0,

	    forEach: emptyArray.forEach,
	    reduce: emptyArray.reduce,
	    push: emptyArray.push,
	    sort: emptyArray.sort,
	    splice: emptyArray.splice,
	    indexOf: emptyArray.indexOf,

	    concat: function() {}
	}

	// 静态方法
	$.extend = function() {};

	// plugin compatibility
	$.uuid = 0
	$.support = {}
	$.expr = {}
	$.noop = function() {}

	// 其实下面有用的只是Z.prototype = $.fn (因为构造函数是Z, zepto.Z.prototype = $.fn其实没有用处...)
	zepto.Z.prototype = Z.prototype = $.fn
	return $
})()

window.Zepto = Zepto
window.$ === undefined && (window.$ = Zepto)