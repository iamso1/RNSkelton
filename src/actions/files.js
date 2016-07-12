/**
 * @flow
 */
import * as ActionTypes from '../constants/ActionTypes';
import {
  request,
  getMyCsServer,
  composeShowUrl as apiComposeShowUrl,
  composeThumbUrl as apiComposeThumbUrl,
  createDirectory as apiCreateDirectory,
} from '../utils/apiWrapper';
import SessionManager from '../utils/sessionManager';


function filterDirectory(data: Object, hasNextPaging: boolean): Promise<[Object, boolean]> {
  data = data.filter(rec => {
    let toBeFiltered = false;
    if (rec.type === 'Directory' &&
        ['forum', 'vote', 'table', 'shop', 'bookmark'].indexOf(rec.dir_type) !== -1)
    {
      // Exclude unsupported dir_type
      toBeFiltered = true;
    } else if (rec.dir_type === 'OokonStorage' && rec.url === `/Site/${SessionManager.acn}/Driver`) {
      // Exclude Driver directory in case query for /
      // That is this app's special case from UI design
      toBeFiltered = true;
    }
    return !toBeFiltered;
  });

  return [data, hasNextPaging];
}

function composeData(csServer:  ?string, data: Object, hasNextPaging: boolean): Promise<[Object, boolean]> {
  data.forEach(rec => {
    rec.csServer = csServer;
    if (rec.type === 'Image') {
      rec.imageUrl = apiComposeShowUrl(csServer, rec.url);
      rec.thumbUrl = apiComposeThumbUrl(csServer, rec.thumbs, rec.type, 160);
    }
    else if (rec.type === 'Video' || rec.type === 'Link') {
      rec.thumbUrl = apiComposeShowUrl(csServer, rec.thumbs);
    }
  });

  return [data, hasNextPaging];
}

function addMyWebEntity(path: ? string, data: Object, hasNextPaging: boolean): Promise<[Object, boolean]> {
  // Only add MyWeb for root path
  if (path == null) {
    data.unshift({
      url: SessionManager.acn + '/',
      type: 'Directory',
      dir_type: 'directory',
      filename: '我的網站',
    });
  }
  return [data, hasNextPaging];
}

type ResourceType =
  'Image' |
  'Video' |
  'Audio' |
  'Html' |
  'Document,Text' |
  'Link';

export function composeFilesKey(type: ResourceType, path: string): string {
  if (type) {
    return `_ResType_${type}`;
  }
  return path;
}

export function getFileList(csServer: ?string, listPath: ?string, type: ?ResourceType, page: number = 1, pageSize: number = 100): Function {
  return (dispatch, getState) => {
    let outputFields = [
      'url', 'filename', 'title', 'page_name', 'size', 'owner', 'last_acn', 'time', 'mtime',
      'description', 'content', 'dir_type', 'type', 'tag', 'md5', 'link_url',
      'view_path' , 'pw',
      'thumbs',
    ];

    let path = listPath;
    if (!path) {
      path = type ? SessionManager.acn : SessionManager.acn + '/Driver/';
    }
    let params = {
      mode: 'search',
      file_path: path,
      p: page,
      ps: pageSize,
      o_fields: outputFields.join(','),
    };

    if (type) {
      params.type = type;
    } else {
      params.dir = path;
    }

    let queryCsServer = null;
    return Promise.resolve(csServer)
      .then(_csServer => _csServer || getMyCsServer())
      .then(_csServer => {
        queryCsServer = _csServer;
        return request('/tools/api_tools.php', 'GET', params, SessionManager.sessionToken, queryCsServer);
      })
      .then(resp => {
        return resp.json()
      })
      .then(resp => {
        let {cnt, recs} = resp;
        let hasNextPaging = cnt >= pageSize;
        return [recs, hasNextPaging];
      })
      .then(([data, hasNextPaging]) => {
        if (!type) {
          return addMyWebEntity(listPath, data, hasNextPaging);
        }
        return [data, hasNextPaging];
      })
      .then(([data, hasNextPaging]) => filterDirectory(data, hasNextPaging))
      .then(([data, hasNextPaging]) => composeData(queryCsServer, data, hasNextPaging))
      .then(([data, hasNextPaging]) => {
        dispatch({
          type: ActionTypes.FILE_LIST_RECEIVED,
          path: composeFilesKey(type, listPath),
          data,
          hasNextPaging,
          csServer: queryCsServer,
        });
        return true;
      })
      .catch(error => {
        console.error('getFileList() error - ' + error);
      });
  };
}


export function cleanupFileListData(path: string): {type: string, path: string} {
  return {
    type: ActionTypes.FILE_LIST_RESET,
    path: path,
  };
}

export function createDirectory(csServer: string, path: string, name: string): Function {
  return (dispatch, getState) => {
    return apiCreateDirectory(csServer, path, name)
      .then(newPath => {
        dispatch(getFileList(path));
        return newPath;
      })
      .catch(error => {
        console.error('createDirectory() error - ' + error);
      });
  };
}
