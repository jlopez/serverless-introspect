const _ = require('lodash');

class ServerlessIntrospect {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.pluginName = 'serverless-introspect';

    this.commands = {
      introspect: {
        type: 'container',
        commands: {
          events: {
            usage: 'List all available events in the system',
            lifecycleEvents: ['run'],
          },
          hooks: {
            usage: 'List all available hooks and the plugins connected to them',
            options: {
              command: {
                usage: 'Limit hooks to the ones provided by the provided command',
                shortcut: 'c',
                type: 'string',
                customValidation: {
                  regularExpression: /^[a-z]+(:[a-z]+)*$/,
                  errorMessage: 'Commands should be provided in a:b:c format',
                },
              },
            },
            lifecycleEvents: ['run'],
          },
        },
      },
    };

    this.hooks = {
      'introspect:events:run': this.introspectEvents.bind(this),
      'introspect:hooks:run': this.introspectHooks.bind(this),
    };
  }

  log(msg) {
    this.serverless.cli.log(msg, this.pluginName);
  }

  introspectEvents() {
    this.dumpEvents(this.serverless.pluginManager.commands);
  }

  dumpEvents(commands, indent = '') {
    _.forEach(commands, (details, command) => {
      let name = indent + command;
      if (details.type === 'entrypoint') name = `${name}*`;
      if (details.type === 'container') name = `${name}!`;
      this.log(`${name.padEnd(32)} ${(details.lifecycleEvents || []).join(', ')}`);
      this.dumpEvents(details.commands, `${indent}  `);
    });
  }

  buildEventIndices(commands, parents = [], rv = {}) {
    _.forEach(commands, (d, c) => {
      const chain = _.concat(parents, c);
      if (_.size(d.lifecycleEvents)) {
        const command = chain.join(':');
        // eslint-disable-next-line no-param-reassign
        rv[command] = _.fromPairs(d.lifecycleEvents.map((e, i) => [e, i]));
      }
      this.buildEventIndices(d.commands, chain, rv);
    });
    return rv;
  }

  introspectHooks() {
    const filter = this.options.command
      ? (e) => e.command === this.options.command
      : _.stubTrue;
    const orderIndices = { 'before:': 0, '': 1, 'after:': 2 };
    const eventIndices = this.buildEventIndices(this.serverless.pluginManager.commands);
    eventIndices[''] = { initialize: 0 };
    _.chain(this.serverless.pluginManager.hooks)
      .toPairs()
      .map(([hook, hooks]) => ({
        command: hook.replace(/^before:|after:/, '').split(':').slice(0, -1).join(':'),
        order: hook.match(/^before:|after:|/)[0],
        event: hook.split(':').slice(-1)[0],
        hook,
        hooks,
      }))
      .filter(filter)
      .map((e) => _.assign(e, ({
        eventIndex: eventIndices[e.command][e.event],
        orderIndex: orderIndices[e.order],
      })))
      .sortBy(['command', 'eventIndex', 'orderIndex'])
      .forEach((e) => this.log(`${`${e.order.padStart(7)}${e.command}:${e.event}`.padEnd(64)} ${_.chain(e.hooks).map('pluginName').join(', ')}`))
      .value();
  }
}

module.exports = ServerlessIntrospect;
