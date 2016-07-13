/**
 * @flow
 */
import * as ActionTypes from '../constants/ActionTypes';
import createReducer from '../utils/createReducer';

const Immutable = require('immutable');

const initialState = Immutable.Map();

export default createReducer(initialState, {
  [ActionTypes.VIEWER_MEDIA_RESET](state, action) {
    return initialState;
  },
  [ActionTypes.VIEWER_MEDIA_GET_URL_RECEIVED](state, action) {
    return Immutable.Map({
      url: action.url,
    });
  },
});
