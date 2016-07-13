/**
 * @flow
 */
import * as ActionTypes from '../constants/ActionTypes';
import {
  composeShowUrl,
  composeVideoUrl,
  getFileContent,
} from '../utils/apiWrapper';


export function getFileUrlForViewerImage(csServer: string, url: string): {type: string, url: string} {
    let currectURL;
    if(url.match('http://') || url.match('https://')){
        currectURL = url;
    }else{
        currectURL = composeShowUrl(csServer, url);
    }
  return {
    type: ActionTypes.VIEWER_IMAGE_GET_URL_RECEIVED,
    url: currectURL,
  };
}

export function resetViewerImage() {
  return { type: ActionTypes.VIEWER_IMAGE_RESET };
}


export function getFileUrlForViewerVideo(csServer: string, url: string): Function {
  return (dispatch, getState) => {
    if(url.match('http://') || url.match('https://')){
        dispatch({
          type: ActionTypes.VIEWER_MEDIA_GET_URL_RECEIVED,
          url: url,
        });
    }else{
        return composeVideoUrl(csServer, url, 720)  // TODO
          .then(videoUrl => {
            dispatch({
              type: ActionTypes.VIEWER_MEDIA_GET_URL_RECEIVED,
              url: videoUrl,
            });
            return videoUrl;
          })
          .catch(error => {
            console.warn(error);
          });
    }

  };
}

export function getFileUrlForViewerAudio(csServer: string, url: string): {type: string, url: string} {
    let currectURL;
    if(url.match('http://') || url.match('https://')){
        currectURL = url;
    }else{
        currectURL = composeShowUrl(csServer, url);
    }
  return {
    type: ActionTypes.VIEWER_MEDIA_GET_URL_RECEIVED,
    url: currectURL,
  };
}

export function resetViewerMedia() {
  return { type: ActionTypes.VIEWER_MEDIA_RESET };
}

export function getFileUrlForViewerDocument(csServer: string, url: string): {type: string, url: string} {
  return {
    type: ActionTypes.VIEWER_WEB_GET_URL_RECEIVED,
    url: composeShowUrl(csServer, url),
  };
}

export function getContentForViewerHtml(csServer: string, url: string): Function {
  return (dispatch, getState) => {
    return getFileContent(csServer, url)
      .then(content => {
        dispatch({
          type: ActionTypes.VIEWER_WEB_GET_CONTENT_RECEIVED,
          content: content,
        });
        return content;
      })
      .catch(error => {
        console.warn(error);
      });
  };
}

export function resetViewerWeb() {
  return { type: ActionTypes.VIEWER_WEB_RESET };
}
