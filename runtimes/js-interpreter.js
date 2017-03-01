var $ = {
  global: this,
  createRealm: function (options) {
    throw new Error("createRealm not implemented yet...");
  },
  evalScript: function (code) {
    throw new Error("evalScript not implemented yet...");
  },
  getGlobal: function (name) {
    return this.global[name];
  },
  setGlobal: function (name, value) {
    this.global[name] = value;
  },
  destroy: function() { /* noop */ },
  source: $SOURCE
};
function print() { console.log.apply(console, arguments) }
