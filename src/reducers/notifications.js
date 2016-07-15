/**
 * @flow
 */
 import * as ActionTypes from '../constants/ActionTypes';
import createReducer from '../utils/createReducer';
import Immutable from 'immutable';

const initialState = Immutable.Map();

export default createReducer(initialState, {
  [ActionTypes.NOTIFICATION_GET_LIST_RECEIVED](state, action) {
    const newState = Immutable.fromJS(action.data);
    return newState;
  },
});
