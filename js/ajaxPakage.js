function myAjax(obj){
	const baseURL = "http://123.207.32.32:8000/api/v1"
	let xmlhttp;
	//创建XML HttpRequest 对象
	if(window.XMLHttpRequest){
		xmlhttp = new XMLHttpRequest();
	}else{
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	//发送请求
	if(obj.type.toUpperCase()==="GET"){
		xmlhttp.open("GET",baseURL+obj.url,true);
		xmlhttp.send();
	}else{
		xmlhttp.open("GET",baseURL,true);
		xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		xmlhttp.send(obj.url);
	}
	//监听状态码的变化
	xmlhttp.onreadystatechange=function()
	  {
	  if (xmlhttp.readyState===4) {
			if(xmlhttp.status >= 200 && xmlhttp.status < 300 || xmlhttp.status === 304)
	    {
				//获取服务器响应
				obj.success(JSON.parse(xmlhttp.responseText));
	    }else{
				obj.err(JSON.parse(xmlhttp.responseText));
			}
	  }
		}
		
	
}