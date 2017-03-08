var $ = {
  global: this,
  createRealm: function (options) {
    options = options || {};
    options.globals = options.globals || {};

    context = {
      console: console,
      vm: vm,
    };
    for (var glob in options.globals) {
      context[glob] = options.globals[glob];
    }

    vm.runInContext(this.source, context);

    context.$.source = this.source;
    context.$.context = context;
    context.$.destroy = function () {
      if (options.destroy) {
        options.destroy();
      }
    };
    return context.$;
  },
  evalScript: function (code) {
    try {
      if (this.context) {
        vm.runInContext(code, this.context);
      } else {
        eval(code);
      }

      return { type: 'normal', value: undefined };
    } catch (e) {
      return { type: 'throw', value: e };
    }
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
