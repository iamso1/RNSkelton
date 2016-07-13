/**
 * @flow
 */
import React, { PropTypes } from 'react';

import {
  Text,
  View,
  Image,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import Immutable from 'immutable';
import Icon from 'react-native-vector-icons/FontAwesome';

import PureRenderMixin from 'react-addons-pure-render-mixin';

export default class FileEntityView extends React.Component {
  constructor(props) {
    super(props);
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
  }

  static propTypes = {
    file: PropTypes.instanceOf(Immutable.Map).isRequired,
    onSelectDirectory: PropTypes.func.isRequired,
    onSelectImage: PropTypes.func.isRequired,
    onSelectVideo: PropTypes.func.isRequired,
    onSelectAudio: PropTypes.func.isRequired,
    onSelectLink: PropTypes.func.isRequired,
    onSelectDocument: PropTypes.func.isRequired,
    onSelectHtml: PropTypes.func.isRequired,
  };

  _renderImpl(file, iconName, iconColor, onSelect) {
    let leftContainerView = null;
    if (file.get('thumbUrl')) {
      leftContainerView = (
        <Image
          style={[styles.leftContainer, styles.thumb]}
          source={{uri: file.get('thumbUrl')}}
        />
      );
    } else {
      leftContainerView = (
        <View style={styles.leftContainer}>
          <Icon
            name={iconName}
            size={25}
            color={iconColor}
          />
        </View>
      );
    }

    return (
      <TouchableWithoutFeedback onPress={onSelect}>
        <View style={styles.container}>
          {leftContainerView}

          <Text style={styles.name}>
            {file.get('filename')}
          </Text>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  render() {
    let {file} = this.props;
    let type = file.get('type');

    switch (type) {
      case 'Directory':
        return this._renderImpl(file, 'folder-o', '#62c4ff', () => {
          this.props.onSelectDirectory(file.get('filename'), file.get('csServer'), file.get('url'));
        });
      case 'Video':
        return this._renderImpl(file, 'file-video-o', '#1d3a4c', () => {
          this.props.onSelectVideo(file.get('filename'), file.get('csServer'), file.get('url'));
        });
      case 'Audio':
        return this._renderImpl(file, 'file-audio-o', '#1d3a4c', () => {
          this.props.onSelectAudio(file.get('filename'), file.get('csServer'), file.get('url'));
        });
      case 'Image':
        return this._renderImpl(file, 'file-image-o', '#1d3a4c', () => {
          this.props.onSelectImage(file.get('filename'), file.get('csServer'), file.get('url'));
        });
      case 'Document':
        return this._renderImpl(file, 'file-text-o', '#1d3a4c', () => {
          this.props.onSelectDocument(file.get('filename'), file.get('csServer'), file.get('url'));
        });
      case 'Text':
      case 'Html':
        return this._renderImpl(file, 'file-text-o', '#1d3a4c', () => {
          this.props.onSelectHtml(file.get('filename'), file.get('csServer'), file.get('url'));
        });
      case 'Link':
        return this._renderImpl(file, 'link', '#1d3a4c', () => {
          this.props.onSelectLink(file.get('filename'), file.get('link_url'));
        });
        case 'Other':
            return this._renderImpl(file, 'file-zip-o', '#1d3a4c', () => {
              this.props.onSelectHtml(file.get('filename'), file.get('csServer'), file.get('url'));
            });
      default:
        console.log('Unsupported file type - ' + file.toJS());
        return;
    }
  }

}

let styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginLeft: 10,
    marginRight: 10,
    marginTop: 4,
    alignItems: 'center',
  },
  leftContainer: {
    width: 40,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    flex: 1,
    fontSize: 16,
  },
  thumb: {
    width: 40,
    height: 40,
  },
});
