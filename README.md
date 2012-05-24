defineClass
===========
Simple yet powerful OOP and AOP for JavaScript
----------------------------------------------

### Quick start
Defining a class is as simple and declarative as this:

```js
var Person = defineClass({
  // define default field value
  cash: 0,

  // define a constructor
  constructor: function (firstName, lastName) {
    this.firstName = firstName;
    this.lastName = lastName;
  },

  // define a method
  greet: function (name) {
    console.log("Hello " + name + ". My name is " + this.firstName);
  }
});

var Developer = defineClass({
  // inherit from a class
  _super: Person,

  // override a field default value
  cash: 100,

  // override the constructor
  constructor: function (firstName, lastName, language) {
    // call the base constructor
    this._super(firstName, lastName);
    this.language = language;
  }

  // override a method
  greet: function (name) {
    console.log("Hey, " + name + ". I'm " + this.firstName)
  },

  // override a method and call its base method
  earn: function (amount) {
    return this._super(amount * 1.2);
  }
});
```

### Installation

```
$ npm install defineClass
```

### Contents:
<ol>

    <li style="line-height: 4px"><a href="#classes">Classes</a>
        <ol>
            <li><a href="#default-field-values">Default field values</a></li>
            <li><a href="#inheritance">Inheritance</a>
                <ol>
                    <li><a href="#overriding-methods-and-calling-base-methods">Overriding methods and calling base methods</a></li>
                    <li><a href="#overriding-default-field-values">Overriding default field</a></li>
                </ol>
            </li>
            <li><a href="#proxy-classes">Proxy classes</a></li>
            <li><a href="#nested-classes">Nested classes</a>
                <ol>
                    <li><a href="#nested-class-overriding">Nested class overriding</a>
                </ol>
            </li>
        </ol>
    </li>

    <li style="line-height: 4px"><a href="#traits">Traits</a>
        <ol>
            <li><a href="#applying-a-trait">Applying a trait</a></li>
            <li><a href="#calling-class-methods-in-traits">Calling class methods in traits</a></li>
            <li><a href="#overriding-base-class-methods-with-traits">Overriding base class methods with traits</a></li>
            <li><a href="#a-trait-can-import-other-traits">A trait can import other traits</a></li>
            <li><a href="#trait-is-a-function">Trait is a function</a></li>
            <li><a href="#trait-order-in-_super">Trait order in _super</a></li>
            <li><a href="#method-delegation-using-proxy-traits">Method delegation using proxy traits</a></li>
        </ol>
    </li>

</ol>

Classes
-------

`defineClass` receives a class prototype and creates a generated a class. 
The special `constructor` method is treated as a class constructor;

```js
var Person = defineClass({
  constructor: function (firstName, lastName) {
    this.firstName = firstName;
    this.lastName = lastName;
  },

  greet: function (name) {
    console.log("Hello " + name + ". My name is " + this.firstName);
  } 
});

var p = new Person("John", "Doe");
p.greet("Nick"); // Hello Nick. My name is John
assert(p instanceof Person);
```

### Default field values
If a field has an immutable default value, it can be included in the prototype.

```js
var Person = defineClass({
  cash: 0, // define a default value

  constructor: function (firstName, lastName) {
    this.firstName = firstName;
    this.lastName = lastName;
  },

  greet: function (name) {
    console.log("Hello " + name + ". My name is " + this.firstName);
  },

  earn: function (amount) {
    this.cash += amount;
    return this.cash;
  }
});

var p = new Person("John", "Doe");
assert(this.cash === 0);
p.earn(1000);
assert(this.cash === 1000);
```

### Constructor is optional

Here is the minimal class definition:

```js
var MinimalClass = defineClass({});
```

### Inheritance

A special `_super` field in a prototype is reserved for inheritance and can reference a base class.

A subclass inherits the members of its base class. It is not required to re-define the constructor in a prototype.

```js
var Boss = defineClass({
  // derive Boss from Person
  _super: Person,

  // a new method
  playGolf: function () {
    console.log("Playing golf...");
  }
});

var boss = new Boss("Robert", "Roe"); // base constructor is called
boss.playGolf(); // Playing golf...

assert(b instanceof Person);
assert(b instanceof Boss);
```

#### Overriding methods and calling base methods

Members in a subclass override the base members of the same name. To call a base method, call the special `this._super` method.
It applies to constructors too.

```js
var Developer = defineClass({
  _super: Person,

  // override the constructor
  constructor: function (firstName, lastName, language) {
    // you may have code before the base constructor call

    // call the base constructor
    this._super(firstName, lastName);
    this.language = language;
  }

  // override a method
  greet: function (name) {
    console.log("Hey, " + name + ". I'm " + this.firstName)
  },

  // override a method and call its base method
  earn: function (amount) {
    return this._super(amount * 1.2);
  }
});

var dev = new Developer("Jane", "Doe", "Python");
dev.earn(100);
assert(dev.cash === 220); // += 100 * 1.2
dev.greet("Nick"); // Hey Nick. I'm Jane
```

The `_super` field value changes from method call to method call, so it may be used only in the method that has overridden the base method. 
Do not use it in a nested function unless you know what you are doing.

#### Overriding default field values

You can not only override methods but default field values as well.

```js
var King = defineClass({
  _super: Person,

  // override a field default value
  cash: Infinity
});

var king = new King("Islam", "Karimov");
assert(king.cash === Infinity);
```

### Proxy classes

`defineClass.proxy` function generates a proxy class based on another class or a list of methods.

```js
defineClass.proxy(class, fieldName="_real")
defineClass.proxy(methodNameArray, fieldName="_real")
```

Parameters `class` and `methodNameArray` specify method names to define in the proxy class.

Parameter `fieldName` specifies a name of a field where the instance with a real implementation is stored.

```js

var PersonProxy = defineClass.proxy(Person);
var anna = new Person("Anna", "Litau");
var proxy = new PersonProxy(anna);
proxy.greet("Nodir"); // Hi Nodir. My name is Anna.
```

### Nested classes

When a monolithic method of a class gets too complex and you do not want to pollute the class with a bunch of new methods
that are used only in one place, it is convenient to implement method's functionality as a nested class.

```js
var Foo = defineClass({
  // define a nested class
  Bar: defineClass({
    baz: function (x) {
      return x * x;
    },
    compute: function () {
      return this.baz(2) + this.baz(3);
    }
  }),

  bar: function () {
    var bar = new this.Bar(); // we write "new this.Bar" because it is located in the Foo.prototype
    return bar.compute();
  }
});

var foo = new Foo();
assert(foo.bar() === 2 * 2 + 3 * 3);
```

#### Nested class overriding

Since `Bar` is a member of Foo, a class derived from Foo can override it:

```js
// derive from Foo
var Foo2 = defineClass({
  _super: Foo,

  // inherit from the Foo.prototype.Bar and override its members
  Bar: {
    baz: function (x) {
      return x * 5;
    }
  }
});

var foo = new Foo2();
assert(foo.bar() === 2 * 5 + 3 * 5);
```

Note that:

1. The bar method creates a Bar class instance as `new this.Bar()`. This is flexible because `this.Bar` can be overridden in a subclass.
2. Since the `Bar` class is _overridden_ in the `Foo2`, it is unnecessary to override the `bar` method.

In the fact the above code is a syntax sugar and is expanded to

```js
var Foo2 = defineClass({
  _super: Foo,

  // override a nested class
  Bar: defineClass({
    _super: Foo.prototype.Bar,
    compute: function () {
      return this.qux * 4;
    }
  })
});

var foo2 = new Foo2();
assert(foo2.bar() === 4);
```

Traits
------

Traits allow you to keep common functionality of different class hierarchies in a separate object called _trait_.
A trait recalls an interface in .NET/Java, does not have a constructor and cannot be instantiated.
Multiple traits can be applied to a class. The difference with interfaces is that traits have implementation.

### Applying a trait
When a class imports a trait, all trait's members are imported into the class. 
To imoprt a trait put it into an array together with a base class (if any). You can put as many traits in `_super` as you want.

```js
var MusicFan = defineClass.trait({
  listenMusic: function () {
    console.log("$ mpg321 -B ~/music");
  }
});

var Developer = defineClass({
  _super: [Person, MusicFan]
  // other methods
});

var jane = new Developer("Jane", "Doe", "Python");
jane.listenMusic();
```

In fact, the above definition is equivalent to:

```js
var tempClass = defineClass({
  _super: Person,
  listenMusic: function () {
    console.log("$ mpg321 -B ~/music");
  }
});

var Developer = defineClass({
  _super: tempClass
  // other methods
});
```

This transformation is called [type linearization] and was borrowed from [Scala] programming language. 
In fact trait application works the same way as class inheritance. 

### Calling class methods in traits
Since trait methods are called in the context of a class instance, a trait can call class methods as they are a part of the trait definition.

```js
// define a trait
var GreetEverybody = defineClass.trait({
  greetEverybody: function () {
    // this trait assumes that the classes that apply it, contain a "greet" method
    this.greet("everybody");
  }
});

// inherit from a class and mix a trait in
var Boss = defineClass({
  _super: [Person, GreetEverybody], // inherit from Person and apply GreetEverybody
  // other methods
});

var b = new Boss("Robert", "Roe");
// call a trait method
b.greetEverybody(); // Hello, everybody. My name is Robert Roe.
```

### Overriding base class methods with traits

A trait method can override a base method and call it as `this._super`:

```js
var HowAreYou = defineClass.trait({
  greet: function (name) {
    // call a method that will be overridden
    this._super(name);
    console.log("How are you?")
  }
});

var Chatty = defineClass({
  _super: [Person, HowAreYou],
  // other methods
});
var c = new Chatty("John", "Doe");
c.greet("Bob");
// Output:
//   Hello, Bob. My name is John Doe.
//   How are you?
```

This powerful technique allows implementing behavior aspects as traits and apply them to different classes.

### A trait can import other traits

Traits can import other traits by specifying them in the `_super` field:

```js
var VerboseGreet = defineClass.trait({
  _super: HowAreYou,
  greet: function (name) {
    this._super(name);
    console.log("The wheather is nice today, isn't it?")
  }
});

var Chatty = defineClass({
  _super: [Person, VerboseGreet]
})

var chatty = new Chatty("John", "Doe");
chatty.greet("Bob");
// Output:
//   Hello, Bob. My name is John Doe.
//   How are you?
//   The wheather is nice today, isn't it?
```

### Trait is a function

A trait itself is a function that receives a class/prototype/trait, applies itself to it and returns the result.

```js
var Boss = GreetEverybody(Person);
var b = new Boss("Robert", "Roe");
// call a trait method
b.greetEverybody(); // Hello, everybody. My name is Robert Roe.
```

Another way to apply a trait is to call the `decorate` method of a class/trait that applies all argument functions to the itself:

```js
var NiceWheather = defineClass.trait({
  greet: function (name) {
    this._super(name);
    console.log("The wheather is nice today, isn't it?")
  }
});

var Boss = Person.decorate(GreetEverybody);
var Boss2 = Person.decorate(GreetEverybody, NiceWheather);

var VerboseGreet = HowAreYou.decorate(NiceWheather); // the same as above
```

### Trait order in _super
The order of traits in the `_super` array is important because it controls the trait application order:

```js
var ChattyPerson = Person.decorate(HowAreYou, NiceWheather);
var john = new ChattyPerson("John", "Doe");
john.greet("Bob");
// Output:
//   Hello, Bob. My name is John Doe.
//   How are you?
//   The wheather is nice today, isn't it?

var ChattyPerson2 = Person.decorate(NiceWheather, HowAreYou); //  <--- different order of traits
var john = new ChattyPerson("John", "Doe");
john.greet("Bob");
// Output:
//   Hello, Bob. My name is John Doe.
//   The wheather is nice today, isn't it?            <--- the order
//   How are you?                                     <--- has changed
```

ChattyPerson1 and ChattyPerson2 classes apply the traits in different order and so the order of printed lines has changed.

### Method delegation using proxy traits

`defineClass.proxyTrait` function works like `defineClass.proxy` but instead of generating a class, it generates a trait.
A proxy trait allows you to easily define a class that delegates its functionality to some other objects stored in its fields.


```js
var Foo = defineClass({
  doFoo: function () { /*...*/ }
});

var Bar = defineClass({
  doBar: function () { /*...*/ }
});

var Qux = defineClass({
  _super: [
    defineClass.proxyTrait(Foo, "_foo"),
    defineClass.proxyTrait(Bar, "_boo")
  ],

  constructor: function () {
    this._foo = new Foo();
    this._bar = new Bar();
  }
});

var qux = new Qux();
qux.doFoo();
qux.doBar();
```

Here `defineClass.proxyTrait` calls return traits with methods `doFoo` and `doBar`. 
A method takes an object from the specified field (_foo, _bar) and calls its method of the same name.

[type linearization]: http://jim-mcbeath.blogspot.com/2009/08/scala-class-linearization.html]
[Scala]: http://scala-lang.org/