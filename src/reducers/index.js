/**
 * @flow
 */
import { combineReducers } from 'redux';
import route from './route';
import auth from './auth';
import files from './files';
import settings from './settings';

const rootReducer = combineReducers({
    route,
    auth,
    files,
    settings,
});

export default rootReducer;
