/**
 * @flow
 */
 import * as ActionTypes from '../constants/ActionTypes';
import createReducer from '../utils/createReducer';

let Immutable = require('immutable');

const initialState = Immutable.Map();

export default createReducer(initialState, {
  [ActionTypes.FILE_LIST_RESET](state, action) {
    return state.delete(action.path);
  },
  [ActionTypes.FILE_LIST_RECEIVED](state, action) {
    let path = action.path;

    if (state.get(path)) {
      let newState = state.update(path, pathData => {
        return pathData
          .update('files', (files) => {
            return files.concat(Immutable.fromJS(action.data));
           })
          .set('hasNextPaging', action.hasNextPaging);
      });
      return newState;
    } else {
        
      let pathData = Immutable.Map({
        files: Immutable.fromJS(action.data),
        hasNextPaging: action.hasNextPaging,
        csServer: action.csServer,
      });
      return state.set(path, pathData);
    }
  },
});
