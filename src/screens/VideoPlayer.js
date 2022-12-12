import React, { Component } from 'react'
import {
  ActivityIndicator,
  SafeAreaView,
  Image,
  StatusBar,
  StyleSheet,
  View,
  TouchableOpacity,
  Dimensions,
  PermissionsAndroid,
  Platform,
  Alert,
  ActionSheetIOS
} from 'react-native'
import { ActionSheetCustom as ActionSheet } from 'react-native-actionsheet'
import Video from 'react-native-video'
import { theme } from '../core/theme'
import CameraRoll from '@react-native-community/cameraroll';
import RNFetchBlob from 'rn-fetch-blob';

const DEVICE_WIDTH = Dimensions.get('window').width
const DEVICE_HEIGHT = Dimensions.get('window').height;

export default class VideoPlayer extends Component {
  constructor(props) {
    super(props)

    this.state = { 
      loading: true,
      errorMessage: ''
    }
  }

  getPermissionAndroid = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Video Download Permission',
          message: 'Your permission is required to save Videos to your device',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      }

      Alert.alert(
        'Save Video',
        'Grant Me Permission to save Video',
        [{text: 'OK', onPress: () => console.log('OK Pressed')}],
        {cancelable: false},
      );
    } catch (err) {
      Alert.alert(
        'Save remote Video',
        'Failed to save Video: ' + err.message,
        [{text: 'OK', onPress: () => console.log('OK Pressed')}],
        {cancelable: false},
      );
    }
  };
    
  handleDownload = async () => {

    if (Platform.OS === "android" && !(await getPermissionAndroid())) {
      return;
    }

    RNFetchBlob.config({
      fileCache: true,
      appendExt: 'mp4',
    })
    .fetch('GET', this.props.route.params.uri)
    .then(res => {
      CameraRoll.saveToCameraRoll(res.data, 'video')
      .then((res) => {
        console.log("RESPONSE ==>", res)
        Alert.alert(
          "Success",
          `This video was saved in Camera Roll successfully`,
          [
            {
              text: "Ok",
            },
          ],
          { cancelable: false }
        );
      })
      .catch(err => console.log(err))
    })
    .catch(error => console.log(error));
  };

  showActionSheet = () => {

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Save', 'Cancel'],
          cancelButtonIndex: 1,
          userInterfaceStyle: 'light'
        },
        buttonIndex => {
          if (buttonIndex === 0) {
            this.handleDownload();
          } 
        }
      );
    } else {
      this.ActionSheet.show()
    }
  }

  render() {
    console.log('Video uri ===>', this.props.route.params.uri)
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar hidden />
        <View style={styles.backButtonView}>
          <TouchableOpacity style={styles.backButton} onPress={() =>  this.props.navigation.goBack()} >
            <Image style={styles.backImage} source={require('../assets/images/login/arrow_back_White.png')}/>
          </TouchableOpacity>

          <TouchableOpacity style={styles.rightButton} onPress={this.showActionSheet} >
            <Image style={styles.rightImage} source={require('../assets/images/message/Dot_white.png')}/>
          </TouchableOpacity>
        </View>

        {this.state.loading ? (
          <ActivityIndicator
            color={theme.colors.primary}
            size="large"
            style={styles.loader}
          />
          ) : null
        }

       {this.state.errorMessage ? <Text style={styles.absoluteFill}>{this.state.errorMessage}</Text> : null} 
        <Video
          controls          
          onBuffer={() => this.setState({loading: true})}
          onLoad={() => this.setState({loading: false})}
          onError={e => this.setState({errorMessage: e.error.errorString})}
          resizeMode="contain"
          source={{ uri: this.props.route.params.uri }}
          style={styles.video}
        />
        { Platform.OS === 'android' && 
          <ActionSheet
            ref={o => this.ActionSheet = o}
            options={['Save', 'Cancel']}
            cancelButtonIndex={1}
            destructiveButtonIndex={0}
            onPress={(index) => { 
              if (index == 0) {
                this.handleDownload();
              } 
            }}
          /> 
        }
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.black,
    flex: 1,
    width: '100%',
  },

  backButtonView: {
    position: 'absolute',
    width: DEVICE_WIDTH - 20,
    height: 50,
    left: 10,    
    top: 20,
    justifyContent: 'center',
    alignItems: 'center',       
    zIndex: 1,
  },

  backButton: {
    position: 'absolute',
    width: 50,
    height: 50,
    top: 0,
    left: 0,
    paddingBottom: 8,
    paddingLeft: 8,
    justifyContent: 'flex-end',
  },

  backImage: {
    width: 12,
    height: 20.5,
  },

  rightButton: {
    position: 'absolute',
    width: 50,
    height: 50,
    right: 0,
    top: 0,
    paddingBottom: 8,
    paddingLeft: 8,
    justifyContent: 'flex-end',
  },
  
  rightImage: {
    width: 28,
    height: 28,
  },    

  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  video: {
    height: '100%',
    width: '100%',
  },
})