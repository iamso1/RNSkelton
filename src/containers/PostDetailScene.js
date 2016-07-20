import React, { PropTypes } from 'react';
import {
   View,
   Text,
   ListView,
   Image,
   InteractionManager,
   TouchableHighlight,
   TouchableWithoutFeedback,
   RefreshControl,
   Dimensions,
   StyleSheet,
 } from 'react-native';
import {
    connect
} from 'react-redux';
import {
    TimeFormat
} from '../utils/TimeHandler';
import {
    getThumbLogo,
    getBBSPath,
} from '../utils/apiWrapper';
import {
    getPostList,
    likePost,
    displayPostDeail,
} from '../actions/posts';
import {
    changeRoute
} from '../actions/route';
import ProgressBar from 'react-native-progress/CircleSnail';

import InfiniteScrollView from 'react-native-infinite-scroll-view';
import Icon from 'react-native-vector-icons/FontAwesome';
import NavBar from '../components/NavBar';
import FileEntityView from '../components/FileEntityView';

import moment from 'moment';
import _ from 'lodash';
import PureRenderMixin from 'react-addons-pure-render-mixin';


let Immutable = require('immutable');
const queryString = require('query-string');

class PostDetailScene extends React.Component{
    static propTypes = {
      navigator: PropTypes.object.isRequired,
      name: PropTypes.string,
      path: PropTypes.string,
      csServer: PropTypes.string,
    };

    constructor(props){
        super(props);
        this.handleSelectDirectory = this.handleSelectDirectory.bind(this);
        this.handleSelectImage = this.handleSelectImage.bind(this);
        this.handleSelectVideo = this.handleSelectVideo.bind(this);
        this.handleSelectMedia = this.handleSelectMedia.bind(this);
        this.handleSelectAudio = this.handleSelectAudio.bind(this);
        this.handleSelectLink = this.handleSelectLink.bind(this);
        this.handleSelectDocument = this.handleSelectDocument.bind(this);
        this.handleSelectHtml = this.handleSelectHtml.bind(this);

        this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);

        let dataSource = new ListView.DataSource({
          rowHasChanged: (r1, r2) => !Immutable.is(r1, r2),
          getRowData: (dataBlob, sectionID, rowID) => { return dataBlob[sectionID].get(rowID); }
        });

        this.state = {
            dataSource: dataSource.cloneWithRows(Immutable.List(), []),
            canLoadMore: true,
            isRefreshing: true,
        };
    }

    componentWillReceiveProps(nextProps) {
          const { posts } = nextProps;

    }

    renderLoadingBar(refreshing: bool){
        return <View style={styles.center}>
            <ProgressBar
                animating={refreshing}
                hidesWhenStopped={true}
                size={100} />
        </View>
    }

    handleSelectMedia(type, name, csServer, url) {
      this.props.dispatch(changeRoute(`/viewers/media?name=${name}&type=${type}&csServer=${csServer}&path=${url}`,
                                      this.props.navigator.props.navKey));
    }

    handleSelectAudio(name: string, csServer: string, url: string) {
      this.handleSelectMedia('audio', name, csServer, url);
    }

    handleSelectVideo(name: string, csServer: string, url: string) {
      this.handleSelectMedia('video', name, csServer, url);
    }

    handleSelectDirectory(name: ?string, csServer: string, url: string) {
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

    renderFileEntityView(file: Object){
		if(_.isEmpty(file.get('atc'))){
			return <View />
		}else{

		}
        console.log(file.toObject());
        return (
        <View key={file.get('id')}>
            <FileEntityView
                file={file}
                onSelectDirectory={this.handleSelectDirectory}
                onSelectImage={this.handleSelectImage}
                onSelectVideo={this.handleSelectVideo}
                onSelectAudio={this.handleSelectAudio}
                onSelectLink={this.handleSelectLink}
                onSelectDocument={this.handleSelectDocument}
                onSelectHtml={this.handleSelectHtml} />
    	</View>
        );
    }

    render(){
        const post = this.props.posts.get('detail');

        const logo = getThumbLogo(this.props.csServer, post.get('uid'));

        return(
            <View style={styles.container}>
                <NavBar
                  navigator={this.props.navigator}
                  title={this.props.name} />
              <View style={styles.header}>
                  <View style={{flex: 1}}>
                      <Image
                          style={styles.userLogo}
                          source={{uri: logo}}/>

                  </View>
                  <View style={{flex: 4, marginTop: 5,}}>
                      <Text style={styles.postBodyText}>{post.get('v_fp')}</Text>
                  </View>
                  <View>
                      <Text style={styles.postDateText}>{TimeFormat(post.get('t_last'))}</Text>
                  </View>
              </View>
              <View style={styles.body}>
                    <View>
                    <Text>{post.get('description')}</Text>
                  </View>
                  {post.get('files').map(file => {
                    return this.renderFileEntityView(file);
                  })}
              </View>
              <View style={styles.footer}></View>
            </View>
        );
    }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userLogo: {
      height: 40,
      width: 40,
      marginLeft: 5,
      borderRadius: 20,
  },
  header: {
      flexDirection: 'row',
      marginRight: 10,
      marginLeft: 10,
      marginTop: 20,
      marginBottom: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

function mapStateToProps(state) {
  const { posts } = state;
  return {
    posts,
  };
}

export default connect(mapStateToProps, null, null, { withRef: true })(PostDetailScene);
