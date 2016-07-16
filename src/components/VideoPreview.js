/*
 * @flow
 */
import React, { PropTypes } from 'react';

import {
    StyleSheet,
    View,
    Image,
    Text,
    Dimensions,
    TouchableHighlight,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import PureRenderMixin from 'react-addons-pure-render-mixin';

let { width } = Dimensions.get('window');

export default class VideoPreview extends React.Component{

    static defaultProps = {
        iconColor: '#FFFFFF',
        iconSize : 80,
        bgColor: '#FFFFFF',
        videoLogo: {},
        videoIcon: {},
    };

    static propTypes = {
        source: PropTypes.object.isRequired,
        filename: PropTypes.string.isRequired,
        vid: PropTypes.string.isRequired,
        bgColor: PropTypes.string,
        iconColor: PropTypes.string.isRequired,
        iconSize: PropTypes.number.isRequired,
        onPress: PropTypes.func,
        videoIcon: PropTypes.object.isRequired,
        videoLogo: PropTypes.object.isRequired,
    };

    constructor(props){
        super(props);
        this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
        this.onPress = this.onPress.bind(this);
    }

    onPress(){
        if(this.props.onPress) this.props.onPress();
    }

    render(){
        console.log(this.props);
        const videoLogo = Object.assign({}, styles.videLogo, this.props.videoLogo);
        const videoIcon = Object.assign({}, styles.videoIcon, this.props.videoIcon);

        return <View key={this.props.vid}>
            <Image
                style={styles.videoLogo}
                source={this.props.source}>

                <TouchableHighlight onPress={this.onPress}>
                    <Icon
                        style={styles.videoIcon}
                        name='play-circle'
                        color='#FFFFFF'
                        size={80}
                        backgroundColor={this.props.bgColor} />
                </TouchableHighlight>
            </Image>
            <Text style={styles.videoText}>{this.props.filename}</Text>
        </View>
    }
}

const styles = {
    videoLogo: {
        height : 400,
    },
    videoText: {
        position: 'absolute',
        fontSize: 18,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        color: '#FFFFFF',
    },
    videoIcon: {
        position: 'relative',
        top: 200,
        left: (width / 2 - 30),
        alignItems: 'center',
    },
};
