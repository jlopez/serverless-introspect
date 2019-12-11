# Serverless Introspect

This diagnostic [Serverless](https://github.com/serverless/serverless) plugin
allows dumping all available serverless commands as well as all the event hooks
triggered by each command. This is extremely useful when developing new
serverless plugins that rely on properly integrating with existing serverless
commands and which need to run at a moment during the execution of such commands.

# Installation

First, add the plugin to your project:

`npm install --save-dev serverless-introspect`

Then, inside your project's `serverless.yml` file add `serverless-introspect`
to the top-level plugins section.  If there is no plugin section you will need
to add it to the file.

```YAML
plugins:
  - serverless-introspect
```

# Usage

The plugin adds two commands:

## `serverless introspect events`

This command dumps all available lifecycle events next to a hierarchical tree
of the available serverless commands:

```
$ serverless introspect events
introspect: interactiveCli                   initializeService, setupAws, tabCompletion, end
introspect: config
introspect:   credentials                    config
introspect:   tabcompletion
introspect:     install                      install
introspect:     uninstall                    uninstall
introspect: create                           create
introspect: install                          install
introspect: package                          cleanup, initialize, setupProviderConfiguration, createDeploymentArtifacts, compileLayers, compileFunctions, compileEvents, finalize
introspect:   function*                      package

...

introspect: introspect!
introspect:   events                         run
introspect:   hooks                          run
introspect: offline                          start
introspect:   start                          init, end
introspect: login                            login
introspect: logout                           logout
introspect: generate-event                   generate-event
introspect: test                             test
introspect: dashboard                        dashboard
```

In this example, we can see that the `offline` command has the
lifecycle event `start`. This means that when `serverless offline`
is run, the following events will be fired:

* `before:offline:start`
* `offline:start`
* `after:offline:start`

Similarly, the `package` command has several lifecycle events, which
will cause the following events to fire:

* `before:package:cleanup`
* `package:cleanup`
* `after:package:cleanup`
* `before:package:initialize`
* `package:initialize`
* `after:package:initialize`
* `before:package:setupProviderConfiguration`
* etc...

Commands annotated with `*` are internal commands that can only be
invoked internally by `serverless`. Commands annotated with `!` are
container commands that cannot be invoked by themselves.

## `serverless introspect hooks`

This command displays all the plugins hooked up to the available fully qualified
events. You may filter the events by providing the command whose lifecycle events
should be displayed:

```
$ sls introspect hooks -c offline
introspect: before:offline:start                                             ServerlessHooks, ServerlessOfflineKinesis
introspect:        offline:start                                             ServerlessOffline
introspect:  after:offline:start                                             ServerlessHooks
```

This example shows that the `ServerlessHooks`, `ServerlessOfflineKinesis`
and `ServerlessOffline` are connected to the various `offline` command
lifecycle events.
