# defineClass - simple yet powerful OOP and AOP for JavaScript

Besides [classic OOP](https://github.com/nodirt/defineClass/wiki/Classes) **defineClass** has:

1. [Traits](https://github.com/nodirt/defineClass/wiki/Traits) from [Scala](http://www.scala-lang.org/node/126)
2. [Decorators](https://github.com/nodirt/defineClass/wiki/Decorators) from [Python](http://en.wikipedia.org/wiki/Python_syntax_and_semantics#Decorators)
3. [Nested class overriding](https://github.com/nodirt/defineClass/wiki/Nested-classes)
4. [Proxy class](https://github.com/nodirt/defineClass/wiki/Proxy-classes) and 
   [trait](https://github.com/nodirt/defineClass/wiki/Proxy-traits) generation.    

## Quick start
This is a quick start. Detailed explanations are in the [wiki](https://github.com/nodirt/defineClass/wiki).

### Defining a class
```js
// define a class
var Device = defineClass({
  // define a default variable name
  hasBattery: false,

  // define a constructor
  constructor: function (ram) {
    this.ram = ram;
  },

  // define a method
  turnOn: function () {
    console.log("Turning on...");
  }
});
```

### Defining a subclass

```js
// define a subclass
var Phone = defineClass({
  // specify the base class
  _super: Device,

  // override a constructor
  constructor: function (ram, number) {
    // you may have code before calling the base constructor
    this.number = number;
    // call the base contructor
    this._super(ram);
  },

  // override a method
  turnOn: function () {
    // call the base method
    this._super();
    console.log("Playing sound...");
  },

  // define a new method
  dial: function (number) {
    console.log("Dialing to " + number);
  }
});
```

### Applying a trait

```js
// define a trait
var TurnOnWithSplash = defineClass.trait({
  // override "turnOn" method
  turnOn: function () {
    // call the base "turnOn"  
    this._super();
    console.log("Showing splash...");
  }
}); 

// apply a trait to a class
var Smartphone = defineClass({
  _super: [Phone, TurnOnWithSplash]
  // other methods
});
var phone = new Smartphone(1000, "120-1010");
phone.turnOn();
// Output:
//   Turning on...
//   Playing sound...
//   Showing splash...
```

You can use the same trait in different class hierarchies. 
Read more about traits [here](https://github.com/nodirt/defineClass/wiki/Traits).

### Decorating

```js
// define a decorator that adds function call logging
var logging = defineClass.decorator(function (func, info) {
  return function() {
    console.log("Entering " + info.name);
    try {
      return func.apply(this, arguments);
    } finally {
      console.log("Exiting " + info.name);
    }
  };
});

// apply the decorator to all methods
var Phone = defineClass({
  _super: Device,
  // apply the decorator to all methods
  $: logging,

  dial: function (number) {
    console.log("Dialing to " + number);
  }
});

var phone = new Phone();
phone.dial("120-0000");
// Output:
//   Entering dial
//   Dialing to 120-0000
//   Exiting dial
```

Read more about decorators [here](https://github.com/nodirt/defineClass/wiki/Decorators).

## Installation

```bash
$ npm install defineClass
```