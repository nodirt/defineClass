var defineClass = require("./defineClass.js").defineClass,
    failed = false,
    styles = {
      //styles
      'bold'      : ['\033[1m',  '\033[22m'],
      'italic'    : ['\033[3m',  '\033[23m'],
      'underline' : ['\033[4m',  '\033[24m'],
      'inverse'   : ['\033[7m',  '\033[27m'],
      //grayscale
      'white'     : ['\033[37m', '\033[39m'],
      'grey'      : ['\033[90m', '\033[39m'],
      'black'     : ['\033[30m', '\033[39m'],
      //colors
      'blue'      : ['\033[34m', '\033[39m'],
      'cyan'      : ['\033[36m', '\033[39m'],
      'green'     : ['\033[32m', '\033[39m'],
      'magenta'   : ['\033[35m', '\033[39m'],
      'red'       : ['\033[31m', '\033[39m'],
      'yellow'    : ['\033[33m', '\033[39m']
    };

(function () {
  var name;
  for (name in styles) {
    styles[name] = (function (value) {
      function wrap(str) {
        return value[0] + str + value[1];
      }
      wrap[0] = value[0];
      wrap[1] = value[1];
      return wrap;
    })(styles[name]);
  }
})();

// micro unit test framework
function test(name, fn) {
  try {
    fn();
    console.log(styles.green("pass") + ": " + name)
  } catch (err) {
    console.log(styles.red("------------------------------------------------------------------------"));
    if (err instanceof Error) {
      console.log(err.message);
      if (err.stack) {
        console.log(err.stack);
      }
    } else {
      console.log(err);
    }
    console.log(styles.red("FAIL: " + name));
    process.exit(1);
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

test("apply a trait to a base class", function () {
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

test("apply a trait to a class", function () {
  var T = defineClass.trait({
    tm: function () {
      return "mix";
    },
    m: function (p) {
      return this._super(p) + " mixed";
    }
  });

  var A = defineClass({
    $: T,
    m: function (p) {
      return p;
    }
  });

  var a = new A();
  equal(a.m("v"), "v mixed");
  equal(a.tm(), "mix");
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

test("inherit from a proxy", function () {
  var A = defineClass({
    constructor: function (f) {
      this.f = f;
    },

    m: function (){
      return this.f;
    }
  });

  var B = defineClass({
    _super: defineClass.proxy(A),
    m: function () {
      return this._super() * 2;
    }
  });

  var a = new A(8);
  var b = new B(a);
  equal(b.m(), 16);
});

test("apply a proxy trait", function () {
  var A = defineClass({
    m: function (){
      return 1;
    }
  });

  var B = defineClass({
    _super: defineClass.proxyTrait(A, "_a"),
    constructor: function () {
      this._a = new A();
    }
  });

  equal(new B().m(), 1);
});

test("override nested class", function () {
  var A = defineClass({
    N: defineClass({
      m: function () {
        return 1;
      }
    }),

    n: function () {
      return new this.N().m();
    }
  });

  var B = defineClass({
    _super: A,
    N: {
      m: function () {
        return this._super() * 2;
      }
    }
  });

  var a = new A();
  equal(a.n(), 1);

  var b = new B();
  equal(b.n(), 2);
});

test("apply a class decorator", function () {
  function classDecorator(proto) {
    var proto = Object.create(proto);
    proto.f = 1;
    return proto;
  }

  var A = defineClass({
    $: classDecorator,
    m: function () {
      return 2;
    }
  });

  var a = new A();
  equal(a.f, 1);
  equal(a.m(), 2);
});

test("apply a method decorator", function () {
  var info;

  function suppressError(fn, memberInfo) {
    info = memberInfo;
    return function () {
      try {
        return fn.apply(this, arguments);
      } catch (err) {
        return "err";
      }
    };
  }

  var A = defineClass({
    m$: suppressError,
    f: 1,
    m: function () {
      throw new Error();
    }
  });

  if (!info || info.name != "m" || info.parent.f !== 1) {
    throw "Member info expected. Got: " + info;
  }

  var a = new A();
  equal(a.m(), "err");
});

test("apply a nested class decorator", function () {
  var A = defineClass({
    N: defineClass({
      m: function () {
        throw new Error();
      }
    }),

    n: function () {
      return new this.N().m();
    }
  });

  var T = defineClass.trait({
    m: function () {
      try {
        return this._super();
      } catch (err) {
        return "err";
      }
    }
  });

  var B = defineClass({
    _super: A,
    N$: T
  });

  var b = new B();
  equal(b.n(), "err");
});

console.log("All tests passed");
