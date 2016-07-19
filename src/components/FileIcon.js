/**
    @ flow
**/
import React, {
    PropTypes,
} from 'react';

import {
    StyleSheet,
    Text,
    View,
} from 'react-native';

import _ from 'lodash';
import Icon from 'react-native-vector-icons/FontAwesome';

export default class FileIcon extends React.Component{
    static defaultProps = {
        bgColor: '#4169e1',
        color: '#FFFFFF',
        title: '',
        size: 20,
        btnStyle: {},
        textStyle: {},
        filename: '',
    };

    static propTypes = {
        bgColor: PropTypes.string,
        filename: PropTypes.string,
        color: PropTypes.string,
        title: PropTypes.string,
        btnStyle: PropTypes.object,
        textStyle: PropTypes.object,
        size: PropTypes.number,
        onPress: PropTypes.func,
    };



    constructor(props){
        super(props);
        this.onPress = this.onPress.bind(this);
    }

    onPress(){
        if(this.props.onPress) this.props.onPress();
    }

    render(){
        const btnStyle = Object.assign({}, styles.btn, this.props.btnStyle);
        const textStyle = Object.assign({}, styles.textStyle, this.props.textStyle);

        if(_.isEmpty(this.props.filename)) return <View><Text>檔案名稱不可為空</Text></View>;

        const ext = this.props.filename.split('.').pop();
        let bgColor = "#4169e1";
        let name = "file-word-o";

        if(ext === 'ppt') {
            bgColor = '#ff00ff';
            name = 'file-powerpoint-o';
        }else if(ext === 'pdf'){
            name = 'file-pdf-o';
            bgColor = '#cb0805';
        }

        return (
            <Icon.Button
                size={this.props.size}
                style={btnStyle}
                name={name}
                color={this.props.color}
                onPress={this.onPress}
                backgroundColor={bgColor}>
                <Text style={textStyle}>{this.props.title}</Text>
            </Icon.Button>
        );
    }
}

const styles = StyleSheet.create({
    btn: {
        justifyContent: 'center',
        height: 120,
    },
    textStyle: {
        color: '#FFFFFF',
        fontFamily: 'Arial',
        fontSize: 18,
        position: 'absolute',
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        flexDirection: 'column',
        height: 40,
        textAlign: 'center',
    },
});
