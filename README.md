# JSONedtr

jQuery powered JSON editor for basic JSON editing on your web project

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [TODO](#todo)
- [Support](#support)
- [Contributing](#contributing)

## Demo

[JSONedtr demo on JSFiddle](https://jsfiddle.net/4te6bkma/2/)

## Installation

Just include `src/JSONedtr.css` and `src/JSONedtr.js` in your project after jQuery by putting following code into your code

```html
<script src="src/JSONedtr.js"></script>
<link rel="stylesheet" type="text/css" href="src/JSONedtr.css">
```

## Usage

#### Basic usage

##### Create element for the editor
```html
<div id="output"></div>
```

##### Initialize editor with your data
```js
$(document).ready(function(){
	var data = '{"first_key":"one","second_key":"two","third_key":{"one":"item 3-1","two":"item 3-2","three":"item 3-3"}}';
	new JSONedtr( data, '#output' );
});
```

#### Multiple instances

##### Create two elements for the editor
```html
<div id="output-1"></div>
<div id="output-2"></div>
```

##### Initialize editors with your data
```js
$(document).ready(function(){
	var data1 = '{"first_key":"one","second_key":"two","third_key":{"one":"item 3-1","two":"item 3-2","three":"item 3-3"}}';
	var foo = new JSONedtr( data1, '#output-1' );

	var data2 = '{"fourth_key":[1,2,3,4,5],"fifth_key":{"level_2":{"level_3":{"level_4":"item"}}}}';
	var bar = new JSONedtr( data2, '#output-2' );
});
```

#### Getting data

##### Create element for the editor
```html
<div id="output-1"></div>
<div id="output-2"></div>
```

##### Initialize editor with your data and work with it
```js
$(document).ready(function(){
	var data = '{"first_key":"one","second_key":"two","third_key":{"one":"item 3-1","two":"item 3-2","three":"item 3-3"}}';
	new JSONedtr( data, '#output' );

	// See your output in console (Ctrl+F12)
	var result1 = one.getData();
	console.log('Output of getData(): ', result1);

	var result2 = one.getDataString();
	console.log('Output of getDataString(): ', result2);
});
```

#### Getting data

##### List of configuration properties

* deleteDisabled (default: false) - If set true you can't remove items
* addDisabled (default: false) - If set true you can't add more items
* editKeyDisabled (default: false) - If set true all key/name-of-property input are disabled
* editValueDisabled (default: false) - If set true all value input are disabled
* careAboutType (default: false) - If set true the processor of get back the date put all value in a string, if set false it try to 'decode' the type of the value and put in the model with the right type (lazy mode)

##### Initialize editor with configuration
```js
$(document).ready(function(){
	var data = '{"first_key":"one","second_key":"two","third_key":{"one":"item 3-1","two":"item 3-2","three":"item 3-3"}}';
	new JSONedtr( data, '#output', {
		deleteDisabled: true,
		editKeyDisabled: true
	});

	// See your output in console (Ctrl+F12)
	var result1 = one.getData();
	console.log('Output of getData(): ', result1);
});
```
See provided example files and their code for more information

## TODO
* implement object and array creation from zero
* add different language support
* add support to reference type
* use SASS
* ~~dark theme~~ DONE
* minify code for production

## Support

Please [open an issue](https://github.com/LorincJuraj/JSONedtr/issues/new) for support.

## Contributing

New pull requests are encouraged and welcomed.

Please contribute using [Github Flow](https://guides.github.com/introduction/flow/). Create a branch, add commits, and [open a pull request](https://github.com/fraction/readme-boilerplate/compare/).
