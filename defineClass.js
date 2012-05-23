(function (exports) {
  "use strict"
  var methodTest = /resig/.test(function(){resig;}) ? /\b_super\b/ : /.*/;

  function isFunc(fn) {
    return typeof fn === "function";
  }
  function isArray(array) {
    return array instanceof Array;
  }

  // creates a new object with baseObj as prototype.
  function derive(baseObj) {
    var result, clazz;
    if (Object.create) {
      try {
        result = Object.create(baseObj);
      } catch (err) {
        result = null;
      }
    }

    if (!result) {
      clazz = function () {};
      clazz.prototype = baseObj;
      result = new clazz();
    }
    return result;
  }

  function applyAll(funcs, arg) {
    var i;
    for (i = 0; i < funcs.length; i++) {
      if (isFunc(funcs[i])) {
        arg = funcs[i](arg) || arg;
      }
    }
    return arg;
  }
  function pipeline(decorator) {
    return applyAll(arguments, this);
  }

  // derives a prototype from another one, inherits/overrides methods and nested classes
  function inherit(superPrototype, subPrototype) {
    function overrideMethod(superMethod, method) {
      return function () {
        var origSuper = this._super,
            result;
        this._super = superMethod;
        result = method.apply(this, arguments);
        this._super = origSuper;
        return result;
      };
    }

    var overriddenConstructor = false,
        newPrototype = derive(superPrototype),
        p, member, baseMember;

    for (p in subPrototype) {
      if (p === "constructor") {
        overriddenConstructor = true;
      }
      member = subPrototype[p];
      baseMember = superPrototype[p];
      if (isFunc(member)) {
        if (isFunc(baseMember) && !member.isClass && methodTest.test(member)) {
          member = overrideMethod(baseMember, member);
        }
      } else if (member && typeof member === "object" && baseMember.isClass) {
        member = derive(member);
        member._super = baseMember;
        member = defineClass(member);
      }
      newPrototype[p] = member;
    }

    // IE omits "constructor" property in a for loop if it belongs to the object and not to its prototype.
    if (!overriddenConstructor && Object.prototype.hasOwnProperty.call(subPrototype, "constructor") && isFunc(superPrototype.constructor)) {
      newPrototype.constructor = overrideMethod(superPrototype.constructor, subPrototype.constructor);
    }

    return newPrototype;
  }

  function compileProto(prototype) {
    var sup = prototype._super,
        i, proto;
    delete prototype._super;

    if (sup) {
      sup = isArray(sup) ? sup.slice() : [sup];
      sup.push(prototype);
      prototype = null;
      for (i = 0; i < sup.length; i++) {
        proto = sup[i];
        if (isFunc(proto)) {
          proto = proto.isTrait ? proto.def : proto.prototype;
        }
        prototype = prototype ? inherit(prototype, proto) : proto;
      }
    }

    return prototype;
  }


  // Makes a class based on a prototype and its _super field value
  // Simple example:
  //   var Person = defineClass({
  //     lovesMusic: true,
  //     constructor: function(name) {
  //       this.name = name;
  //     },
  //     greet: function () {
  //       console.log("Hi, I'm " + this.name);
  //     }
  //   });
  // var person = new Person("Anna");
  // assert(person.name === "Anna" && person.lovesMusic);
  function defineClass(prototype) {
    function getBaseCtor(supers) {
      var i;

      if (supers == null) return null;
      if (!isArray(supers)) {
        supers = [supers];
      }

      for (i = supers.length - 1; i >= 0; i--) {
        if (isFunc(supers[i]) && supers[i].isClass) return supers[i];
        if (!Object.prototype.hasOwnProperty.call(supers[i], "constructor")) continue;
        if (supers[i].constructor) return supers[i].constructor;
      }

      return null;
    }

    var baseCtor;

    // fix prototype.constructor
    if (!Object.prototype.hasOwnProperty.call(prototype, "constructor")) {
      baseCtor = getBaseCtor(prototype._super);
      if (baseCtor) {
        prototype.constructor = function () {
          baseCtor.apply(this, arguments);
        };
      } else {
        prototype.constructor = function () {};
      }
    }

    prototype = compileProto(prototype);
    prototype.constructor.prototype = prototype;
    prototype.constructor.isClass = true;
    prototype.constructor.decorate = pipeline;
    return prototype.constructor;
  }

  defineClass.trait = function (traitDef) {
    function trait(proto) {
      return isFunc(proto) 
        ? (proto.isTrait ? defineClass.trait : defineClass)({ _super: [proto, traitDef] })
        : inherit(proto, traitDef);
    }
    trait.def = traitDef = compileProto(traitDef);
    trait.decorate = pipeline;
    trait.isTrait = true;
    return trait;
  };

  // make a proxy class that delegates methods calls to the base object.
  // Example:
  //   var PersonProxy = defineProxy(Person);
  //   var person = new Person("Anna");
  //   var proxy = new PersonProxy(person);
  //   proxy.greet(); // Hi, I'm Anna
  defineClass.proxy = function (classOrMethodNames, fieldName) {
    var clazz, name, i;
    if (classOrMethodNames.isClass) {
      clazz = arguments[0];
      classOrMethodNames = [];
      for (name in clazz.prototype) {
        if (name[0] != "_" && isFunc(clazz.prototype[name])) {
          classOrMethodNames.push(name);
        }
      }
    }

    fieldName = fieldName || "_real";
    var prototype = {
      constructor: function (real) {
        this[fieldName] = real;
      }
    };

    for (i = 0; i < classOrMethodNames.length; i++) {
      if (classOrMethodNames[i] == "constructor") continue;
      (function(name) {
        prototype[name] = function () {
          var real = this[fieldName];
          return real[name].apply(real, arguments);
        };
      })(classOrMethodNames[i]);
    }

    return defineClass(prototype);
  };

  defineClass.abstractMethod = function () {
    throw new Error("Abstract method cannot be called");
  };

  exports.defineClass = defineClass;

})(this);