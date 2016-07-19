/**
 * @flow
 */
import React from 'react'; // eslint-disable-line no-unused-vars
import RouteBase from './base';
import _ from 'lodash';
import SessionManager from '../utils/sessionManager';
import PostListScene from '../containers/PostListScene';

export class RoutePostList extends RouteBase{
    static PATTERN='/postlist/:?query:';

    renderScene(navigator: Object, query: Object): Function{
        let { name, path, act, as, csServer } = query || {};
        if(_.isUndefined(path)) path = SessionManager.acn;
        return <PostListScene
            navigator={navigator}
            path={path}
            name={name}
            csServer={csServer} />
    }
}

export class RoutePostDetail extends RouteBase{
    static PATTERN='/postdetail/:?query:';

    renderScene(navigator: Object, query: Object): Function{
        return <PostDetailScene
            navigator={navigator} />;
    }
}
