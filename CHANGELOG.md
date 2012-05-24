#ChangeLog

### Version 0.2.1

* Added defineClass.proxyTrait
* Fix: a generated constructor ignored base constructor return value

### Version 0.2

* Nested classes 
  * Nested class overriding

###Version 0.1.1

* Traits are defined as `defineClass.trait(definition)`
* A trait can import other traits
* A trait is a function that receives a class/trait/prototype, applies itself and returns the result
* Added `decorate` methods to classes and traits, that receive functions and applies them to itself

###Version 0.1.0, initial

Features:
* Class definition: methods and default field values
* Class inheritance
  * Method overriding
* Proxy class generation
* Scala-like traits
  * A class can apply multiple traits
  * A trait method can call `this._super()`
  * A trait cannot include other traits