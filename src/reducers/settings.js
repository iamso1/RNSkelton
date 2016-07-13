/**
 * @flow
 */
import * as ActionTypes from '../constants/ActionTypes';
import createReducer from '../utils/createReducer';

const Immutable = require('immutable');

const initialState = Immutable.Map({});

export default createReducer(initialState, {
  [ActionTypes.SETTINGS_RECEIVED](state, action) {
    return state.set(action.key, Immutable.fromJS(action.settings));
    //return Object.assign({}, state, { [`${action.key}`]: action.value });
  },
});
