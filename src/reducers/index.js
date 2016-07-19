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
import chatroom from './chatroom';
import posts from './posts';

const rootReducer = combineReducers({
    route,
    auth,
    files,
    settings,
    notifications,
    viewerImage,
    viewerMedia,
    viewerWeb,
    chatroom,
    posts,
});

export default rootReducer;
