import React, { Component, useRef } from 'react'
import { connect } from 'react-redux'
import { StyleSheet, Platform, View, TouchableOpacity, Text, Image, Dimensions, ActivityIndicator, KeyboardAvoidingView, Alert, Linking, TextInput, Modal, ActionSheetIOS} from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import { ActionSheetCustom as ActionSheet } from 'react-native-actionsheet'
import Background from '../components/Background'
import { theme } from '../core/theme'
import { nameValidator } from '../helpers/nameValidator'
import USER_DB from '../api/userDB'
import USER_STOREAGE from '../api/userStoreage'
import EMAIL_AUTH from '../api/userAuth'
import InAppReview from 'react-native-in-app-review'
import ImagePicker from 'react-native-image-crop-picker'
import {
  logoutRequest
} from '../actionCreators'

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

const URL = "https://www.echo.healthcare/contact"

class AccountScreen extends Component {
  constructor(props) {
    super(props)
    this._unsubscribeFocus = null;  

    this.state = { 
      firstName: '',
      firstNameError: '', 
      lastName: '',
      lastNameError: '', 
      email: '',
      emailError: '',
      profileImage: '',
      password: '',

      isLoading: false,
      modalVisible: false,
      isRateAvailable: false,
    }
  }

  componentDidMount() {  
    const result = InAppReview.isAvailable();

    this.setState({
      isRateAvailable: result
    })

    this._unsubscribeFocus = this.props.navigation.addListener('focus', () => {
      USER_DB.getProfile(this.onUserGet); 
    });
  }

  componentWillUnmount() {    
    this._unsubscribeFocus();
  } 

  onUserGet = (user) => {
    this.setState({
      isLoading: false,
      email: user.email, 
      firstName: user.firstname,
      lastName: user.lastname,
      profileImage: user.image,
      password: user.password
    })
  }

  updateInputVal = (val, prop) => {
    const state = this.state
    state[prop] = val
    this.setState(state)
  }

  onLogoutPressed = () => {   
    Alert.alert(
      'Log out',
      `You can come back anytime and get support.`,
      [
        {
          text: "Cancel",
          onPress: () => {},
        },
        {
          text: "Logout",
          onPress: () => {
            this.setState({
              isLoading: true
            })

            EMAIL_AUTH.onPressLogOut(this.onUserLogout)              
          },
        },
        
      ],
      { cancelable: false }
    );
  }

  onUserLogout = () => {
    this.props.logout()

    setTimeout(() => {
      this.setState({
        isLoading: false
      })
      this.props.navigation.navigate('StartScreen') 
    }, 1000);    
  }

  showActionSheet = () => {

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Camera', 'Photo Library', 'Cancel'],
          cancelButtonIndex: 2,
          userInterfaceStyle: 'light'
        },
        buttonIndex => {
          if (buttonIndex === 0) {
            this.captureImage('photo');
          } else if (buttonIndex === 1) {
            this.chooseFile('photo');
          }
        }
      );
    } else {
      this.ActionSheet.show()
    }
  }

  captureImage = async (type) => {
    let isCameraPermitted = await this.requestCameraPermission();
    let isStoragePermitted = await this.requestExternalWritePermission();

    if (isCameraPermitted && isStoragePermitted) {

      setTimeout( () => {
        ImagePicker.openCamera({
          width: 300,
          height: 300,
          cropping: true,
        }).then(image => {
          console.log("crop image===>", image);
  
          this.setState({
            filePath: image
          })
          this.onProceed(image);
        });
      }, 500)       
    }
  };

  chooseFile = (type) => {
    setTimeout( () => {
      ImagePicker.openPicker({
        width: 300,
        height: 300,
        cropping: true
      }).then(image => {
        console.log("crop image===>", image);

        this.setState({
          filePath: image
        })
        this.onProceed(image);
      });
    }, 500)    
  };

  onProceed = async (filePath) => {
    this.setState({
      isLoading: true,
    })  
    let imageName = 'profile-' + filePath.path.substring(filePath.path.lastIndexOf('/') + 1);
    let uploadUri = Platform.OS === 'ios' ? filePath.path.replace('file://', '') : filePath.path;  
    USER_STOREAGE.uploadProfileImage(imageName, uploadUri, this.goDownloadURL);  
  }

  goDownloadURL = async () => {    
    let filepath = this.state.filePath
    let imageName = 'profile-' + filepath.path.substring(filepath.path.lastIndexOf('/') + 1);    
    const downloaduri = await USER_STOREAGE.downloadImage(imageName);
    console.log('downloaduri', downloaduri);

    this.setState({
      profileImage: downloaduri
    })

    USER_DB.updateProfile({image: downloaduri, updated: new Date().getTime()}, this.goNext);
  };

  goNext = async () => { 
    this.setState({
      isLoading: false
    })    
  };

  requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera permission',
          },
        );
        // If CAMERA Permission is granted
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else return true;
  };

  requestExternalWritePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'External Storage Write Permission',
            message: 'App needs write permission',
          },
        );
        // If WRITE_EXTERNAL_STORAGE Permission is granted
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        // alert('Write permission err', err);
        Alert.alert('Write permission err', err);        
      }
      return false;
    } else return true;
  };

  onEdit = (visible) => {
    this.setState({ modalVisible: visible });         
  }

  onDone = () => {
    
    const firstNameError = nameValidator(this.state.firstName)
    const lastNameError = nameValidator(this.state.lastName)
  
    if (firstNameError  || lastNameError  ) {
      this.updateInputVal(firstNameError, 'firstNameError')
      this.updateInputVal(lastNameError, 'lastNameError')
      return
    }

    this.setState({
      isLoading: true,
    })

    USER_DB.updateProfile({firstname: this.state.firstName, lastname: this.state.lastName}, this.onUserUpdated)
  }

  onUserUpdated = () => {
    this.setState({
      isLoading: false,
      modalVisible: false,
    })
  }

  onChangePassword = () => {
    EMAIL_AUTH.onUserLogin(this.state.email, this.state.password, this.goChangePassword)
  }

  goChangePassword = () => {
    this.props.navigation.navigate('ChangePassword', {
      title: "Change Password"
    }) 
  }

  onFacility = () => {
    this.props.navigation.navigate('Facility') 
  }

  onRateOnAppStore = () => {
    this.setState({
      isLoading: true
    })

    if (this.state.isRateAvailable) {
      InAppReview.RequestInAppReview()
      .then((hasFlowFinishedSuccessfully) => {
        // when return true in android it means user finished or close review flow
        console.log('InAppReview in android', hasFlowFinishedSuccessfully);
  
        // when return true in ios it means review flow lanuched to user.
        console.log(
          'InAppReview in ios has lanuched successfully',
          hasFlowFinishedSuccessfully,
        );

        this.setState({
          isLoading: false
        })
  
        // 1- you have option to do something ex: (navigate Home page) (in android).
        // 2- you have option to do something,
        // ex: (save date today to lanuch InAppReview after 15 days) (in android and ios).
  
        // 3- another option:
        if (hasFlowFinishedSuccessfully) {
          // do something for ios
          // do something for android
  
          USER_DB.updateProfile({rateDate: new Date().getTime()}, this.onUserUpdated)
        }
  
        // for android:
        // The flow has finished. The API does not indicate whether the user
        // reviewed or not, or even whether the review dialog was shown. Thus, no
        // matter the result, we continue our app flow.
  
        // for ios
        // the flow lanuched successfully, The API does not indicate whether the user
        // reviewed or not, or he/she closed flow yet as android, Thus, no
        // matter the result, we continue our app flow.
      })
      .catch((error) => {
        //we continue our app flow.
        // we have some error could happen while lanuching InAppReview,
        // Check table for errors and code number that can return in catch.
        console.log(error);
        this.setState({
          isLoading: false
        })

        Alert.alert(
          "Error!",
          `This Device is not supported to lanuch InAppReview`,
          [
            {
              text: "Ok",
            },
          ],
          { cancelable: false }
        );
      });
    }  else {
      Alert.alert(
        "Error!",
        `This Device is not supported to lanuch InAppReview`,
        [
          {
            text: "Ok",
          },
        ],
        { cancelable: false }
      );

    }
  }

  onMake = () => {
    Linking.openURL(URL).catch((err) => console.error('An error occurred', err));
  }

  render() {
    return (
      <Background>

        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.modalVisible}
          onRequestClose={() => {
            this.onEdit(false);
          }}
        >
          <KeyboardAvoidingView behavior={"padding"} style={{flex:1}}>
          <View style={styles.centeredView}>
            <View style={{flex:1}}/>
            <View style = {{...styles.modalView}}>
              <View style={styles.titleView}>
                <View style={{flex: 1}}/>
                <Text style={styles.editPText}>Edit Profile</Text>
                <View style={{flex: 1}}/>
                <TouchableOpacity onPress={() => this.onEdit(false) } style={styles.closeButton} >
                  <Image  style={styles.coloseImage} source={require('../assets/images/account/icon_close.png')} />
                </TouchableOpacity>

              </View>              

              <Text style={styles.firstNameText}>First name</Text>
              <TextInput
                style={styles.emailInput}
                value={this.state.firstName}
                onChangeText={ (text) => this.updateInputVal(text, 'firstName') }
                autoCapitalize="none"
                autoCompleteType="name"
                textContentType="name"
                keyboardType="name-phone-pad"
              />

              <Text style={styles.lastNameText}>Last name</Text>
              <TextInput
                style={styles.emailInput}
                value={this.state.lastName}
                onChangeText={ (text) => this.updateInputVal(text, 'lastName') }
                autoCapitalize="none"
                autoCompleteType="name"
                textContentType="name"
                keyboardType="name-phone-pad"
              />

              <TouchableOpacity style={styles.loginButton} onPress={() => this.onDone()}>
                <Text style={styles.loginText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
          </KeyboardAvoidingView>
       
        </Modal>

        <View style = {styles.navigationView}>
          <Text style={styles.pageTitle}>Account</Text>
          <View style={{flex: 1}}/>
          <TouchableOpacity onPress={() => this.onLogoutPressed()} style={styles.rightButton}>
            <Image  style={styles.alertImage} source={require('../assets/images/account/logout.png')} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileView}>
          <View style={{flex: 2}}/>

          <View style={styles.profileImageView} >
            {this.state.profileImage == '' ? <Image style={styles.profileImage} source={require('../assets/images/notification/iconUser.png')}/> 
            : <Image style={styles.profileImage} source={{uri: this.state.profileImage}}/>}            
            <TouchableOpacity style={styles.cameraButton} onPress={this.showActionSheet}>
              <Image style={styles.cameraImage} source={require('../assets/images/account/icon_photo.png')}/>                
            </TouchableOpacity>            
          </View>       

          <Text style={styles.nameText}>{this.state.firstName + " " + this.state.lastName}</Text>
          <Text style={styles.emailText}>{this.state.email}</Text>
          <TouchableOpacity onPress={() => this.onEdit(true)} style={styles.editButton}>
            <Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>
          <View style={{flex: 1}}/>
        </View>

        <View style={styles.contentView}>
          <TouchableOpacity style={styles.changeView} onPress={() => this.onChangePassword()}>
            <Text style={styles.changeText}>Change Password</Text>
            <View style={{flex: 1}}/>
            <View style={styles.arrowButton}>
              <Image  style={styles.arrowImage} source={require('../assets/images/account/arrow_forward.png')} />
            </View>
          </TouchableOpacity>    

          <TouchableOpacity style={styles.changeView} onPress={() => this.onFacility()}>
            <Text style={styles.changeText}>Facilities</Text>
            <View style={{flex: 1}}/>
            <View style={styles.arrowButton}>
              <Image  style={styles.arrowImage} source={require('../assets/images/account/arrow_forward.png')} />
            </View>
          </TouchableOpacity>      

          <TouchableOpacity style={styles.changeView} onPress={() => this.onRateOnAppStore()}>
            <Text style={{...styles.changeText, color: this.state.isRateAvailable ? '#000' : theme.colors.lightGray}}>{ Platform.OS === 'android' ? 'Rate on Play Store' : 'Rate on App Store'} </Text>
            <View style={{flex: 1}}/>
            <View style={styles.arrowButton}>
              <Image  style={styles.arrowImage} source={require('../assets/images/account/arrow_forward.png')} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.changeView} onPress={() => this.onMake()}>
            <Text style={styles.changeText}>Make an inquiry</Text>
            <View style={{flex: 1}}/>
            <View style={styles.arrowButton}>
              <Image  style={styles.arrowImage} source={require('../assets/images/account/arrow_forward.png')} />
            </View>
          </TouchableOpacity>

        </View>  

        { Platform.OS === 'android' && 
          <ActionSheet
            ref={o => this.ActionSheet = o}
            options={['Camera', 'Photo Library', 'Cancel']}
            cancelButtonIndex={2}
            destructiveButtonIndex={0}
            onPress={(index) => { 
              if (index === 0) {
                this.captureImage('photo');
              } else if (index === 1) {
                this.chooseFile('photo');
              } 
            }}
          />
        }

        {this.state.isLoading ? 
        (<ActivityIndicator
          color={theme.colors.primary}
          size="large"
          style={styles.preloader}
          />
        ) : null}

      </Background>      
    )
  }
}

const styles = StyleSheet.create({
  preloader: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    position: 'absolute',
  },
  
  navigationView: {
    width: '100%',
    height: Platform.OS === 'ios' ? 54 + getStatusBarHeight() : 60,
    alignSelf: 'center',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    backgroundColor: theme.colors.inputBar
  },

  pageTitle: {
    height: 28,
    marginLeft: 20,
    marginBottom: 10,
    fontSize: 20,
    lineHeight: 30,
    fontFamily: 'Poppins-SemiBold',        
  },

  rightButton: {
    width: 79,
    height: 50,
    marginRight: 16,
    paddingTop: 17,
  },

  alertImage: {
    width: 79,
    height: 23,
  },

  profileView: {
    width: '100%',
    height: DEVICE_HEIGHT * 0.45,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: theme.colors.inputBar
  },

  profileImageView :{
    width: 158,
    height: 158,
    borderRadius: 79,

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  profileImage: {
    width: 158,
    height: 158,
    borderRadius: 79,
    borderWidth: 3,
    borderColor: '#fff',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  cameraButton: {
    width: 96,
    height: 96,
    position: 'absolute',
    right: -20,
    bottom: -35,
  },

  cameraImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },

  nameText: {
    height: 33,
    marginTop: 24,
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'Poppins-SemiBold',
  },

  emailText: {
    height: 21,
    marginTop: 3,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',
  },

  editButton: {
    height: 33,
    marginTop: 10,
  },

  editText: {
    height: 23,
    marginTop: 5,
    fontSize: 20,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.lightYellow
  },

  contentView: {
    width: '100%',
    flex: 1,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 12,
  },

  changeView: {
    height: 45,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 14,
    backgroundColor: theme.colors.inputBar,
    flexDirection: 'row',  
  },

  changeText: {    
    height: 21,
    marginLeft: 14,
    marginTop: 12,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium',  
  },

  arrowButton: {
    width: 120,
    height: 45,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
  },

  arrowImage: {
    width: 10,
    height: 16,
  },


  centeredView: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: theme.colors.shadow
  },

  modalView: {    
    width: DEVICE_WIDTH,
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    alignItems: "center",   
    backgroundColor: "white", 
  },

  titleView : {    
    flexDirection: 'row',
  },
  
  editPText: {
    marginTop: 24,
    fontSize: 17,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
  },

  closeButton: {
    width: 60, 
    height: 60, 
    position: 'absolute',
    right: 10,
    top: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  coloseImage: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 44,
    height: 44,
  },  

  firstNameText: {
    height: 20,
    marginLeft: 16,
    marginTop: 42,
    marginBottom: 7,
    alignSelf: 'flex-start',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  emailInput: {
    width: DEVICE_WIDTH - 32,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
    paddingLeft: 12,
    paddingRight: 12,
  },

  lastNameText: {
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 7,
    alignSelf: 'flex-start',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  loginButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginTop: 43,
    marginBottom: 57,
    borderRadius: 28.5,
    backgroundColor: theme.colors.lightYellow,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  loginText: {
    fontSize: 18,
    lineHeight: 25,
    color: 'white',
    fontFamily: 'Poppins-Medium',
  },  
})

const mapStateToProps = ({ auth }) => ({
  user: auth.user,
})

const mapDispatchToProps = {
  logout: logoutRequest
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountScreen)