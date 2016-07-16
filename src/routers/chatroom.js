/**
 * @flow
 */
import React from 'react'; // eslint-disable-line no-unused-vars
import {
  View,
  Text,
} from 'react-native';
import RouteBase from './base';
import ChatRoomsScene from '../containers/ChatRoomsScene';
//import MessageList from '../containers/MessageList';
/*
export class RouteMsgDetail extends RouteBase{
    static PATTERN='/msgDetail/:?query:';

    renderScene(navigator: Object, query: Object){
        const { cid, csServer } = query;

        return (<MessageList
                navigator={ navigator }
                cid = { cid }
                csServer= { csServer }/>);
    }
}
*/
export class RouteChatroom extends RouteBase {
  static PATTERN = '/chatroom/:?query:';

  renderScene(navigator: Object, query: Object) {
    const { csServer } = query;
    return (
        <ChatRoomsScene
            navigator = {navigator}
            csServer={csServer} />
    );
  }
}
