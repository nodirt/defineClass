(function (exports) {
  "use strict";
  var methodTest = /resig/.test(function(){this.resig();}) ? /\b_super\b/ : /.*/;

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
  // trivial jQuery.extend
  function extend(target, members) {
    var key;
    if (!members) return;
    for (key in members) {
      target[key] = members[key];
    }
    return target;
  }

  function applyAll(funcs, arg, arg2) {
    var i;
    if (funcs == null) {
      return arg;
    } else if (isFunc(funcs)) {
      funcs = [funcs];
    } else if (typeof funcs !== "object") {
      throw new Error("Unexpected decorator " + funcs);
    }

    for (i = 0; i < funcs.length; i++) {
      if (isFunc(funcs[i])) {
        arg = funcs[i](arg, arg2) || arg;
      }
    }
    return arg;
  }
  function decorateSelf() {
    var supers = Array.prototype.slice.call(arguments, 0);
    supers.splice(0, 0, this);
    return this.__factory__({ _super: supers });
  }

  // derives a prototype from another one, inherits/overrides methods and nested classes
  function inherit(superPrototype, subPrototype, skipCtor) {
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
        if (skipCtor) continue;
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
    if (!skipCtor && !overriddenConstructor && Object.prototype.hasOwnProperty.call(subPrototype, "constructor") && isFunc(superPrototype.constructor)) {
      newPrototype.constructor = overrideMethod(superPrototype.constructor, subPrototype.constructor);
    }

    return newPrototype;
  }

  function compileProto(prototype) {
    function excludeMemberDecorators(prototype) {
      var decorators = null,
          name;
      for (name in prototype) {
        if (name.length > 1 && name[name.length - 1] == "$") {
          decorators = decorators || {};
          decorators[name.substr(0, name.length - 1)] = prototype[name];
          delete prototype[name];
        }
      }
      return decorators;
    }

    function applyMemberDecorators(prototype, decorators) {
      var name, decorator;
      if (!decorators) return;
      for (name in prototype) {
        decorator = decorators[name];
        if (decorator) {
          prototype[name] = applyAll(decorator, prototype[name], { parent: prototype, name: name });
        }
      }
    }

    function combineSupers(supers) {
      var result = null,
          sup, i;
      if (!supers) return null;
      supers = isArray(supers) ? supers : [supers];
      for (i = 0; i < supers.length; i++) {
        sup = supers[i];
        if (!isFunc(sup)) throw new Error("Unexpected _super value: " + sup + ". There may be only functions");
        if (sup.isClass) {
          if (result) throw new Error("Base class must be the first in _super field and there must be only one base class");
          result = sup.prototype;
        } else {
          result = sup(result || {});
        }
      }
      return result;
    }

    var superProto = combineSupers(prototype._super),
        classDecorators = prototype.$,
        memberDecorators = excludeMemberDecorators(prototype);
    delete prototype._super;
    delete prototype.$;

    if (superProto) {
      prototype = inherit(superProto, prototype);
    }
    prototype = applyAll(classDecorators, prototype);
    applyMemberDecorators(prototype, memberDecorators);
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
          return baseCtor.apply(this, arguments);
        };
      } else {
        prototype.constructor = function () {};
      }
    }

    prototype = compileProto(prototype);
    prototype.constructor.prototype = prototype;
    prototype.constructor.isClass = true;
    prototype.constructor.decorate = decorateSelf;
    prototype.constructor.__factory__ = defineClass;
    return prototype.constructor;
  }

  defineClass.trait = function (traitDef) {
    function extractSupers() {
      var supers = traitDef._super,
          i;
      if (!supers) return supers;

      delete traitDef._super;
      supers = isArray(supers) ? supers : [supers];
      for (i = 0; i < supers.length; i++) {
        if (!isFunc(supers[i])) {
          throw "A trait can have only functions in its _super field";
        }
        if (supers[i].isClass) {
          throw "A trait canont have a class in its _super field";
        }
      }
      return supers;
    }
    function applyTrait(prototype) {
      var i;
      if (superTraits) {
        for (i = 0; i < superTraits.length; i++) {
          prototype = superTraits[i](prototype);
        }
      }
      return inherit(prototype, traitDef, true);
    }
    function trait(clazz) {
      var proto;
      if (traitDef.isPrototypeOf(this)) {
        throw new Error("Trait cannot be instantiated");
      }
      if (!isFunc(clazz)) {
        return applyTrait(clazz);
      } else if (isFunc(clazz.decorate)) {
        return clazz.decorate(trait);
      } else {
        throw Error("Unexpected parameter value");
      }
    }

    var superTraits = extractSupers();

    if (traitDef.hasOwnProperty("constructor")) {
      throw new Error("Traits cannot have constructors");
    }

    trait.__factory__ = defineClass.trait;
    trait.decorate = decorateSelf;
    trait.prototype = traitDef;
    trait.prototype.constructor = trait;
    return trait;
  };

  defineClass.decorator = function (fnDecorator, settings) {
    function decoratePrototype(target, prototype, parent, info) {
      var name, decorated;
      parent = parent || prototype;

      for (name in prototype) {
        if (name == "constructor") continue;
        if (settings.predicate && !settings.predicate(name, prototype[name], name)) continue;
        decorated = fnDecorator.call(prototype[name], prototype[name], {
          name: name,
          parent: parent,
          parentInfo: info
        }, settings.options);
        if (decorated && decorated != prototype[name]) {
          target[name] = decorated;
        }
      }
      return target;
    }
    function decorator(clazz, info) {
      var proto;
      if (!isFunc(clazz)) {
        return decoratePrototype(derive(clazz), clazz, clazz, info);
      } else if (isFunc(clazz.__factory__)) {
        proto = { _super: clazz };
        decoratePrototype(proto, clazz.prototype, clazz, info);
        return clazz.__factory__(proto);
      } else {
        // just a func
        return fnDecorator(clazz, info, settings.options);
      }
    }

    function deriveDecorator(setting, value) {
      var settings2 = derive(settings);
      settings2[setting] = value;
      return defineClass.decorator(fnDecorator, settings2);
    }
    decorator.where = function (predicate) {
      return deriveDecorator("predicate", function () {
        return predicate.apply(this, arguments) && (!settings.predicate || settings.predicate.apply(this, arguments));
      });
    };

    decorator.opt = function (newOptions) {
      var opt = derive(settings.options);
      extend(opt, newOptions);
      return deriveDecorator("options", opt);
    };

    settings = settings || {};
    settings.options = settings.options && derive(settings.options) || {};
    return decorator;
  };

  // make a proxy class that delegates methods calls to the base object.
  // Example:
  //   var PersonProxy = defineProxy(Person);
  //   var person = new Person("Anna");
  //   var proxy = new PersonProxy(person);
  //   proxy.greet(); // Hi, I'm Anna
  function makeProxy(classOrMethodNames, fieldName, makeTrait) {
    var prototype = {},
        clazz, name, i;
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

    for (i = 0; i < classOrMethodNames.length; i++) {
      if (classOrMethodNames[i] == "constructor") continue;
      (function(name) {
        prototype[name] = function () {
          var real = this[fieldName];
          return real[name].apply(real, arguments);
        };
      })(classOrMethodNames[i]);
    }

    if (makeTrait) {
      return defineClass.trait(prototype);
    }

    prototype.constructor = function (real) {
      this[fieldName] = real;
    };
    return defineClass(prototype);
  }
  defineClass.proxy = function (classOrMethodNames, fieldName) {
    return makeProxy(classOrMethodNames, fieldName, false);
  };
  defineClass.proxyTrait = function (classOrMethodNames, fieldName) {
    return makeProxy(classOrMethodNames, fieldName, true);
  };

  defineClass.abstractMethod = function () {
    throw new Error("Abstract method cannot be called");
  };

  exports.defineClass = defineClass;

})(this);