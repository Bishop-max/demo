/**
 * 数据代理模型
 * 相当于VUE的构造函数
 * @param {Object} options
 */
function MVVM(options){
	//将配置对象保存到vm
	this.$options = options
	//将data对象保存到vm对象和变量data
	var data = this._data = this.$options.data;
	
	//遍历data的每个属性
	Object.keys(data).forEach((key) =>{
		//实现指定属性的数据代理
		this._proxy(key);
	});
	//对data中所有层次属性实现劫持/监视
	observe(data,this)
	
	//创建用于编译模板的对象
	this.$compile = new Compile(options.el || document.body,this)
}

MVVM.prototype = {
	$watch:function(key,cb,options){
		new Watcher(this,key,cb)
	},
	
	_proxy:function(key){
		var that = this;
		//给vm定义指定属性名的属性
		Object.defineProperty(that,key,{
			configurable:false,//不可重新定义
			enumerable:true,//可以枚举遍历
			//当vm.name读取数据时自动调用
			get:function proxyGetter(){
				//读取并返回data中对应的属性值
				return that._data[key];
			},
			//当vm.name = value设置数据时自动调用
			set:function proxySetter(newVal){
				//将最新的值保存到data对应的属性上
				that._data[key] = newVal;
			}
		})
	}
}