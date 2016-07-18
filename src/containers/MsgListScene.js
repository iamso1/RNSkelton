/*
 * @flow
 */
import React, { PropTypes } from 'react';
import _ from 'lodash';
import {
    StyleSheet,
    Text,
    View,
    ListView,
    InteractionManager,
    RefreshControl,
    Image,
    Dimensions,
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome';
import VideoPreview from '../components/VideoPreview';
import InfiniteScrollView from 'react-native-infinite-scroll-view';
import NavBar from '../components/NavBar';
import moment from 'moment';
import FileIcon from '../components/FileIcon';
import SessionManager from '../utils/sessionManager';
import TextInput from '../components/TextInput';

import { getWSImage, getWSFile, getWSServer, getWSVideo } from '../utils/websocketManager';
import { uploadChatFile } from '../actions/chatroom';
import { getRoomDetail, sendMessage } from '../actions/chatroom';
import {changeRoute} from '../actions/route';
import { connect } from 'react-redux';
import { ImagePickerManager } from 'NativeModules';


let Immutable = require('immutable');
let RNFS = require('react-native-fs');

class MessageScene extends React.Component{
    static propTypes = {
        navigator: PropTypes.object.isRequired,
        cid: PropTypes.string.isRequired,
    };

    constructor(props){
        super(props);
        this.sendMessage = this.sendMessage.bind(this);
        this.loadMore = this.loadMore.bind(this);
        this.renderMessageEntityView = this.renderMessageEntityView.bind(this);
        this.renderNavRightButtons = this.renderNavRightButtons.bind(this);
        this.uploadFile = this.uploadFile.bind(this);
        this.nextPage = this.nextPage.bind(this);

        this._pageSize = 10;
        let dataSource = new ListView.DataSource({
          rowHasChanged: (r1, r2) => !Immutable.is(r1, r2),
          getRowData: (dataBlob, sectionID, rowID) => { return dataBlob[sectionID].get(rowID); }
        });

        this.state = {
            dataSource: dataSource.cloneWithRows(Immutable.List(), []),
            messages: [],
            text: '',
            canLoadMore: false,
            isRefreshing: false,
            contentSize: 0,
            layoutSize: 0,
            total: 0,
        };
    }

    componentDidMount(){
        InteractionManager.runAfterInteractions(() => {
            this.props.dispatch(getRoomDetail(this.props.cid, null, this._pageSize));
            const scrollHeight = this.state.layoutSize -  this.state.contentSize;
            const animated = true;
            this.refs.msgList.scrollTo({
                x : 0,
                y : scrollHeight,
                animated: true
            });
        });
    }

    componentWillReceiveProps(nextProps) {
        const { chatroom, cid } = nextProps;
        const acn = SessionManager.acn;
        const sun = SessionManager.sun;

        let detailData = chatroom.get(cid),
            messages = detailData.get('messages'),
            messageCount = messages.size,
            canLoadMore = detailData.get('hasNextPaging');
        let rowIds = (count => [...Array(count)].map((val, i) => i))(messageCount);
        this.setState({
            dataSource: this.state.dataSource.cloneWithRows(messages, rowIds),
            canLoadMore: canLoadMore,
            isRefreshing: false,
            total: messageCount,
        });
    }

    sendMessage(data){
        if(data.text){
            let msgData = {};
            msgData.content = data.text;
            msgData.cid  = this.props.cid;
            msgData.type = 'chat';
            this.setState({text : ''});
            this.props.dispatch(sendMessage(msgData, this.props.cid));
        }

    }

    uploadFile(resp){
        if (resp.didCancel) {
        } else if (resp.error) {
          console.warn('ImagePickerManager error - ' + resp.error);
        } else {
            RNFS.stat(resp.uri.replace('file://', ''))
            .then(statResult => {
                const fileUri = resp.uri.replace('file://', '');
                const fileName = fileUri.split('/').pop();
                const WSServer = getWSServer();
                const { cid, csServer } = this.props;
                const nu_code = SessionManager.sessionToken;
                this.props.dispatch(uploadChatFile(nu_code, cid, fileName, statResult.size, fileUri));
            }).catch(error => console.warn(error));

        }
    }

    renderNavRightButtons(){
        //先隱藏起來ㄨㄨ
        //return <View />;
        const options = {
          title: '上傳檔案',
          cancelButtonTitle: '取消',
          takePhotoButtonTitle: '錄影上傳',
          chooseFromLibraryButtonTitle: '從相簿選取',
        mediaType: 'video',
        videoQuality: 'high',
        durationLimit: 90,
          storageOptions: {
            skipBackup: true,
            path: 'video',
          },
        };

        return <Icon.Button
            onPress = {() => ImagePickerManager.showImagePicker(options, this.uploadFile)}
            backgroundColor='#00a5e6'
            name='plus' />;
    }

    nextPage(total: number){
        if(this.state.canLoadMore){
            const messages = this.props.chatroom.get(this.props.cid).get('messages');
            const lastMsg = messages.toArray()[0];
            this.props.dispatch(getRoomDetail(this.props.cid, lastMsg.get('time'), this._pageSize));
        }

    }

    render(){
        const acn = SessionManager.acn;

        return (
            <View style={styles.container}>
                <NavBar
                  navigator={this.props.navigator}
                  title={this.props.name}
                  renderRightButtonsComponent={this.renderNavRightButtons}
                />
            {
                (this.state.canLoadMore)
                ? <Text
                    onPress={() => this.nextPage(this.state.total)}
                    style={styles.loadMore}>Load More...</Text>
                : <Text></Text>
            }

                <ListView
                    ref='msgList'
                    onLayout={ev => this.setState({ layoutSize: ev.nativeEvent.layout.height })}
                    onContentSizeChange={(w, h) => this.refs.msgList.scrollTo({x : 0, y : (h - this.state.layoutSize), animated:false})}
                    enableEmptySections={true}
                    style={styles.listView}
                    onLoadMoreAsync={this.loadMore}
                    canLoadMore={this.state.canLoadMore}
                    dataSource={this.state.dataSource}
                    pageSize={30}
                    renderRow={this.renderMessageEntityView}/>


                <View style={styles.textInputRow}>
                    <View style={{flex: 12}}>
                        <TextInput
                            style={styles.textInput}
                            autoFocus={false}
                            onChangeText={text => this.setState({ text: text })}
                            value={this.state.text}
                            placeholder="Enter Message..."
                            autoCapitalize="none"/>
                    </View>
                    <View style={{flex: 1, alignItems: 'center'}}>
                        <Icon.Button
                            onPress = {() => this.sendMessage(this.state)}
                            name='send-o'
                            color='#000000'
                            backgroundColor='#a9a9a9'>
                        </Icon.Button>
                    </View>
                </View>
            </View>
        );
    }

    handleSelectLink(name, url){
        const [currectURL, hash] = url.split("#");
        this.props.dispatch(changeRoute(`/viewers/web?name=${name}&type=link&url=${currectURL}&hash=${hash}`,
                                        this.props.navigator.props.navKey));
    }

    handleSelectAudio(name, url) {
        this.handleSelectMedia('audio', name, '', url);
    }

    handleSelectMedia(type: string, name: string, csServer: string, url: string, q: string) {
        return Promise.resolve(csServer)
        .then(csServer => {
            this.props.dispatch(changeRoute(`/viewers/media?path=${url}&csServer=${csServer}&name=${name}&q=${q}`,
                                            this.props.navigator.props.navKey));
        }).catch(error => console.warn(error));

    }

    renderRightMsg(message){
        const m = message.toObject();
        const dateString = moment(m.time).format('YYYY-MM-DD');
        const { csServer } = this.props;
        let file, url;
        url = getWSFile(m.url);

        if(m.filename && m.type === 'Other'){

            file = <View style={styles.rightMsgRowItem}>
                <FileIcon
                    size={20}
                    filename={m.filename}
                    title = {m.filename}
                    onPress={() => this.handleSelectLink(m.filename, url)}/>
            </View>;
        }else if(m.type === 'Audio'){
            const audioURL = getWSFile(m.url);
            file = <View style={styles.AudioBar}>
                <View style={styles.container}>
                    <Text style={styles.AudioText}>{m.filename}</Text>
                </View>
                <View>
                    <Icon.Button
                        onPress = {() => this.handleSelectAudio(m.filename, audioURL)}
                        name='play'
                        color='#000000'
                        backgroundColor='#a9a9a9'>
                    </Icon.Button>
                </View>
            </View>
        }else if(m.type === 'Video'){
            const thumbs = getWSFile(m.url) + '.thumbs.jpg';
            const server = getWSServer();

            file = <VideoPreview
                filename={m.filename}
                vid = {m._id}
                source={{uri: thumbs}}
                iconName="play-circle"
                iconColor='#FFFFFF'
                iconSize={80}
                onPress={() => this.handleSelectMedia('Video', m.filename, `${server}/cb_view_file`, m.url, `url=${m.url}&type=Video`)}
                backgroundColor= "#FFFFFF" />;
        }else if(m.type === 'chat'){
            file = <Text style={styles.msgContentText}>{m.content}</Text>;

        }

        return(
            <View style={styles.msgHeader} key={m._id}>
                <View style={{ flex: 1 }}/>
                <View style={styles.rightMsgRow}>
                    <View style={styles.rightMsgRowItem}>
                        <Text style={styles.msgDateText}>{dateString}</Text>
                        <Text style={styles.rightMsgSunText}></Text>
                    </View>
                    {file}
                </View>
                <View>
                    <Image
                        style={styles.userLogo}
                        source={{uri: `${csServer}/UserProfile/user_image.php?acn=${m.owner}`}}/>
                </View>
            </View>

        );
    }


    renderLeftMsg(message){
        const m = message.toObject();
        const dateString = moment(m.time).format('YYYY-MM-DD');
        const { csServer } = this.props;

        let file, url;
        url = getWSFile(m.url);

        if(m.filename && m.type === 'Other'){

            file = <View style={styles.rightMsgRowItem}>
                <FileIcon
                    size={20}
                    filename={m.filename}
                    title = {m.filename}
                    onPress={() => this.handleSelectLink(m.filename, url)}/>
            </View>;
        }else if(m.type === 'Audio'){
            const audioURL = getWSFile(m.url);
            file = <View style={styles.AudioBar}>
                <View style={styles.container}>
                    <Text style={styles.AudioText}>{m.filename}</Text>
                </View>
                <View>
                    <Icon.Button
                        onPress = {() => this.handleSelectAudio(m.filename, audioURL)}
                        name='play'
                        color='#000000'
                        backgroundColor='#a9a9a9'>
                    </Icon.Button>
                </View>
            </View>
        }else if(m.type === 'Video'){
            const thumbs = getWSFile(m.url) + '.thumbs.jpg';

            file = <VideoPreview
                filename={m.filename}
                key = {m.id}
                source={{uri: thumbs}}
                iconName="play-circle"
                iconColor='#FFFFFF'
                iconSize={80}
                onPress={() => this.handleSelectMedia('video', m.filename, '', url)}
                backgroundColor= "#FFFFFF" />;
        }else if(m.type === 'chat'){
            file = <Text style={styles.msgContentText}>{m.content}</Text>;

        }

        return(
            <View style={styles.msgHeader} key={m._id}>
                <View>
                    <Image
                        style={styles.userLogo}
                        source={{uri: `${csServer}/UserProfile/user_image.php?acn=${m.owner}`}}/>
                </View>
                <View style={styles.leftMsgRow}>
                    <View style={styles.leftMsgRowItem}>
                        <Text style={styles.leftMsgSunText}>{m.owner_sun}</Text>
                        <Text style={styles.msgDateText}>{dateString}</Text>
                    </View>
                    {file}
                </View>
                <View style={{ flex: 1 }}/>
            </View>

            );
        }
    renderMessageEntityView(message){

        const m = message.toObject();
        const acn = SessionManager.acn;

        let Msg;
        if(acn === m.owner) Msg = this.renderRightMsg(message);
        else Msg = this.renderLeftMsg(message);

        return <View>
            {Msg}
            <View style={styles.msgFooter}>
            </View>
        </View>;
    }

    loadMore(){

    }
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listView: {
      marginBottom: 10,
  },
  msgContentText: {
    fontSize: 16,
  },
  rightMsgRow: {
    borderRadius: 10,
    paddingBottom: 15,
    paddingLeft: 10,
    paddingRight: 10,
    flex: 4,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#778899'
  },
  rightMsgRowItem: {
      flexDirection: 'row',
      marginTop: 10,
      marginLeft: 10,
      marginRight: 5,
  },
  leftMsgRow: {
      borderRadius: 10,
      paddingBottom: 15,
      paddingLeft: 10,
      paddingRight: 10,
      flex: 4,
      backgroundColor: '#f8f8f8',
      borderWidth: 1,
      borderColor: '#778899'

  },
  leftMsgRowItem: {
      flexDirection: 'row',
      marginTop: 10,
      marginLeft: 10,
      marginRight: 5,
  },
  msgHeader: {
    flexDirection: 'row',
    flex: 1,
    margin: 5,
    paddingTop: 5,
    backgroundColor: '#f0f8ff',
  },
  leftMsgSunText: {
    fontSize: 18,
    flex: 1,
    paddingTop: 6,
    textAlign: 'left',
  },
  rightMsgSunText: {
    fontSize: 18,
    flex: 1,
    paddingTop: 6,
    textAlign: 'right',
  },
  msgDateText: {
    paddingTop: 6,
    fontSize: 12,
    color: '#b0c4de',
  },
  msgBody: {

  },
  userLogo: {
      height: 40,
      width: 40,
      marginLeft: 5,
      borderRadius: 20,
  },
  AudioBar: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius : 25,
    marginTop: 20,
  },
  AudioText: {
    textAlign: 'center',
    paddingTop: 10,
    color: '#FFFFFF',

  },
  textInputRow: {
      flexDirection: 'row',
  },
  textInput: {
    height: 20,
    marginBottom: 20,
    borderRadius: 10,
    borderTopWidth: 2,
    marginLeft: 10,
  },
  loadMore: {
      textAlign: 'center',
      fontSize: 18,
      color: 'rgba(0, 0, 0, 0.5)',
  }
});

function mapStateToProps(state) {
  const { chatroom, auth } = state;

  return {
    chatroom,
  };
}

export default connect(mapStateToProps, null, null, { withRef: true })(MessageScene);
