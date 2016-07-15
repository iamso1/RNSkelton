/**
 * @flow
 */
import FormData from 'FormData';
import URI from 'urijs';
import moment from 'moment';
import { API_URL_BASE, WS_API_HOST } from './buildVar';
import SessionManager from '../utils/sessionManager';

export function getUid(){
    return SessionManager.acn;
}
export function uploadFile(data): Promise{
    let uri = new URI(WS_API_HOST + '/cb_upload_file');

    let options = {
      method: 'POST',
      headers: {
        'Cookie': `nu_code=${SessionManager.sessionToken};`,
        'Content-Type': 'application/json'
      },
      body: data,
      };

    return fetch(uri.toString(), options)
    .then(resp => resp.text())
    .then(resp => {
        if(resp === 'ok') {

        }
    })
    .catch(error => console.warn(error));
}

export function request(endpoint: string, method: string, data: Object = {}, sessionToken: ?string = null, urlBase: string = API_URL_BASE) {
  let uri = new URI(urlBase + endpoint);

  let methodNormalized = method.toUpperCase();
  let options = {
    method: methodNormalized,
    headers: {
    'Cookie': `nu_code=${sessionToken};`
    }
  };

  if (methodNormalized === 'GET') {
    uri.addSearch(data);
  } else {
    options.body = JSON.stringify(data);
    options.headers['Content-Type'] = 'application/json';
  }

    return fetch(uri.toString(), options);
}

export function getMyCsServer(): Promise<string> {
  let params = {
    acn: SessionManager.acn,
    ssn: SessionManager.ssn,
    mode: 'owner',
    type: 0,
    json: 1,
  };

  return request('/CS_Site/get_manage_sitelist.php', 'GET', params, SessionManager.sessionToken, SessionManager.wnsServer)
    .then(resp => resp.json())
    .then(resp => {

      if (resp.length <= 0) { return null; }
      let {site_acn} = resp[0];
      let csServerName = site_acn.split('.')[1];
      let csServer = `http://${csServerName}.nuweb.cc`;
      return csServer;
    });
}

export function getRealIP(){
    return getMyServerName()
    .then(serverName => getCurrectIP('acn', serverName));
}

export function getMyServerName(): Promise<string> {
  let params = {
    acn: SessionManager.acn,
    ssn: SessionManager.ssn,
    mode: 'owner',
    type: 0,
    json: 1,
  };
  return request('/CS_Site/get_manage_sitelist.php', 'GET', params, SessionManager.sessionToken, SessionManager.wnsServer)
    .then(resp => resp.json())
    .then(resp => {
      if (resp.length <= 0) { return null; }
      let {site_acn} = resp[0];
      return site_acn.split('.')[1];
    });
}

export function composeShowUrl(csServer: string, url: string): ?string {
  if (!url) { return null; }
  let params = {
    page_url: encodeURIComponent(url),
    err_mode: 'code',
    group_login: -1,
    nu_code: encodeURIComponent(SessionManager.sessionToken),
  };

  let qs = Object.keys(params).map(key => {
    return `${key}=${params[key]}`;
  }).join('&');

  return `${csServer}/tools/page/show_page.php?${qs}`;
}


export function composeThumbUrl(csServer: string, url: string, type: string, size: number): ?string {
  if (!url) { return null; }
  let params = {
    page_url: encodeURIComponent(url),
    nu_code: encodeURIComponent(SessionManager.sessionToken),
    type: type,
    size: size,
  };

  let qs = Object.keys(params).map(key => {
    return `${key}=${params[key]}`;
  }).join('&');

  return `${csServer}/tools/api_get_thumbs.php?${qs}`;
}


export function composeVideoUrl(csServer: string, url: string, size: number): Promise<string> {
  if (!url) { return null; }
  const params = {
    file_path: url,
    mode: 'file',
    act: 'GetPlayList',
  };

  return request('/tools/api_tools.php', 'GET', params, SessionManager.sessionToken, csServer)
    .then(resp => resp.json())
    .then(resp => {
      if (resp.mp4_list == null || resp.mp4_list.length === 0) {
        return Promise.reject('Invalid video list - ' + resp);
      }
      // Assume resp.mp4_list is sorted by size descend
      for (let mp4Info of resp.mp4_list) {
        if (mp4Info.size <= size) {
          return mp4Info.oid;
        }
      }
      return Promise.reject('Unable to find valid video - ' + resp);
    })
    .then(videoPath => {
      const _params = {
        nu_code: encodeURIComponent(SessionManager.sessionToken),
        group_login: '-1',
      };

      const qs = Object.keys(_params).map(key => {
        return `${key}=${_params[key]}`;
      }).join('&');
      return `${csServer}${videoPath}?${qs}`;
    });
}

export function getFileContent(csServer: string, url: string): Promise<?string> {
  if (!url) { return null; }
  let params = {
    mode: 'file',
    act: 'GetPageInfo',
    file_path: url,
    get_content: 'y',
  };

  return request('/tools/api_tools.php', 'GET', params, SessionManager.sessionToken, csServer)
    .then(resp => resp.json())
    .then(resp => {
      const content = resp.content;
      return content;
    });
}

export function getDirectoryPathByName(csServer: string, path: string, name: string): Promise<?string> {
  const params = {
    mode: 'search',
    act: 'all',
    file_path: path,
    dir: path,
    ps: 200,    // Don't do too much pagination here and assume sync folder should be within 200
    o_fields: 'title,type,url',
  };
  return request('/tools/api_tools.php', 'GET', params, SessionManager.sessionToken, csServer)
    .then(resp => resp.json())
    .then(resp => {
      for (const rec of resp.recs) {
        if (rec.title === name && rec.type === 'Directory') {
          return rec.url;
        }
      }
      return null;
    });
}

export function createDirectory(csServer: string, path: string, name: string): Promise<?string> {
  let params = {
    mode: 'create_dir',
    code: 'nuweb_editpass',
    path,
    name,
};

  return request('/Site_Prog/API/edit_api.php', 'GET', params, SessionManager.sessionToken, csServer)
    .then(resp => resp.text());
}

export function getOrCreateDirectory(csServer: string, path: string, name: string): Promise<string> {
  return getDirectoryPathByName(csServer, path, name)
    .then(_path => {
      if (_path) { return _path; }
      return createDirectory(csServer, path, name);
    })
    .catch(error => Promise.reject(error));
}

export function getThumbImage(csServer: string, url: string, type: string){
    return `${csServer}/tools/api_get_thumbs.php?page_url=${url}&type=${type}`;
}

//暫時需要使用的Function
export function getCurrectIP(mode: string, keyword: string): Promise<string>{
    const uri = `http://wns.nuweb.cc:8080/wns/ip_get.php?mode=${mode}&keyword=${keyword}`;
    return fetch(uri)
    .then((resp) => resp.text())
    .then((resp) => {
        let arr = resp.trim().split('\t');
        return `${arr[4]}:${arr[5]}`;
    });
}

export function uploadImage(csServer: string, path: string, fileUri: string, fileName: string): Promise {
  const form = new FormData();
  form.append('mode', 'upload_file');
  form.append('path', path);
  form.append('filename', fileName);
  form.append('code', 'nuweb_editpass');
  form.append('file', { uri: fileUri, name: fileName });


  const options = {
    method: 'POST',
    headers: {
      'Cookie': `nu_code=${SessionManager.sessionToken};`
    },
    body: form,
  };

  getMyServerName()
  .then((serverName) => {
     return getCurrectIP('acn', serverName);
 }).then((currectUri) => {
     const uri = `http://${currectUri}/API/upload_file.php`;
     return fetch(uri, options)
       .then(resp => resp.text())
       .then(resp => {
         const reMatch = resp.match(/^Error: (.+)/);
         if (reMatch) {
           return Promise.reject(reMatch[1]);
         }
         return resp;
       });
 });
}
