/**
 * @flow
 */
import React from 'react'; // eslint-disable-line no-unused-vars
import RouteBase from './base';
import FilesScene from '../containers/FilesScene';
import FileGroupsScene from '../containers/FileGroupsScene';
import GridImageScene from '../containers/GridImageScene';
import GridVideoScene from '../containers/GridVideoScene';

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
    return (
      <FileGroupsScene
        navigator={navigator} />
    );
  }
}

export class RouteGridImage extends RouteBase {
  static PATTERN = '/grids/image:?query:';

  renderScene(navigator: Object, query: Object) {
    return (
      <GridImageScene
        navigator={navigator} />
    );
  }
}

export class RouteGridVideo extends RouteBase {
  static PATTERN = '/grids/video:?query:';

  renderScene(navigator: Object, query: Object = {}) {
    return (
      <GridVideoScene
        navigator={navigator} />
    );
  }
}
