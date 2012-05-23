var defineClass = require("./defineClass.js").defineClass,
    failed = false;

// micro unit test framework
function test(name, fn) {
  try {
    fn();
    console.log("pass: " + name)
  } catch (err) {
    failed = true;
    if (err instanceof Error) {
      console.log(err.message);
      console.log(err.stack);
    } else {
      console.log(err);
    }
    console.log("FAIL: " + name)
    console.log("------------------------------------------------------------------------");    
  }
}

function equal(a, b) {
  if (a !== b) {
    throw a + " != " + b;
  }
}

// tests
test("define a class", function () {
  var A = defineClass({
    f: 1,
    constructor: function () {
      this.f2 = 2;
    },
    m: function (p) {
      return p;
    }
  });

  var a = new A();
  equal(a.f, 1);
  equal(a.f2, 2);
  equal(a.m("s"), "s");
});

test("class must match class.prototype.constructor", function () {
  var A = defineClass({
    constructor: function () {}
  });
  equal(A, A.prototype.constructor);

  var Empty = defineClass({});
  equal(Empty, Empty.prototype.constructor);
});

test("inherit from a class", function () {
  var A = defineClass({
    constructor: function () {
      this.f = 1;
    },
    m: function (p) {
      return p;
    }
  });

  var B = defineClass({
    _super: A,
    constructor: function () {
      this._super();
      this.f2 = 2;
    },
    m: function (p) {
      return this._super(p) + " in B";
    },
    m2: function (p) {
      return p + " in B";
    }
  });

  var b = new B();
  equal(b.f, 1);
  equal(b.f2, 2);
  equal(b.m("s"), "s in B");
  equal(b.m2("s"), "s in B");
});

test("inherit from a class with a base class", function () {
  var A = defineClass({
    constructor: function () {
      this.f = 1;
    },
    m: function (p) {
      return p;
    }
  });

  var B = defineClass({
    _super: A,
    m2: function (p) {
      return p + " in B";
    }
  });

  var C = defineClass({
    _super: B,
    m3: function () {
      return "c";
    }
  });

  var c = new C();
  equal(c.f, 1);
  equal(c.m(1), 1);
  equal(c.m2("s"), "s in B");
  equal(c.m3(), "c");
});

test("mix a trait", function () {
  function testB(B, inB) {
    var b = new B();
    equal(b.f, 1);
    equal(b.tm(), "mix");
    equal(b.m("x"), "x mixed" + (inB ? " in B": ""));
  }
  var A = defineClass({
    constructor: function () {
      this.f = 1;
    },
    m: function (p) {
      return p;
    }
  });

  var T = defineClass.trait({
    tm: function () {
      return "mix";
    },
    m: function (p) {
      return this._super(p) + " mixed";
    }
  });

  testB(T(A));
  testB(A.decorate(T));
  testB(defineClass({
    _super: [A, T],
    m: function (p) {
      return this._super(p) + " in B";
    }
  }), true);

  var T2 = defineClass.trait({
    tm: function () {
      return this._super() + this._super();
    }
  });

  var B = A.decorate(T, T2);
  var b = new B();
  equal(b.tm(), "mixmix");
});

test("implement a trait in a trait", function () {
  var trait1 = defineClass.trait({
    bar: true,
    foo: function () {
      return 1;
    }
  });

  var trait2 = defineClass.trait({
    _super: trait1,
    bar: false,
    foo: function () {
      return this._super() * 2;
    }
  });

  var clazz = defineClass({
    _super: trait2,
    foo: function () {
      return this._super() * 2;
    }
  });

  equal(clazz.prototype.bar, false);
  equal(new clazz().foo(), 4);

  clazz = defineClass({ _super: trait2(trait1) });
  equal(new clazz().foo(), 2);  

  clazz = defineClass({ _super: trait1.decorate(trait2) });
  equal(new clazz().foo(), 2);  

  clazz = defineClass({ _super: trait2.decorate(trait1) });
  equal(new clazz().foo(), 1);
});

test("generate a proxy", function () {
  var A = defineClass({
    m: function () {
      this.f = "s";
    }
  });

  var P = defineClass.proxy(A),
      a = new A(),
      p = new P(a);

  equal(a.f, undefined);
  p.m();
  equal(a.f, "s");
});

if (!failed) {
  console.log("All tests passed");
}