/**
 * @flow
 */
import React from 'react'; // eslint-disable-line no-unused-vars
import RouteBase from './base';
import NotificationsScene from '../containers/NotificationsScene';

export class RouteNotifications extends RouteBase {
  static PATTERN = '/notifications/:?query:';

    renderScene(navigator: Object, query: Object): Function {
        console.log(query);
        return (
            <NotificationsScene
                navigator={navigator} />
        );
    }
}
