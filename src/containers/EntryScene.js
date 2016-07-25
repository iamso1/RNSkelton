/**
 * @flow
 */
import React from 'react';
import {
    Linking,
} from 'react-native';
import {
    connect
} from 'react-redux';
import {
    replaceRoute
} from '../actions/route';
import {
    checkAppSessionState
} from '../actions/auth';
import {
    getRemoteSetting,
} from '../actions/settings';
import AppSessionState from '../constants/AppSessionState';
import WebsocketManager from '../utils/websocketManager';

import axios from 'axios';

class EntryScene extends React.Component {
    constructor(props){
        super(props);
    }

    componentDidMount() {
        //check login state
        this.props.dispatch(checkAppSessionState());
    }

    componentWillReceiveProps(nextProps) {
        const {auth} = nextProps;
        if (this.props.auth !== auth && auth.action === 'checkAppSessionState') {
          switch (auth.appSessionState) {
            case AppSessionState.FirstLaunch:
              // this.props.dispatch(replaceRoute('/pages/walkthrough', this.props.navigator.props.navKey));
              break;
            case AppSessionState.Logon:
              WebsocketManager.connect();
              this.props.dispatch(getRemoteSetting());
              this._getRouteWithDeepLink().then(route => {
                this.props.dispatch(replaceRoute(route, this.props.navigator.props.navKey));
              });
              break;
            default:
              this.props.dispatch(replaceRoute('/auth/login', this.props.navigator.props.navKey));
              break;
          }
        }
   }


  _getRouteWithDeepLink() {

    const DEFAULT_ROUTE = '/main';
    return Linking.getInitialURL().then(url => {
      // FIXME: Add DeepLink guard
      let route = DEFAULT_ROUTE;
      if (url) {
        route = url.substr(10);
        if (!route || route === '/') {
          route = DEFAULT_ROUTE;
        }
      }
      return route;
    });
  }

  render() {
    return null;
  }
}


function mapStateToProps(state) {
  const {auth} = state;

  return {
    auth
  };
}

export default connect(mapStateToProps, null, null, { withRef: true })(EntryScene);
