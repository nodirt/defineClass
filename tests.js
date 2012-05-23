var defineClass = require("./defineClass.js").defineClass,
    failed = false;

// micro unit test framework
function test(name, fn) {
  try {
    fn();
    console.log("Test '" + name + "' passed.")
  } catch (err) {
      console.log("Test '" + name + "' failed. ")
    failed = true;
    console.log(err.message);
    console.log(err.stack);
    console.log("------------------------------------------------------------------------");    
  }
}

function equal(a, b) {
  if (a !== b) {
    throw "Test failed";
  }
}

// utils
function generateClasses() {
  var classes = [], 
      trait;

  classes.push(defineClass({
    constructor: function () {
      this._field1 = 1;
    },
    item: function (param) {
      return param;
    },
    count: function () {
      return 1;
    }
  }));

  classes.push(defineClass({
    _super: classes[0],
    constructor: function () {
      this._super();
      this._field2 = 2;
    },
    item: function (param) {
      return this._super(param) + " derived";
    },
    method2: function (param) {
      return param + " in Clazz2";
    }
  }));

  classes.push(defineClass({
    _super: classes[1],
    method3: function () {
      return "method3";
    }
  }));

  trait = {
    mixedMethod: function () {
      return "mix";
    },
    item: function (param) {
      return this._super(param) + " mixed";
    }
  };
  classes.push(defineClass({
    _super: [classes[0], trait],
    normalMethod: function () {
      return "normal";
    }
  }));

  return classes;
}

function create(classIndex) {
  var Class = generateClasses()[classIndex];
  return new Class();
}


// tests
test("define a trivial class", function () {
  var instance = create(0);
  equal(instance._field1, 1);
  equal(instance.item("bar"), "bar");
});

test("class must match class.prototype.constructor", function () {
  var classes = generateClasses(defineClass),
      i;
  for (i = 0; i < classes.length; i++) {
    equal(classes[i], classes[i].prototype.constructor);
  }
});

test("inherit from a class", function () {
  var instance = create(1);
  equal(instance._field1, 1);
  equal(instance._field2, 2);
  equal(instance.item("bar"), "bar derived");
  equal(instance.method2("foo"), "foo in Clazz2");
});

test("inherit from a class with a base class", function () {
  var instance = create(2);
  equal(instance._field1, 1);
  equal(instance._field2, 2);
  equal(instance.item("bar"), "bar derived");
  equal(instance.method2("foo"), "foo in Clazz2");
  equal(instance.method3(), "method3");
});

test("apply a trait", function () {
  var instance = create(3);
  equal(instance._field1, 1);
  equal(instance.item("bar"), "bar mixed");
  equal(instance.mixedMethod(), "mix");
  equal(instance.normalMethod(), "normal");
});

test("generate a proxy", function () {
  var clazz = defineClass({
    foo: function () {
      this.bar = "bar";
    }
  });

  var proxyClass = defineClass.proxy(clazz),
      real = new clazz(),
      proxy = new proxyClass(real);

  equal(real.bar, undefined);
  proxy.foo();
  equal(real.bar, "bar");
});

if (!failed) {
  console.log("All tests passed");
}