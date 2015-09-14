# here-ssi

![](https://gw.alicdn.com/tps/TB1ffYbJXXXXXbNXFXXXXXXXXXX-1044-292.png_400x400.jpg)

[![NPM Version][npm-version-image]][npm-url]
[![NPM Downloads][npm-downloads-image]][npm-url]
[![MIT License][license-image]][license-url]

[![](https://nodei.co/npm/here-ssi.png)](https://npmjs.org/package/here-ssi)

这是一款小巧好用的Node本地服务，用起来非常简单，安装后，直接在要启用服务的目录执行命令行`here`即可，支持SSI和less、sass文件编译输出

by 拔赤

## 安装 

	sudo npm install -g here-ssi

## 使用

在你想要启动服务的目录中，执行`here`

## 高级用法

#### 指定端口 8888

	here -p 8888

或者

	here --port 8888

默认端口是 3000

#### 制定服务启动的跟路径

	here -d test

或者

	here --directory test

默认路径是 ./

#### 不要默认打开浏览器

	here -s

或者

	here --silent

#### 输出Log

	here -v

或者

	here --verbose


#### 监听文件修改，一旦修改就刷新页面

	here -w

或者

	here --watch

#### 更多支持

这里的服务支持SSI（服务器包含）

	<!--#include virtual="path/to/file.html" -->

这样会把外部文件给包含进来，这里的SSI支持引用一个线上资源

同时还支持`less`和`sass`文件的自动翻译，我访问一个`.css`文件，如果这个css文件不存在，则会自动查找对应的`.scss`和`.less`文件，并解析后返回

为了兼容阿里内部项目，还支持TMS的引用（非阿里内部项目不建议使用）：

	 <!--TMS:/rgn/mytaobao_bk.html:TMS-->  
	
或者

	<!--TMS:/rgn/mytaobao_bk.html,utf-8,41:TMS-->

此外还兼容 HTTP 标签使用

	<!--HTTP:http://****.html,(utf-8|gbk):HTTP-->

**注意**

本地服务返回的文本文件格式为utf-8，如果是gbk会自动转换为utf-8的文本输出

[npm-version-image]: http://img.shields.io/npm/v/here-ssi.svg?style=flat
[npm-url]: https://www.npmjs.com/package/here-ssi
[npm-downloads-image]: http://img.shields.io/npm/dm/here-ssi.svg?style=flat
[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: LICENSE
