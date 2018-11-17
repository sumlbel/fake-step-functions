'use strict';

const jsonpath = require('jsonpath');


class FakeStateMachine {
  constructor(definition, fakeResources) {
    this.definition = definition;
    this.fakeResources = fakeResources;
  }

  run(input) {
    const startAt = this.definition.StartAt;
    if (startAt === undefined) {
      throw new Error('StartAt does not exist');
    }
    return this.runState(startAt, input);
  }

  runState(stateName, _data) {
    const state = this.definition.States[stateName];
    const stateType = state.Type;
    const data = Object.assign({}, _data);

    switch (stateType) {
      case 'Task': {
        const resourceArn = state.Resource;
        const resource = this.fakeResources[resourceArn];
        const input = jsonpath.value(data, state.InputPath);
        jsonpath.value(data, state.ResultPath, resource(input));
        return data;
      }
      case 'Pass': {
        const dataInputPath = state.InputPath ? jsonpath.value(data, state.InputPath) : null;
        const newValue = state.Input || dataInputPath; // TODO: priority?
        jsonpath.value(data, state.ResultPath, newValue);
        return data;
      }
      case 'Choice':
      case 'Wait':
      case 'Succeed':
      case 'Fail':
      case 'Parallel':
        return data;
      default:
        throw new Error(`Invalid Type: ${stateType}`);
    }
  }
}
exports.FakeStateMachine = FakeStateMachine;