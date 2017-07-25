Exility
-------
The language is based on the CSS-like syntax with JS and XHTML inserts.<br/>
<em>If you are familiar with Slim/Jade/Pug, then problems with understanding will not arise.</em>


---


### WARNING
The project is in active development and it can be collected only in one way:

 - `git clone git@github.com:artifact-project/exility.git`
 - `cd exility`
 - `npm i`
 - `npm run dev`
 - `npm test` — running all tests


---


### Quick start (todo)

 - `git clone git@github.com:artifact-project/exility/scaffold.git my-project-name`
 - `cd my-project-name`
 - `npm i`
 - `npm run init`



### Features

 - Flexible and easy syntax
 - Several compilation modes: `string`, `dom`
 - Isomorphic render
 - Compiling into a pure function without dependencies
 - Generating a minimum code with preliminary optimizations
 - [Storybook](./storybook) for development ui-blocks (Wrapper over the original [storybook](https://storybook.js.org/))
 - Testing out of the box, see [jacket](./jacket)
 - Ready UI libraries:
   - [ui-bootstrap](./ui-bootstrap)
 - Single ecosystem on TypeScript
 - Without slowly VirtualDOM
 - etc.


### Syntax

#### Basic

 - `.foo.bar` -> `<div class="foo bar"/>`
 - `h1.caption` -> `<h1 class="caption"/>`
 - `.welcome | Hi!` -> `<h2 class="welcome">Hi!</h2>`
 - `form[method="post"]` -> `<form method="post"/>`


#### Attributes

 - `input[type="text"][value="..."]` — css-like enumerable
 - `input[type="text" value="..."]` — space separated


#### Interpolation

 - className: `.is-${state}.${someClassName}`
 - tag + className: `${tagName}.is-${state}`
 - attributes: `form[method=${type} action="api/${method}"]`
 - text: `h1 | Hi, ${username}!`


#### Comments
```sass
// Bla-bla-bla
.text | ok
```


#### Multiline text
```sass
.text |>Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Aenean mattis at sapien elementum tempor.
Aliquam consequat egestas nisl quis pharetra.<|
```


#### HTML fragment
```sass
.main |# Click <a href="#next">me</a>. #|
```

---


#### Nesting and Adjacent sibling operator

##### `>` / Nesting

```sass
.panel
	.&-title > h1 | ${title}
	p.&-text | ${text}
```

&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;  :arrow_double_down:  :arrow_double_down:  :arrow_double_down:

```html
<div class="panel">
	<div class="panel-title"><h1>...</h1></div>
	<p class="panel-text">...</p>
</div>
```


##### `+` / Adjacent sibling operator

```sass
i.left + i.right
```

&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;  :arrow_double_down:  :arrow_double_down:  :arrow_double_down:

```html
<i class="left"></i><i class="right"></i>
```

---


#### Parent reference

```sass
.panel
	.&-title > .&-close + | Wow!
	.&-content | Bla-bla-bal
```

&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;  :arrow_double_down:  :arrow_double_down:  :arrow_double_down:

```html
<div class="panel">
	<div class="panel-title">
		<div class="panel-title-close"><div>
		Wow!
	</div>
	<p class="panel-content">Bla-bla-bal</p>
</div>
```


---


#### Parent reference and BEM modifiers

```sass
.button[class.&_${attrs.type}=${true}]
	| ${attrs.text}
```

&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;  :arrow_double_down:  :arrow_double_down:  :arrow_double_down:

```html
<div class="button button_primary">
	OK
</div>
```

---

#### Custom elements

```sass
// Define
btn = [text, type]
	button.btn[class.&_${attrs.type}=${true}]
		| ${text}

// Usage
btn[text="Continue"]
btn[text="Send" type="primary"]
```

&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;  :arrow_double_down:  :arrow_double_down:  :arrow_double_down:

```html
<button class="btn">Continue</div>
<button class="btn btn_primary">Send</div>
```

---

#### Custom elements + slots

##### Default slot
```sass
// Define
box = []
	.box > ::children // Call default

// Usage
box
	h2 | News
	p | ...
```

&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;  :arrow_double_down:  :arrow_double_down:  :arrow_double_down:

```html
<div class="box">
	<h2>News</h2>
	<p>...</p>
</div>
```

##### Multi slots
```sass
// Define
panel = []
	.&__head > ::head // Call slot
	.&__body > ::body

// Usage
panel
	// Define slot
	::head > h2 | Wow!
	::body > p | Bla-bla-bla...
```

&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;  :arrow_double_down:  :arrow_double_down:  :arrow_double_down:

```html
<div class="panel">
	<div class="panel__head"><h2>Wow!</h2></div>
	<div class="panel__body"><p>Bla-bla-bla...</p></div>
</div>
```

---


### Space around the tag

 - `a[<]` — before
 - `a[>]` — after
 - `a[<>]` — at both sides

```sass
p > img[<] + img[<>] + img[>]
```

&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;  :arrow_double_down:  :arrow_double_down:  :arrow_double_down:

```html
<p> <img/> <img/> <img/> </p>
```

---

### Development

 - `npm test` — run tests on all subprojects
 - `npm run release -- [major|minor|patch]` — publish the current version and put the tag
