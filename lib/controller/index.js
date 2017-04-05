const extend = require('extend');
const Helpers = require('../helpers');
const { Identifier, Setuper } = Helpers;

/**
 * Controller
 * @author Aleksandr Strutynskyy
 */
module.exports = function(proto) {
  return function(el, options) {
    let scope = null;

    // check if "el" is set and it is not options
    if (el && options || typeof el === 'string') {
      scope = document.querySelector(el);
    } else {
      options = el;
    }

    // allow overridable setup
    let setup = (typeof proto.setup === 'function' ? proto.setup : Setuper);
    const instance = Object.assign({}, Identifier(), proto, setup({ scope, options, proto }));

    // cleanup
    delete instance.defaults;
    delete instance.setup;

    // invoke "init" if set
    if (typeof instance.init === 'function') {
      instance.init();
    }

    return instance;
  };
}
