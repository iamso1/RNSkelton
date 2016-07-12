/**
 * @flow
 */
import { combineReducers } from 'redux';
import route from './route';
import auth from './auth';
import files from './files';

const rootReducer = combineReducers({
    route,
    auth,
    files,
});

export default rootReducer;
