/**
 * @flow
 */
import React, {
    PropTypes
} from 'react';

import {
    View,
} from 'react-native';
import {changeRoute} from '../actions/route';

export default class FileHandlerBase extends React.Component {
    constructor(props) {
        super(props);
        this.handleSelectDirectory = this.handleSelectDirectory.bind(this);
        this.handleSelectImage = this.handleSelectImage.bind(this);
        this.handleSelectVideo = this.handleSelectVideo.bind(this);
        this.handleSelectMedia = this.handleSelectMedia.bind(this);
        this.handleSelectAudio = this.handleSelectAudio.bind(this);
        this.handleSelectLink = this.handleSelectLink.bind(this);
        this.handleSelectDocument = this.handleSelectDocument.bind(this);
        this.handleSelectHtml = this.handleSelectHtml.bind(this);
    }
    handleSelectMedia(type: string, name: string, csServer: string, url: string) {
        this.props.dispatch(changeRoute(`/viewers/media?name=${name}&type=${type}&csServer=${csServer}&path=${url}`,
            this.props.navigator.props.navKey));
    }

    handleSelectAudio(name: string, csServer: string, url: string) {
        this.handleSelectMedia('audio', name, csServer, url);
    }

    handleSelectVideo(name: string, csServer: string, url: string) {
        console.log(url);
        this.handleSelectMedia('video', name, csServer, url);
    }

    handleSelectDirectory(name: ? string, csServer : string, url: string) {
        this.props.dispatch(changeRoute(`/files/?name=${name}&csServer=${csServer}&path=${url}`,
            this.props.navigator.props.navKey));
    }

    handleSelectImage(name: string, csServer: string, url: string) {
        this.props.dispatch(changeRoute(`/viewers/image?name=${name}&csServer=${csServer}&path=${url}`,
            this.props.navigator.props.navKey));
    }

    handleSelectLink(name: string, url: string) {
        this.props.dispatch(changeRoute(`/viewers/web?name=${name}&type=link&url=${url}`,
            this.props.navigator.props.navKey));
    }

    handleSelectDocument(name: string, csServer: string, url: string) {
        this.props.dispatch(changeRoute(`/viewers/web?name=${name}&type=document&csServer=${csServer}&url=${url}`,
            this.props.navigator.props.navKey));
    }

    handleSelectHtml(name: string, csServer: string, url: string) {
        this.props.dispatch(changeRoute(`/viewers/web?name=${name}&type=html&csServer=${csServer}&url=${url}`,
            this.props.navigator.props.navKey));
    }
}
