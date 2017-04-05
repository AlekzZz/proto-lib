const extend = require('extend');
const Helpers = require('../helpers');
const { Identifier, Setuper } = Helpers;
let isJqueryAvailable = (typeof jquery !== 'undefined');

if (!isJqueryAvailable) {
  try {
    console.log(require.resolve('jquery'));
    isJqueryAvailable = true;
  } catch(err) {
    isJqueryAvailable = false;
  }
}

/**
 * Controller
 * @author Aleksandr Strutynskyy
 */
module.exports = function(proto) {
  return function(el, options) {
    let scope = null;

    // check if "el" is set and it is not options
    if (options || typeof el === 'string') {
      scope = (isJqueryAvailable ? jQuery(el) : document.querySelector(el));
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
