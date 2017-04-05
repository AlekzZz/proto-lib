const sinonChai = require('sinon-chai');
const sinon = require('sinon');
const sinonPromise = require('sinon-promise');
sinonPromise(sinon);
const chai = require('chai');
const Handlebars = require('handlebars');

global.chai = chai;
global.expect = chai.expect;
global.assert = chai.assert;
global.sinon = sinon;
global.Handlebars = Handlebars;

chai.should();
chai.use(sinonChai);
