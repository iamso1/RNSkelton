/**
 * @flow
 */
import React from 'react'; // eslint-disable-line no-unused-vars
import RouteBase from './base';
import FilesScene from '../containers/FilesScene';
import FileGroupsScene from '../containers/FileGroupsScene';

export class RouteFiles extends RouteBase {
  static PATTERN = '/files/:?query:';

  renderScene(navigator:Object, query: Object) {
    let { name, csServer, path, type } = query || {};

    return (
      <FilesScene
        navigator={navigator}
        name={name}
        csServer={csServer}
        path={path}
        type={type}/>
    );
  }
}

export class RouteFileGroups extends RouteBase {
  static PATTERN = '/fileGroups/:?query:';

  renderScene(navigator, query) {
    console.log('filesgroup');
    return (
      <FileGroupsScene
        navigator={navigator}
      />
    );
  }
}
