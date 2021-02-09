function Compile(el,vm){
	//保存vm
	this.$vm = vm
	//保存el
	//function isElementNode
	this.$el = this.isElementNode(el) ? el : document.querySelector(el);
	//如果el元素存在
	if(this.$el){
		//function node2Fragment
		//1.将el中所有子节点转移到fragment对象中
		this.$fragment = this.node2Fragment(this.$el);
		//function init
		//2.编译fragment所有层次（递归）子节点
		this.init();
		//3.将编译好的fragment添加到el中
		this.$el.appendChild(this.$fragment);
	}
}

Compile.prototype = {
	node2Fragment:function (el){
		var fragment = document.createDocumentFragment(),
				child;
		//将原生节点拷贝到fragment
		while(child = el.firstChild){
			fragment.appendChild(child)
		}
		
		return fragment;
	},
	//编译fragment中的子节点
	init:function(){
		this.compileElement(this.$fragment);
	},
	compileElement:function(el){
		//得到最外层所有子节点
		var childNodes = el.childNodes,
				that = this;
		[].slice.call(childNodes).forEach(function(node){
			//得到节点的文本内容
			var text = node.textContent;
			//用于匹配插值的正则对象
			var reg = /\{\{(.*)\}\}/;
			//如果是元素节点
			if(that.isElementNode(node)){
				//编译元素节点中指令属性
				that.compile(node);
			//如果是插值格式的文本节点
			}else if (that.isTextNode(node) && reg.test(text)){
				//编译包含插值的文本节点
				that.compileText(node,RegExp.$1);//name
			}
			
			if(node.childNodes && node.childNodes.length){
				that.compileElement(node)
			} 
		}); 
	},
	compile:function(node){
		//得到所有属性节点
		var nodeAttrs = node.attributes,
				that = this;
		//遍历所有属性
		[].slice.call(nodeAttrs).forEach(function (attr){
			//得到属性名：v-on:click
			var attrName = attr.name;
			//是否是指令属性
			if(that.isDirective(attrName)){
				//得到属性值/表达式：changeName
				var exp = attr.value;
				//得到指令名：on:click
				var dir = attrName.substring(2);
				//如果是事件指令
				if(that.isEventDirective(dir)){
					//处理事件指令
					compileUtil.eventHandler(node,that.$vm,exp,dir);
					//处理普通指令
				}else{
					compileUtil[dir] && compileUtil[dir](node,that.$vm,exp);
				}
				//移除指令属性
				node.removeAttribute(attrName)
			}
		});
	},
	compileText:function(node,exp){
		//编译工具对象编译文本节点
		compileUtil.text(node,this.$vm,exp);
	},
	
	isDirective:function(attr){
		return attr.indexOf('v-') == 0;
	},
	isEventDirective:function(dir){
		return dir.indexOf('on') === 0;
	},
	isElementNode:function(node){
		return node.nodeType == 1;
	},
	isTextNode:function(node){
		return node.nodeType == 3;
	}
};

//指令处理集合
/**
 * 包含多个用于编译指令、插值的工具方法的对象
 */
var compileUtil = {
	/*
	编译插值/v-text
	*/
	text:function(node,vm,exp){
		this.bind(node,vm,exp,'text');
	},
	/**编译v-html
	 * @param {Object} node
	 * @param {Object} vm
	 * @param {Object} exp
	 */
	html:function(node,vm,exp){
		this.bind(node,vm,exp,'html');
	},
	/**编译v-model
	 * @param {Object} node
	 * @param {Object} vm
	 * @param {Object} exp
	 */
	model:function(node,vm,exp){
		this.bind(node,vm,exp,'model');
		
		var that = this,
				val = this._getVMVal(vm,exp);
		node.addEventListener('input',function(e){
			var newVal = e.target.value;
			if(val === newVal){
				return;
			}
			
			that._setVMVal(vm,exp,newVal);
			val = newVal;
		});
	},
	/**编译v-class
	 * @param {Object} node
	 * @param {Object} vm
	 * @param {Object} exp
	 */
	class:function(node,vm,exp){
		this.bind(node,vm,exp,'class');
	},
	/**真正编译模板语法的方法
	 * @param {Object} node
	 * @param {Object} vm
	 * @param {Object} exp	表达式 name
	 * @param {Object} dir	指令 text
	 */
	bind:function(node,vm,exp,dir){
		//根据指令名得到对应更新节点的函数
		var updaterFn = updater[dir + 'Updater'];
		//执行更新函数第一次更新节点 ==> 初始化显示
		updaterFn && updaterFn(node,this._getVMVal(vm,exp));
		
		//为当前表达式/节点创建一个对应的订阅者/watcher
		new Watcher(vm,exp,function(value,oldValue){//用于更新节点的回调函数
			//更新对应的节点
			updaterFn && updaterFn(node,value,oldValue);
		})
	},
	/**事件处理
	 * @param {Object} node
	 * @param {Object} vm
	 * @param {Object} exp 表达式 changeName
	 * @param {Object} dir 指令名 on:click
	 */
	eventHandler:function(node,vm,exp,dir){
		//得到事件名/类型
		var eventType = dir.split(':')[1],
				//根据表达式去methods中取到对应的事件处理函数
				fn = vm.$options.methods && vm.$options.methods[exp];
		
		if(eventType && fn){
			//给元素节点绑定指定事件名和回调函数的DOM事件监听 指定fn中的this是vm
			node.addEventListener(eventType,fn.bind(vm),false);
		}
	},
	_getVMVal:function(vm,exp){
		var val = vm._data;
		exp = exp.split('.');
		exp.forEach(function(k){
			val = val[k];
		});
		return val;
	},
	_setVMVal:function(vm,exp,value){
		var val = vm._data;
		exp = exp.split('.');
		exp.forEach(function(k,i){
			//非最后一个key，更新val的值
			if(i<exp.length-1){
				val = val[k];
			}else{
				val[k] = value;
			}
		});
	}
};
/**
 * 包含N个用于DOM更新节点的方法的对象
 */
var updater ={
	//更新节点的textContent
	textUpdater:function(node,value){
		node.textContent = typeof value == 'undefined' ? '' : value;
	},
	//更新节点的innerHTML
	htmlUpdater:function(node,value){
		node.innerHTML = typeof value == 'undefined' ? '' : value;
	},
	//更新节点的属性名
	classUpdater:function(node,value,oldValue){
		var className = node.className;
		className = className.replace(oldValue,'').replace(/\s$/,'');
		var space = className && String(value) ? ' ' : '';
		node.className = className + space + value;
	},
	////更新节点的value
	modelUpdater:function(node,value,oldValue){
		node.value = typeof value == 'undefined' ? '' : value;
	}
}