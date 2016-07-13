/**
 * @flow
 */
import React from 'react'; // eslint-disable-line no-unused-vars
import {
  View,
  Text,
} from 'react-native';
import RouteBase from './base';
import ViewerImageScene from '../containers/ViewerImageScene';
import ViewerMediaScene from '../containers/ViewerMediaScene';
import ViewerWebScene from '../containers/ViewerWebScene';


export class RouteViewerImage extends RouteBase {
  static PATTERN = '/viewers/image:?query:';

  renderScene(navigator: Object, query: Object): Function {
    const { name, csServer, path } = query;
    if (!query || !path || !csServer) {
      return <View><Text>Invalid parameters.</Text></View>;
    }
    return (
      <ViewerImageScene
        navigator={navigator}
        csServer={csServer}
        name={name}
        path={path}/>
    );
  }
}


export class RouteViewerMedia extends RouteBase {
  static PATTERN = '/viewers/media:?query:';

  renderScene(navigator, query) {
    let { type, csServer, path, name } = query;

    if (!query || !query.path || !query.csServer || !query.type) {
      return <View><Text>Invalid parameters.</Text></View>;
    }

    path = (query.q) ? `${csServer}?${query.q}&type=Video` : query.path;


    return (
      <ViewerMediaScene
        navigator={navigator}
        type={type}
        csServer={csServer}
        name = {name}
        path={path}/>
    );
  }
}


export class RouteViewerWeb extends RouteBase {
  static PATTERN = '/viewers/web:?query:';

  renderScene(navigator: Object, query: Object): Function {
    const { type, url, csServer, hash, name } = query;
    let isValidParam = false;
    const props = {
      type,
    };
    if (type === 'link' && url) {
      isValidParam = true;
      props.url = url;
      props.hash = hash;
    } else if (type === 'document' && url && csServer) {
      isValidParam = true;
      props.url = url;
      props.csServer = csServer;
    } else if (type === 'html' && url && csServer) {
      isValidParam = true;
      props.url = url;
      props.csServer = csServer;
    }

    if (!isValidParam) {
      return <View><Text>Invalid parameters.</Text></View>;
    }

    return (
      <ViewerWebScene
        navigator={navigator}
        name={name}
        {...props}
      />
    );
  }
}
