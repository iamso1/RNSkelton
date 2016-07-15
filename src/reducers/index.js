/**
 * @flow
 */
import { combineReducers } from 'redux';
import route from './route';
import auth from './auth';
import files from './files';
import settings from './settings';
import viewerImage from './viewerImage';
import viewerMedia from './viewerMedia';
import viewerWeb from './viewerWeb';
import notifications from './notifications';

const rootReducer = combineReducers({
    route,
    auth,
    files,
    settings,
    notifications,
    viewerImage,
    viewerMedia,
    viewerWeb,
});

export default rootReducer;
