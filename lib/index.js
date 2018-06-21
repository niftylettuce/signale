"use strict";

function _toArray(arr) { return _arrayWithHoles(arr) || _iterableToArray(arr) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var util = require('util');

var path = require('path');

var chalk = require('chalk');

var figures = require('figures');

var pkgConf = require('pkg-conf');

var ansi = require('ansicolor');

var pkg = require('../package.json');

var defaultTypes = require('./types'); // determine if we're in a browser


var isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
var isPreviousLogInteractive = false;
var defaults = pkg.options.default;
var namespace = pkg.name;

var arrayify = function arrayify(x) {
  return Array.isArray(x) ? x : [x];
};

var now = function now() {
  return Date.now();
};

var timeSpan = function timeSpan(then) {
  return now() - then;
};

var Signale =
/*#__PURE__*/
function () {
  function Signale() {
    var _this = this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Signale);

    this._interactive = isBrowser ? false : options.interactive || false;
    this._config = Object.assign(this.packageConfiguration, options.config);
    this._customTypes = Object.assign({}, options.types);
    this._disabled = options.disabled || false;
    this._scopeName = options.scope || '';
    this._timers = options.timers || new Map();
    this._types = this._mergeTypes(defaultTypes, this._customTypes);
    this._stream = isBrowser ? {
      write: console.log
    } : options.stream || process.stdout;
    this._longestLabel = defaultTypes.start.label.length;
    Object.keys(this._types).forEach(function (type) {
      _this[type] = _this._logger.bind(_this, type);
    });

    for (var type in this._types) {
      if (this._types[type].label && this._types[type].label.length > this._longestLabel) {
        this._longestLabel = this._types[type].label.length;
      }
    }
  }

  _createClass(Signale, [{
    key: "_mergeTypes",
    value: function _mergeTypes(standard, custom) {
      var types = Object.assign({}, standard);
      Object.keys(custom).forEach(function (type) {
        types[type] = Object.assign({}, types[type], custom[type]);
      });
      return types;
    }
  }, {
    key: "_formatStream",
    value: function _formatStream(stream) {
      return arrayify(stream);
    }
  }, {
    key: "_formatDate",
    value: function _formatDate() {
      return `[${this.date}]`;
    }
  }, {
    key: "_formatFilename",
    value: function _formatFilename() {
      return `[${this.filename}]`;
    }
  }, {
    key: "_formatScopeName",
    value: function _formatScopeName() {
      if (Array.isArray(this._scopeName)) {
        var scopes = this._scopeName.filter(function (x) {
          return x.length !== 0;
        });

        return `${scopes.map(function (x) {
          return `[${x.trim()}]`;
        }).join(' ')}`;
      }

      return `[${this._scopeName}]`;
    }
  }, {
    key: "_formatTimestamp",
    value: function _formatTimestamp() {
      return `[${this.timestamp}]`;
    }
  }, {
    key: "_formatMessage",
    value: function _formatMessage(str, type) {
      str = arrayify(str);

      if (this._config.coloredInterpolation) {
        var _ = Object.assign({}, util.inspect.styles);

        Object.keys(util.inspect.styles).forEach(function (x) {
          util.inspect.styles[x] = type.color || _[x];
        });
        str = util.formatWithOptions.apply(util, [{
          colors: true
        }].concat(_toConsumableArray(str)));
        util.inspect.styles = Object.assign({}, _);
        return str;
      }

      return util.format.apply(util, _toConsumableArray(str));
    }
  }, {
    key: "_meta",
    value: function _meta() {
      var meta = [];

      if (this._config.displayDate) {
        meta.push(this._formatDate());
      }

      if (this._config.displayTimestamp) {
        meta.push(this._formatTimestamp());
      }

      if (this._config.displayFilename) {
        meta.push(this._formatFilename());
      }

      if (this._scopeName.length !== 0 && this._config.displayScope) {
        meta.push(this._formatScopeName());
      }

      if (meta.length !== 0) {
        meta.push(`${figures.pointerSmall}`);
        return meta.map(function (item) {
          return chalk.grey(item);
        });
      }

      return meta;
    }
  }, {
    key: "_hasAdditional",
    value: function _hasAdditional(_ref, args, type) {
      var suffix = _ref.suffix,
          prefix = _ref.prefix;
      return suffix || prefix ? '' : this._formatMessage(args, type);
    }
  }, {
    key: "_buildSignale",
    value: function _buildSignale(type) {
      var msg = {},
          additional = {};

      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
        if (args[0] instanceof Error) {
          msg = args[0];
        } else {
          var _args$ = args[0],
              prefix = _args$.prefix,
              message = _args$.message,
              suffix = _args$.suffix;
          additional = Object.assign({}, {
            suffix,
            prefix
          });
          msg = message ? this._formatMessage(message, type) : this._hasAdditional(additional, args, type);
        }
      } else {
        msg = this._formatMessage(args, type);
      }

      var signale = this._meta();

      if (additional.prefix) {
        if (this._config.underlinePrefix) {
          signale.push(chalk.underline(additional.prefix));
        } else {
          signale.push(additional.prefix);
        }
      }

      if (this._config.displayBadge && type.badge) {
        signale.push(chalk[type.color](type.badge.padEnd(type.badge.length + 1)));
      }

      if (this._config.displayLabel && type.label) {
        var label = this._config.uppercaseLabel ? type.label.toUpperCase() : type.label;

        if (this._config.underlineLabel) {
          signale.push(chalk[type.color].underline(label).padEnd(this._longestLabel + 20));
        } else {
          signale.push(chalk[type.color](label.padEnd(this._longestLabel + 1)));
        }
      }

      if (msg instanceof Error && msg.stack) {
        var _msg$stack$split = msg.stack.split('\n'),
            _msg$stack$split2 = _toArray(_msg$stack$split),
            name = _msg$stack$split2[0],
            rest = _msg$stack$split2.slice(1);

        if (this._config.underlineMessage) {
          signale.push(chalk.underline(name));
        } else {
          signale.push(name);
        }

        signale.push(chalk.grey(rest.map(function (l) {
          return l.replace(/^/, '\n');
        }).join('')));
        return signale.join(' ');
      }

      if (this._config.underlineMessage) {
        signale.push(chalk.underline(msg));
      } else {
        signale.push(msg);
      }

      if (additional.suffix) {
        if (this._config.underlineSuffix) {
          signale.push(chalk.underline(additional.suffix));
        } else {
          signale.push(additional.suffix);
        }
      }

      return signale.join(' ');
    }
  }, {
    key: "_write",
    value: function _write(stream, message) {
      if (isBrowser) {
        var parsed = ansi.parse(message);
        stream.write.apply(stream, _toConsumableArray(parsed.asChromeConsoleLogArguments));
        return;
      }

      if (this._interactive && isPreviousLogInteractive) {
        stream.moveCursor(0, -1);
        stream.clearLine();
        stream.cursorTo(0);
      }

      stream.write(message + '\n');
      isPreviousLogInteractive = this._interactive;
    }
  }, {
    key: "_log",
    value: function _log(message) {
      var _this2 = this;

      var streams = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this._stream;

      if (this.isEnabled) {
        this._formatStream(streams).forEach(function (stream) {
          _this2._write(stream, message);
        });
      }
    }
  }, {
    key: "_logger",
    value: function _logger(type) {
      for (var _len2 = arguments.length, messageObj = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        messageObj[_key2 - 1] = arguments[_key2];
      }

      this._log(this._buildSignale.apply(this, [this._types[type]].concat(messageObj)), this._types[type].stream);
    }
  }, {
    key: "config",
    value: function config(configObj) {
      this.configuration = configObj;
    }
  }, {
    key: "disable",
    value: function disable() {
      this._disabled = true;
    }
  }, {
    key: "enable",
    value: function enable() {
      this._disabled = false;
    }
  }, {
    key: "scope",
    value: function scope() {
      for (var _len3 = arguments.length, name = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        name[_key3] = arguments[_key3];
      }

      if (name.length === 0) {
        throw new Error('No scope name was defined.');
      }

      return new Signale(Object.assign(this.currentOptions, {
        scope: name
      }));
    }
  }, {
    key: "unscope",
    value: function unscope() {
      this._scopeName = '';
    }
  }, {
    key: "time",
    value: function time(label) {
      if (!label) {
        label = `timer_${this._timers.size}`;
      }

      this._timers.set(label, Date.now());

      var message = this._meta();

      var report = [chalk.green(this._types.start.badge.padEnd(2)), chalk.green.underline(label).padEnd(this._longestLabel + 20), 'Initialized timer...'];
      message.push.apply(message, report);

      this._log(message.join(' '));

      return label;
    }
  }, {
    key: "timeEnd",
    value: function timeEnd(label) {
      if (!label && this._timers.size) {
        var is = function is(x) {
          return x.includes('timer_');
        };

        label = _toConsumableArray(this._timers.keys()).reduceRight(function (x, y) {
          return is(x) ? x : is(y) ? y : null;
        });
      }

      if (this._timers.has(label)) {
        var span = timeSpan(this._timers.get(label));

        this._timers.delete(label);

        var message = this._meta();

        var report = [chalk.red(this._types.pause.badge.padEnd(2)), chalk.red.underline(label).padEnd(this._longestLabel + 20), 'Timer run for:', chalk.yellow(span < 1000 ? span + 'ms' : (span / 1000).toFixed(2) + 's')];
        message.push.apply(message, report);

        this._log(message.join(' '));

        return {
          label,
          span
        };
      }
    }
  }, {
    key: "scopeName",
    get: function get() {
      return this._scopeName;
    }
  }, {
    key: "currentOptions",
    get: function get() {
      return Object.assign({}, {
        config: this._config,
        disabled: this._disabled,
        types: this._customTypes,
        interactive: this._interactive,
        timers: this._timers,
        stream: this._stream
      });
    }
  }, {
    key: "isEnabled",
    get: function get() {
      return !this._disabled;
    }
  }, {
    key: "date",
    get: function get() {
      return new Date().toLocaleDateString();
    }
  }, {
    key: "timestamp",
    get: function get() {
      return new Date().toLocaleTimeString();
    }
  }, {
    key: "filename",
    get: function get() {
      var _ = Error.prepareStackTrace;

      Error.prepareStackTrace = function (error, stack) {
        return stack;
      };

      var _ref2 = new Error(),
          stack = _ref2.stack;

      Error.prepareStackTrace = _;
      var callers = stack.map(function (x) {
        return x.getFileName();
      });
      var firstExternalFilePath = callers.find(function (x) {
        return x !== callers[0];
      });
      return firstExternalFilePath ? path.basename(firstExternalFilePath) : 'anonymous';
    }
  }, {
    key: "packageConfiguration",
    get: function get() {
      return pkgConf.sync(namespace, {
        defaults
      });
    }
  }, {
    key: "configuration",
    set: function set(configObj) {
      this._config = Object.assign(this.packageConfiguration, configObj);
    }
  }]);

  return Signale;
}();

module.exports = Signale;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJ1dGlsIiwicmVxdWlyZSIsInBhdGgiLCJjaGFsayIsImZpZ3VyZXMiLCJwa2dDb25mIiwiYW5zaSIsInBrZyIsImRlZmF1bHRUeXBlcyIsImlzQnJvd3NlciIsIndpbmRvdyIsImRvY3VtZW50IiwiaXNQcmV2aW91c0xvZ0ludGVyYWN0aXZlIiwiZGVmYXVsdHMiLCJvcHRpb25zIiwiZGVmYXVsdCIsIm5hbWVzcGFjZSIsIm5hbWUiLCJhcnJheWlmeSIsIkFycmF5IiwiaXNBcnJheSIsIngiLCJub3ciLCJEYXRlIiwidGltZVNwYW4iLCJ0aGVuIiwiU2lnbmFsZSIsIl9pbnRlcmFjdGl2ZSIsImludGVyYWN0aXZlIiwiX2NvbmZpZyIsIk9iamVjdCIsImFzc2lnbiIsInBhY2thZ2VDb25maWd1cmF0aW9uIiwiY29uZmlnIiwiX2N1c3RvbVR5cGVzIiwidHlwZXMiLCJfZGlzYWJsZWQiLCJkaXNhYmxlZCIsIl9zY29wZU5hbWUiLCJzY29wZSIsIl90aW1lcnMiLCJ0aW1lcnMiLCJNYXAiLCJfdHlwZXMiLCJfbWVyZ2VUeXBlcyIsIl9zdHJlYW0iLCJ3cml0ZSIsImNvbnNvbGUiLCJsb2ciLCJzdHJlYW0iLCJwcm9jZXNzIiwic3Rkb3V0IiwiX2xvbmdlc3RMYWJlbCIsInN0YXJ0IiwibGFiZWwiLCJsZW5ndGgiLCJrZXlzIiwiZm9yRWFjaCIsInR5cGUiLCJfbG9nZ2VyIiwiYmluZCIsInN0YW5kYXJkIiwiY3VzdG9tIiwiZGF0ZSIsImZpbGVuYW1lIiwic2NvcGVzIiwiZmlsdGVyIiwibWFwIiwidHJpbSIsImpvaW4iLCJ0aW1lc3RhbXAiLCJzdHIiLCJjb2xvcmVkSW50ZXJwb2xhdGlvbiIsIl8iLCJpbnNwZWN0Iiwic3R5bGVzIiwiY29sb3IiLCJmb3JtYXRXaXRoT3B0aW9ucyIsImNvbG9ycyIsImZvcm1hdCIsIm1ldGEiLCJkaXNwbGF5RGF0ZSIsInB1c2giLCJfZm9ybWF0RGF0ZSIsImRpc3BsYXlUaW1lc3RhbXAiLCJfZm9ybWF0VGltZXN0YW1wIiwiZGlzcGxheUZpbGVuYW1lIiwiX2Zvcm1hdEZpbGVuYW1lIiwiZGlzcGxheVNjb3BlIiwiX2Zvcm1hdFNjb3BlTmFtZSIsInBvaW50ZXJTbWFsbCIsImdyZXkiLCJpdGVtIiwiYXJncyIsInN1ZmZpeCIsInByZWZpeCIsIl9mb3JtYXRNZXNzYWdlIiwibXNnIiwiYWRkaXRpb25hbCIsIkVycm9yIiwibWVzc2FnZSIsIl9oYXNBZGRpdGlvbmFsIiwic2lnbmFsZSIsIl9tZXRhIiwidW5kZXJsaW5lUHJlZml4IiwidW5kZXJsaW5lIiwiZGlzcGxheUJhZGdlIiwiYmFkZ2UiLCJwYWRFbmQiLCJkaXNwbGF5TGFiZWwiLCJ1cHBlcmNhc2VMYWJlbCIsInRvVXBwZXJDYXNlIiwidW5kZXJsaW5lTGFiZWwiLCJzdGFjayIsInNwbGl0IiwicmVzdCIsInVuZGVybGluZU1lc3NhZ2UiLCJsIiwicmVwbGFjZSIsInVuZGVybGluZVN1ZmZpeCIsInBhcnNlZCIsInBhcnNlIiwiYXNDaHJvbWVDb25zb2xlTG9nQXJndW1lbnRzIiwibW92ZUN1cnNvciIsImNsZWFyTGluZSIsImN1cnNvclRvIiwic3RyZWFtcyIsImlzRW5hYmxlZCIsIl9mb3JtYXRTdHJlYW0iLCJfd3JpdGUiLCJtZXNzYWdlT2JqIiwiX2xvZyIsIl9idWlsZFNpZ25hbGUiLCJjb25maWdPYmoiLCJjb25maWd1cmF0aW9uIiwiY3VycmVudE9wdGlvbnMiLCJzaXplIiwic2V0IiwicmVwb3J0IiwiZ3JlZW4iLCJpcyIsImluY2x1ZGVzIiwicmVkdWNlUmlnaHQiLCJ5IiwiaGFzIiwic3BhbiIsImdldCIsImRlbGV0ZSIsInJlZCIsInBhdXNlIiwieWVsbG93IiwidG9GaXhlZCIsInRvTG9jYWxlRGF0ZVN0cmluZyIsInRvTG9jYWxlVGltZVN0cmluZyIsInByZXBhcmVTdGFja1RyYWNlIiwiZXJyb3IiLCJjYWxsZXJzIiwiZ2V0RmlsZU5hbWUiLCJmaXJzdEV4dGVybmFsRmlsZVBhdGgiLCJmaW5k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SSxRQUFRLENBQVIsQ0FBYjtBQUNELE9BRjZCLENBQTlCO0FBSUEsYUFBT0Usd0JBQ0g1SixLQUFLOEosUUFBTCxDQUFjRixxQkFBZCxDQURHLEdBRUgsV0FGSjtBQUdEOzs7d0JBRTBCO0FBQ3pCLGFBQU96SixRQUFRNEosSUFBUixDQUFhakosU0FBYixFQUF3QjtBQUFFSDtBQUFGLE9BQXhCLENBQVA7QUFDRDs7O3NCQUVpQndILFMsRUFBVztBQUMzQixXQUFLeEcsT0FBTCxHQUFlQyxPQUFPQyxNQUFQLENBQWMsS0FBS0Msb0JBQW5CLEVBQXlDcUcsU0FBekMsQ0FBZjtBQUNEOzs7Ozs7QUEwUEg2QixPQUFPQyxPQUFQLEdBQWlCekksT0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmNvbnN0IGNoYWxrID0gcmVxdWlyZSgnY2hhbGsnKTtcbmNvbnN0IGZpZ3VyZXMgPSByZXF1aXJlKCdmaWd1cmVzJyk7XG5jb25zdCBwa2dDb25mID0gcmVxdWlyZSgncGtnLWNvbmYnKTtcbmNvbnN0IGFuc2kgPSByZXF1aXJlKCdhbnNpY29sb3InKTtcblxuY29uc3QgcGtnID0gcmVxdWlyZSgnLi4vcGFja2FnZS5qc29uJyk7XG5jb25zdCBkZWZhdWx0VHlwZXMgPSByZXF1aXJlKCcuL3R5cGVzJyk7XG5cbi8vIGRldGVybWluZSBpZiB3ZSdyZSBpbiBhIGJyb3dzZXJcbmNvbnN0IGlzQnJvd3NlciA9XG4gIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiB3aW5kb3cuZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnO1xuXG5sZXQgaXNQcmV2aW91c0xvZ0ludGVyYWN0aXZlID0gZmFsc2U7XG5jb25zdCBkZWZhdWx0cyA9IHBrZy5vcHRpb25zLmRlZmF1bHQ7XG5jb25zdCBuYW1lc3BhY2UgPSBwa2cubmFtZTtcblxuY29uc3QgYXJyYXlpZnkgPSB4ID0+IHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoeCkgPyB4IDogW3hdO1xufTtcbmNvbnN0IG5vdyA9ICgpID0+IERhdGUubm93KCk7XG5jb25zdCB0aW1lU3BhbiA9IHRoZW4gPT4ge1xuICByZXR1cm4gbm93KCkgLSB0aGVuO1xufTtcblxuY2xhc3MgU2lnbmFsZSB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMuX2ludGVyYWN0aXZlID0gaXNCcm93c2VyID8gZmFsc2UgOiBvcHRpb25zLmludGVyYWN0aXZlIHx8IGZhbHNlO1xuICAgIHRoaXMuX2NvbmZpZyA9IE9iamVjdC5hc3NpZ24odGhpcy5wYWNrYWdlQ29uZmlndXJhdGlvbiwgb3B0aW9ucy5jb25maWcpO1xuICAgIHRoaXMuX2N1c3RvbVR5cGVzID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucy50eXBlcyk7XG4gICAgdGhpcy5fZGlzYWJsZWQgPSBvcHRpb25zLmRpc2FibGVkIHx8IGZhbHNlO1xuICAgIHRoaXMuX3Njb3BlTmFtZSA9IG9wdGlvbnMuc2NvcGUgfHwgJyc7XG4gICAgdGhpcy5fdGltZXJzID0gb3B0aW9ucy50aW1lcnMgfHwgbmV3IE1hcCgpO1xuICAgIHRoaXMuX3R5cGVzID0gdGhpcy5fbWVyZ2VUeXBlcyhkZWZhdWx0VHlwZXMsIHRoaXMuX2N1c3RvbVR5cGVzKTtcbiAgICB0aGlzLl9zdHJlYW0gPSBpc0Jyb3dzZXJcbiAgICAgID8geyB3cml0ZTogY29uc29sZS5sb2cgfVxuICAgICAgOiBvcHRpb25zLnN0cmVhbSB8fCBwcm9jZXNzLnN0ZG91dDtcbiAgICB0aGlzLl9sb25nZXN0TGFiZWwgPSBkZWZhdWx0VHlwZXMuc3RhcnQubGFiZWwubGVuZ3RoO1xuXG4gICAgT2JqZWN0LmtleXModGhpcy5fdHlwZXMpLmZvckVhY2godHlwZSA9PiB7XG4gICAgICB0aGlzW3R5cGVdID0gdGhpcy5fbG9nZ2VyLmJpbmQodGhpcywgdHlwZSk7XG4gICAgfSk7XG5cbiAgICBmb3IgKGNvbnN0IHR5cGUgaW4gdGhpcy5fdHlwZXMpIHtcbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5fdHlwZXNbdHlwZV0ubGFiZWwgJiZcbiAgICAgICAgdGhpcy5fdHlwZXNbdHlwZV0ubGFiZWwubGVuZ3RoID4gdGhpcy5fbG9uZ2VzdExhYmVsXG4gICAgICApIHtcbiAgICAgICAgdGhpcy5fbG9uZ2VzdExhYmVsID0gdGhpcy5fdHlwZXNbdHlwZV0ubGFiZWwubGVuZ3RoO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGdldCBzY29wZU5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Njb3BlTmFtZTtcbiAgfVxuXG4gIGdldCBjdXJyZW50T3B0aW9ucygpIHtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAge1xuICAgICAgICBjb25maWc6IHRoaXMuX2NvbmZpZyxcbiAgICAgICAgZGlzYWJsZWQ6IHRoaXMuX2Rpc2FibGVkLFxuICAgICAgICB0eXBlczogdGhpcy5fY3VzdG9tVHlwZXMsXG4gICAgICAgIGludGVyYWN0aXZlOiB0aGlzLl9pbnRlcmFjdGl2ZSxcbiAgICAgICAgdGltZXJzOiB0aGlzLl90aW1lcnMsXG4gICAgICAgIHN0cmVhbTogdGhpcy5fc3RyZWFtXG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGdldCBpc0VuYWJsZWQoKSB7XG4gICAgcmV0dXJuICF0aGlzLl9kaXNhYmxlZDtcbiAgfVxuXG4gIGdldCBkYXRlKCkge1xuICAgIHJldHVybiBuZXcgRGF0ZSgpLnRvTG9jYWxlRGF0ZVN0cmluZygpO1xuICB9XG5cbiAgZ2V0IHRpbWVzdGFtcCgpIHtcbiAgICByZXR1cm4gbmV3IERhdGUoKS50b0xvY2FsZVRpbWVTdHJpbmcoKTtcbiAgfVxuXG4gIGdldCBmaWxlbmFtZSgpIHtcbiAgICBjb25zdCBfID0gRXJyb3IucHJlcGFyZVN0YWNrVHJhY2U7XG4gICAgRXJyb3IucHJlcGFyZVN0YWNrVHJhY2UgPSAoZXJyb3IsIHN0YWNrKSA9PiBzdGFjaztcbiAgICBjb25zdCB7IHN0YWNrIH0gPSBuZXcgRXJyb3IoKTtcbiAgICBFcnJvci5wcmVwYXJlU3RhY2tUcmFjZSA9IF87XG5cbiAgICBjb25zdCBjYWxsZXJzID0gc3RhY2subWFwKHggPT4geC5nZXRGaWxlTmFtZSgpKTtcblxuICAgIGNvbnN0IGZpcnN0RXh0ZXJuYWxGaWxlUGF0aCA9IGNhbGxlcnMuZmluZCh4ID0+IHtcbiAgICAgIHJldHVybiB4ICE9PSBjYWxsZXJzWzBdO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZpcnN0RXh0ZXJuYWxGaWxlUGF0aFxuICAgICAgPyBwYXRoLmJhc2VuYW1lKGZpcnN0RXh0ZXJuYWxGaWxlUGF0aClcbiAgICAgIDogJ2Fub255bW91cyc7XG4gIH1cblxuICBnZXQgcGFja2FnZUNvbmZpZ3VyYXRpb24oKSB7XG4gICAgcmV0dXJuIHBrZ0NvbmYuc3luYyhuYW1lc3BhY2UsIHsgZGVmYXVsdHMgfSk7XG4gIH1cblxuICBzZXQgY29uZmlndXJhdGlvbihjb25maWdPYmopIHtcbiAgICB0aGlzLl9jb25maWcgPSBPYmplY3QuYXNzaWduKHRoaXMucGFja2FnZUNvbmZpZ3VyYXRpb24sIGNvbmZpZ09iaik7XG4gIH1cblxuICBfbWVyZ2VUeXBlcyhzdGFuZGFyZCwgY3VzdG9tKSB7XG4gICAgY29uc3QgdHlwZXMgPSBPYmplY3QuYXNzaWduKHt9LCBzdGFuZGFyZCk7XG5cbiAgICBPYmplY3Qua2V5cyhjdXN0b20pLmZvckVhY2godHlwZSA9PiB7XG4gICAgICB0eXBlc1t0eXBlXSA9IE9iamVjdC5hc3NpZ24oe30sIHR5cGVzW3R5cGVdLCBjdXN0b21bdHlwZV0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHR5cGVzO1xuICB9XG5cbiAgX2Zvcm1hdFN0cmVhbShzdHJlYW0pIHtcbiAgICByZXR1cm4gYXJyYXlpZnkoc3RyZWFtKTtcbiAgfVxuXG4gIF9mb3JtYXREYXRlKCkge1xuICAgIHJldHVybiBgWyR7dGhpcy5kYXRlfV1gO1xuICB9XG5cbiAgX2Zvcm1hdEZpbGVuYW1lKCkge1xuICAgIHJldHVybiBgWyR7dGhpcy5maWxlbmFtZX1dYDtcbiAgfVxuXG4gIF9mb3JtYXRTY29wZU5hbWUoKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5fc2NvcGVOYW1lKSkge1xuICAgICAgY29uc3Qgc2NvcGVzID0gdGhpcy5fc2NvcGVOYW1lLmZpbHRlcih4ID0+IHgubGVuZ3RoICE9PSAwKTtcbiAgICAgIHJldHVybiBgJHtzY29wZXMubWFwKHggPT4gYFske3gudHJpbSgpfV1gKS5qb2luKCcgJyl9YDtcbiAgICB9XG4gICAgcmV0dXJuIGBbJHt0aGlzLl9zY29wZU5hbWV9XWA7XG4gIH1cblxuICBfZm9ybWF0VGltZXN0YW1wKCkge1xuICAgIHJldHVybiBgWyR7dGhpcy50aW1lc3RhbXB9XWA7XG4gIH1cblxuICBfZm9ybWF0TWVzc2FnZShzdHIsIHR5cGUpIHtcbiAgICBzdHIgPSBhcnJheWlmeShzdHIpO1xuXG4gICAgaWYgKHRoaXMuX2NvbmZpZy5jb2xvcmVkSW50ZXJwb2xhdGlvbikge1xuICAgICAgY29uc3QgXyA9IE9iamVjdC5hc3NpZ24oe30sIHV0aWwuaW5zcGVjdC5zdHlsZXMpO1xuXG4gICAgICBPYmplY3Qua2V5cyh1dGlsLmluc3BlY3Quc3R5bGVzKS5mb3JFYWNoKHggPT4ge1xuICAgICAgICB1dGlsLmluc3BlY3Quc3R5bGVzW3hdID0gdHlwZS5jb2xvciB8fCBfW3hdO1xuICAgICAgfSk7XG5cbiAgICAgIHN0ciA9IHV0aWwuZm9ybWF0V2l0aE9wdGlvbnMoeyBjb2xvcnM6IHRydWUgfSwgLi4uc3RyKTtcbiAgICAgIHV0aWwuaW5zcGVjdC5zdHlsZXMgPSBPYmplY3QuYXNzaWduKHt9LCBfKTtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuXG4gICAgcmV0dXJuIHV0aWwuZm9ybWF0KC4uLnN0cik7XG4gIH1cblxuICBfbWV0YSgpIHtcbiAgICBjb25zdCBtZXRhID0gW107XG4gICAgaWYgKHRoaXMuX2NvbmZpZy5kaXNwbGF5RGF0ZSkge1xuICAgICAgbWV0YS5wdXNoKHRoaXMuX2Zvcm1hdERhdGUoKSk7XG4gICAgfVxuICAgIGlmICh0aGlzLl9jb25maWcuZGlzcGxheVRpbWVzdGFtcCkge1xuICAgICAgbWV0YS5wdXNoKHRoaXMuX2Zvcm1hdFRpbWVzdGFtcCgpKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX2NvbmZpZy5kaXNwbGF5RmlsZW5hbWUpIHtcbiAgICAgIG1ldGEucHVzaCh0aGlzLl9mb3JtYXRGaWxlbmFtZSgpKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3Njb3BlTmFtZS5sZW5ndGggIT09IDAgJiYgdGhpcy5fY29uZmlnLmRpc3BsYXlTY29wZSkge1xuICAgICAgbWV0YS5wdXNoKHRoaXMuX2Zvcm1hdFNjb3BlTmFtZSgpKTtcbiAgICB9XG4gICAgaWYgKG1ldGEubGVuZ3RoICE9PSAwKSB7XG4gICAgICBtZXRhLnB1c2goYCR7ZmlndXJlcy5wb2ludGVyU21hbGx9YCk7XG4gICAgICByZXR1cm4gbWV0YS5tYXAoaXRlbSA9PiBjaGFsay5ncmV5KGl0ZW0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG1ldGE7XG4gIH1cblxuICBfaGFzQWRkaXRpb25hbCh7IHN1ZmZpeCwgcHJlZml4IH0sIGFyZ3MsIHR5cGUpIHtcbiAgICByZXR1cm4gc3VmZml4IHx8IHByZWZpeCA/ICcnIDogdGhpcy5fZm9ybWF0TWVzc2FnZShhcmdzLCB0eXBlKTtcbiAgfVxuXG4gIF9idWlsZFNpZ25hbGUodHlwZSwgLi4uYXJncykge1xuICAgIGxldCBbbXNnLCBhZGRpdGlvbmFsXSA9IFt7fSwge31dO1xuXG4gICAgaWYgKGFyZ3MubGVuZ3RoID09PSAxICYmIHR5cGVvZiBhcmdzWzBdID09PSAnb2JqZWN0JyAmJiBhcmdzWzBdICE9PSBudWxsKSB7XG4gICAgICBpZiAoYXJnc1swXSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIFttc2ddID0gYXJncztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IFt7IHByZWZpeCwgbWVzc2FnZSwgc3VmZml4IH1dID0gYXJncztcbiAgICAgICAgYWRkaXRpb25hbCA9IE9iamVjdC5hc3NpZ24oe30sIHsgc3VmZml4LCBwcmVmaXggfSk7XG4gICAgICAgIG1zZyA9IG1lc3NhZ2VcbiAgICAgICAgICA/IHRoaXMuX2Zvcm1hdE1lc3NhZ2UobWVzc2FnZSwgdHlwZSlcbiAgICAgICAgICA6IHRoaXMuX2hhc0FkZGl0aW9uYWwoYWRkaXRpb25hbCwgYXJncywgdHlwZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG1zZyA9IHRoaXMuX2Zvcm1hdE1lc3NhZ2UoYXJncywgdHlwZSk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2lnbmFsZSA9IHRoaXMuX21ldGEoKTtcblxuICAgIGlmIChhZGRpdGlvbmFsLnByZWZpeCkge1xuICAgICAgaWYgKHRoaXMuX2NvbmZpZy51bmRlcmxpbmVQcmVmaXgpIHtcbiAgICAgICAgc2lnbmFsZS5wdXNoKGNoYWxrLnVuZGVybGluZShhZGRpdGlvbmFsLnByZWZpeCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2lnbmFsZS5wdXNoKGFkZGl0aW9uYWwucHJlZml4KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5fY29uZmlnLmRpc3BsYXlCYWRnZSAmJiB0eXBlLmJhZGdlKSB7XG4gICAgICBzaWduYWxlLnB1c2goY2hhbGtbdHlwZS5jb2xvcl0odHlwZS5iYWRnZS5wYWRFbmQodHlwZS5iYWRnZS5sZW5ndGggKyAxKSkpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9jb25maWcuZGlzcGxheUxhYmVsICYmIHR5cGUubGFiZWwpIHtcbiAgICAgIGNvbnN0IGxhYmVsID0gdGhpcy5fY29uZmlnLnVwcGVyY2FzZUxhYmVsXG4gICAgICAgID8gdHlwZS5sYWJlbC50b1VwcGVyQ2FzZSgpXG4gICAgICAgIDogdHlwZS5sYWJlbDtcbiAgICAgIGlmICh0aGlzLl9jb25maWcudW5kZXJsaW5lTGFiZWwpIHtcbiAgICAgICAgc2lnbmFsZS5wdXNoKFxuICAgICAgICAgIGNoYWxrW3R5cGUuY29sb3JdLnVuZGVybGluZShsYWJlbCkucGFkRW5kKHRoaXMuX2xvbmdlc3RMYWJlbCArIDIwKVxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2lnbmFsZS5wdXNoKGNoYWxrW3R5cGUuY29sb3JdKGxhYmVsLnBhZEVuZCh0aGlzLl9sb25nZXN0TGFiZWwgKyAxKSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChtc2cgaW5zdGFuY2VvZiBFcnJvciAmJiBtc2cuc3RhY2spIHtcbiAgICAgIGNvbnN0IFtuYW1lLCAuLi5yZXN0XSA9IG1zZy5zdGFjay5zcGxpdCgnXFxuJyk7XG4gICAgICBpZiAodGhpcy5fY29uZmlnLnVuZGVybGluZU1lc3NhZ2UpIHtcbiAgICAgICAgc2lnbmFsZS5wdXNoKGNoYWxrLnVuZGVybGluZShuYW1lKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzaWduYWxlLnB1c2gobmFtZSk7XG4gICAgICB9XG4gICAgICBzaWduYWxlLnB1c2goY2hhbGsuZ3JleShyZXN0Lm1hcChsID0+IGwucmVwbGFjZSgvXi8sICdcXG4nKSkuam9pbignJykpKTtcbiAgICAgIHJldHVybiBzaWduYWxlLmpvaW4oJyAnKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fY29uZmlnLnVuZGVybGluZU1lc3NhZ2UpIHtcbiAgICAgIHNpZ25hbGUucHVzaChjaGFsay51bmRlcmxpbmUobXNnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNpZ25hbGUucHVzaChtc2cpO1xuICAgIH1cblxuICAgIGlmIChhZGRpdGlvbmFsLnN1ZmZpeCkge1xuICAgICAgaWYgKHRoaXMuX2NvbmZpZy51bmRlcmxpbmVTdWZmaXgpIHtcbiAgICAgICAgc2lnbmFsZS5wdXNoKGNoYWxrLnVuZGVybGluZShhZGRpdGlvbmFsLnN1ZmZpeCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2lnbmFsZS5wdXNoKGFkZGl0aW9uYWwuc3VmZml4KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2lnbmFsZS5qb2luKCcgJyk7XG4gIH1cblxuICBfd3JpdGUoc3RyZWFtLCBtZXNzYWdlKSB7XG4gICAgaWYgKGlzQnJvd3Nlcikge1xuICAgICAgY29uc3QgcGFyc2VkID0gYW5zaS5wYXJzZShtZXNzYWdlKTtcbiAgICAgIHN0cmVhbS53cml0ZSguLi5wYXJzZWQuYXNDaHJvbWVDb25zb2xlTG9nQXJndW1lbnRzKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuX2ludGVyYWN0aXZlICYmIGlzUHJldmlvdXNMb2dJbnRlcmFjdGl2ZSkge1xuICAgICAgc3RyZWFtLm1vdmVDdXJzb3IoMCwgLTEpO1xuICAgICAgc3RyZWFtLmNsZWFyTGluZSgpO1xuICAgICAgc3RyZWFtLmN1cnNvclRvKDApO1xuICAgIH1cbiAgICBzdHJlYW0ud3JpdGUobWVzc2FnZSArICdcXG4nKTtcbiAgICBpc1ByZXZpb3VzTG9nSW50ZXJhY3RpdmUgPSB0aGlzLl9pbnRlcmFjdGl2ZTtcbiAgfVxuXG4gIF9sb2cobWVzc2FnZSwgc3RyZWFtcyA9IHRoaXMuX3N0cmVhbSkge1xuICAgIGlmICh0aGlzLmlzRW5hYmxlZCkge1xuICAgICAgdGhpcy5fZm9ybWF0U3RyZWFtKHN0cmVhbXMpLmZvckVhY2goc3RyZWFtID0+IHtcbiAgICAgICAgdGhpcy5fd3JpdGUoc3RyZWFtLCBtZXNzYWdlKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIF9sb2dnZXIodHlwZSwgLi4ubWVzc2FnZU9iaikge1xuICAgIHRoaXMuX2xvZyhcbiAgICAgIHRoaXMuX2J1aWxkU2lnbmFsZSh0aGlzLl90eXBlc1t0eXBlXSwgLi4ubWVzc2FnZU9iaiksXG4gICAgICB0aGlzLl90eXBlc1t0eXBlXS5zdHJlYW1cbiAgICApO1xuICB9XG5cbiAgY29uZmlnKGNvbmZpZ09iaikge1xuICAgIHRoaXMuY29uZmlndXJhdGlvbiA9IGNvbmZpZ09iajtcbiAgfVxuXG4gIGRpc2FibGUoKSB7XG4gICAgdGhpcy5fZGlzYWJsZWQgPSB0cnVlO1xuICB9XG5cbiAgZW5hYmxlKCkge1xuICAgIHRoaXMuX2Rpc2FibGVkID0gZmFsc2U7XG4gIH1cblxuICBzY29wZSguLi5uYW1lKSB7XG4gICAgaWYgKG5hbWUubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHNjb3BlIG5hbWUgd2FzIGRlZmluZWQuJyk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgU2lnbmFsZShPYmplY3QuYXNzaWduKHRoaXMuY3VycmVudE9wdGlvbnMsIHsgc2NvcGU6IG5hbWUgfSkpO1xuICB9XG5cbiAgdW5zY29wZSgpIHtcbiAgICB0aGlzLl9zY29wZU5hbWUgPSAnJztcbiAgfVxuXG4gIHRpbWUobGFiZWwpIHtcbiAgICBpZiAoIWxhYmVsKSB7XG4gICAgICBsYWJlbCA9IGB0aW1lcl8ke3RoaXMuX3RpbWVycy5zaXplfWA7XG4gICAgfVxuXG4gICAgdGhpcy5fdGltZXJzLnNldChsYWJlbCwgRGF0ZS5ub3coKSk7XG4gICAgY29uc3QgbWVzc2FnZSA9IHRoaXMuX21ldGEoKTtcblxuICAgIGNvbnN0IHJlcG9ydCA9IFtcbiAgICAgIGNoYWxrLmdyZWVuKHRoaXMuX3R5cGVzLnN0YXJ0LmJhZGdlLnBhZEVuZCgyKSksXG4gICAgICBjaGFsay5ncmVlbi51bmRlcmxpbmUobGFiZWwpLnBhZEVuZCh0aGlzLl9sb25nZXN0TGFiZWwgKyAyMCksXG4gICAgICAnSW5pdGlhbGl6ZWQgdGltZXIuLi4nXG4gICAgXTtcblxuICAgIG1lc3NhZ2UucHVzaCguLi5yZXBvcnQpO1xuICAgIHRoaXMuX2xvZyhtZXNzYWdlLmpvaW4oJyAnKSk7XG4gICAgcmV0dXJuIGxhYmVsO1xuICB9XG5cbiAgdGltZUVuZChsYWJlbCkge1xuICAgIGlmICghbGFiZWwgJiYgdGhpcy5fdGltZXJzLnNpemUpIHtcbiAgICAgIGNvbnN0IGlzID0geCA9PiB4LmluY2x1ZGVzKCd0aW1lcl8nKTtcbiAgICAgIGxhYmVsID0gWy4uLnRoaXMuX3RpbWVycy5rZXlzKCldLnJlZHVjZVJpZ2h0KCh4LCB5KSA9PiB7XG4gICAgICAgIHJldHVybiBpcyh4KSA/IHggOiBpcyh5KSA/IHkgOiBudWxsO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGlmICh0aGlzLl90aW1lcnMuaGFzKGxhYmVsKSkge1xuICAgICAgY29uc3Qgc3BhbiA9IHRpbWVTcGFuKHRoaXMuX3RpbWVycy5nZXQobGFiZWwpKTtcbiAgICAgIHRoaXMuX3RpbWVycy5kZWxldGUobGFiZWwpO1xuXG4gICAgICBjb25zdCBtZXNzYWdlID0gdGhpcy5fbWV0YSgpO1xuICAgICAgY29uc3QgcmVwb3J0ID0gW1xuICAgICAgICBjaGFsay5yZWQodGhpcy5fdHlwZXMucGF1c2UuYmFkZ2UucGFkRW5kKDIpKSxcbiAgICAgICAgY2hhbGsucmVkLnVuZGVybGluZShsYWJlbCkucGFkRW5kKHRoaXMuX2xvbmdlc3RMYWJlbCArIDIwKSxcbiAgICAgICAgJ1RpbWVyIHJ1biBmb3I6JyxcbiAgICAgICAgY2hhbGsueWVsbG93KHNwYW4gPCAxMDAwID8gc3BhbiArICdtcycgOiAoc3BhbiAvIDEwMDApLnRvRml4ZWQoMikgKyAncycpXG4gICAgICBdO1xuXG4gICAgICBtZXNzYWdlLnB1c2goLi4ucmVwb3J0KTtcblxuICAgICAgdGhpcy5fbG9nKG1lc3NhZ2Uuam9pbignICcpKTtcbiAgICAgIHJldHVybiB7IGxhYmVsLCBzcGFuIH07XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU2lnbmFsZTtcbiJdfQ==