import React, { useState, useRef, useEffect } from 'react'
import { connect, useDispatch } from 'react-redux'
import { Platform, StyleSheet, View, TouchableOpacity, Text, ActivityIndicator, Dimensions, TouchableWithoutFeedback, Keyboard, Linking, Image, Alert } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import CustomTextInput from '../components/CustomTextInput'
import { theme } from '../core/theme'
import OTPSender from '../api/api'
import EMAIL_AUTH from '../api/userAuth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  chatConnectAndSubscribe,
  loginRequest,
  usersCreate,
  usersUpdate,
} from '../actionCreators'

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;
const RESEND_OTP_TIME_LIMIT = 60;
let resendInterval;

export function RegisterScreen2({route, navigation }) {
  const { firstName, lastName, email, codeOTP, password } = route.params;
  const [code, setCode] = useState({code: codeOTP})
  const [otpArray, setOtpArray] = useState(['', '', '', '']);
  const [resendButtonDisabledTime, setResendButtonDisabledTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState('');

  const dispatch = useDispatch()

  const onSubmitPressed = () => {
    var typedCode = JSON.stringify(otpArray.join(""));
    if (JSON.stringify(code.code) === typedCode){
      setIsLoading(true)

      EMAIL_AUTH.onCreateUser(email, password, firstName, lastName, token, [], onUserLoggedIn, onUserLoginFail)

      // navigation.navigate('RegisterPasswordScreen', {
      //   firstName: firstName,
      //   lastName: lastName,
      //   email: email,
      //   password: password
      // } );
    } else {
      Alert.alert(
        "Invalid Code",
        "Please enter a valid code again."
      );
      
      setOtpArray(['', '', '', '']);
      inputRef1.current.focus();
    }    
  }


  useEffect(() => {
    getUserInfo()
  }, []);

  const getUserInfo = async () => {
    try {
      const tokenValue = await AsyncStorage.getItem('user_token')
      if(tokenValue !== null) {
        setToken(tokenValue)
      } 
    } catch(e) {
      console.log('Failed read User Token.')
    }
  } 

  const onUserLoginFail = (errorCode) => {
    setIsLoading(false)

   if (errorCode === "auth/email-already-in-use") {
      Alert.alert(
        "Email Already in Use",
        `There already exists an account with that email. Perhaps you wanted to login?`,
        [
          {
            text: "Ok",
            onPress: () => {
              navigation.navigate('LoginScreen')
            },
          },
        ],
      );
    } 
  }

  const onUserLoggedIn = async() => {
    try {
      await AsyncStorage.setItem('user_email', email)
    } catch (e) {
      console.log('saving user email error')
    }

    try {
      await AsyncStorage.setItem('user_password', password)
    } catch (e) {
      console.log('saving user password error')
    }

    submit(email, firstName + " " + lastName)
  }

  const submit = async(login, username) => {
    new Promise((resolve, reject) => {
      dispatch( loginRequest({ login, resolve, reject }) )
    }).then(action => {
      checkIfUsernameMatch(username, action.payload.user)
    }).catch(action => {      
      const { error } = action
      if (error.toLowerCase().indexOf(['unauthorized', ' login and password required ']) > -2) {
        new Promise((resolve, reject) => {
          dispatch(usersCreate({
            fullName: username,
            login,
            password: 'quickblox',
            resolve,
            reject,
          }))
        }).then(() => {
          submit({ login, username })
        }).catch(userCreateAction => {
          const { error } = userCreateAction
          if (error) {
            console.log('Failed to create user account', error)
          }
        })
      } else {
        console.log('Failed to sign in', error)
      }
    })
  }

  const checkIfUsernameMatch = (username, user) => {
    const update = user.fullName !== username ?
      new Promise((resolve, reject) => dispatch( usersUpdate({
        fullName: username,
        login: user.login,
        resolve,
        reject,
      }))) :
      Promise.resolve()
    update
      .then(connectAndRedirect)
      .catch(action => {
        if (action && action.error) {
          console.log('Failed to update user', action.error)
        }
      })
  }

  const connectAndRedirect = () => {
    setIsLoading(false)
    dispatch(chatConnectAndSubscribe())
    console.log("Go Faciltiy Code setting from Register ===>")
    navigation.navigate('RegisterScreen3', {
      isFromRegister: true,
      email: email
    })    
  }

  useEffect(() => {
    startResendOtpTimer();

    return () => {
      if (resendInterval) {
        clearInterval(resendInterval);
      }
    };
  }, [resendButtonDisabledTime]);

  const startResendOtpTimer = () => {
    if (resendInterval) {
      clearInterval(resendInterval);
    }

    resendInterval = setInterval(() => {
      if (resendButtonDisabledTime <= 0) {
        clearInterval(resendInterval);
      } else {
        setResendButtonDisabledTime(resendButtonDisabledTime - 1);
      }
    }, 1000);
  };

  const onResendOtpButtonPress = () => {   
    var randomNumber = Math.floor(1000 + Math.random() * 9000);
    console.log(randomNumber.toString());
    setCode({code: randomNumber.toString()})

    OTPSender.sendEmail(email, randomNumber.toString(), 'verification', onSentCode, onSentCodeFailed)

    if (inputRef1) {
      setOtpArray(['', '', '', '']);
      inputRef1.current.focus();
    }
    setResendButtonDisabledTime(RESEND_OTP_TIME_LIMIT);
    startResendOtpTimer();
  };

  const onSentCode = () => {
  }

  const onSentCodeFailed = () => {
  }

  const refCallback = textInputRef => node => {
    textInputRef.current = node;
  };
  
  const inputRef1 = useRef(null);
  const inputRef2 = useRef(null);
  const inputRef3 = useRef(null);
  const inputRef4 = useRef(null);

  const onOptChange = (index) => {
    return (value) => {
      if (isNaN(Number(value))) {
        return;
      }
      const otpArrayCpy = otpArray.concat();
      otpArrayCpy[index] = value;
      setOtpArray(otpArrayCpy);
      if (value !== '') {
        if (index === 0) {
          inputRef2.current.focus();
        } else if (index === 1) {
          inputRef3.current.focus();
        } else if (index === 2) {
          inputRef4.current.focus();
        } else if (index === 3) {
          Keyboard.dismiss()
        }
      }
    };
  };

  const onOtpKeyPress = (index) => {
    return ({ nativeEvent: { key: value } }) => {
      if (value === 'Backspace' && otpArray[index] === '') {
        if (index === 1) {
            inputRef1.current.focus();
        } else if (index === 2) {
            inputRef2.current.focus();
        } else if (index === 3) {
            inputRef3.current.focus();
        }
        if (Platform.OS === 'android' && index > 0) {
            const otpArrayCpy = otpArray.concat();
            otpArrayCpy[index - 1] = '';
            setOtpArray(otpArrayCpy);
        }
      }
    };
  };

  const openTerms = async () => {
    // this.props.navigation.replace('TermsScreen')

    const termsURL = 'https://www.echo.healthcare/support'
    Linking.canOpenURL(termsURL).then(supported => {
      if (supported) {
        Linking.openURL(termsURL);
      } else {
        console.log("Don't know how to open URI: " + termsURL);
      }
    });
  }

  return (
    <TouchableWithoutFeedback  accessible={false}>
      <Background>
        <View style = {styles.navigationView}>
          <TouchableOpacity onPress={navigation.goBack} style={styles.containerBack}>
            <Image
              style={styles.imageBack}
              source={require('../assets/images/login/arrow_back.png')}
            />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Registration</Text> 
          <TouchableOpacity onPress={() => navigation.navigate('StartScreen')} style={styles.rightButton}>
            <Image style={styles.arrowImage} source={require('../assets/images/home/icon_bclose.png')}/>
          </TouchableOpacity>
        </View>

        <View style = {styles.contentView}>
          <View style = {styles.stepView}>
            <View style = {{flex: 1, height: 80, alignItems: 'center', justifyContent: 'center'}}>
              <View style={styles.activedCircle}>
                <Text style={styles.circleActiveText}>1</Text>
              </View>
              <Text style={styles.stepText}>Sign up</Text>
            </View>

            <View style = {{flex: 1.2, height: 80, alignItems: 'center', justifyContent: 'center'}}>
              <View style={styles.activeCircle}>
                <Text style={styles.circleActiveText}>2</Text>
              </View>
              <Text style={styles.stepActiveText}>Email Verification</Text>
            </View>

            <View style = {{flex: 1, height: 80, alignItems: 'center', justifyContent: 'center'}}>
              <View style={styles.circle}>
                <Text style={styles.circleText}>3</Text>
              </View>
              <Text style={styles.stepText}>Facility</Text>
            </View>
          </View>

          <Text style={styles.enterText}>Enter OTP sent to</Text>
          <Text style={styles.emailText}>{email}</Text>

          <View style={styles.inputView}>
            {[inputRef1, inputRef2, inputRef3, inputRef4].map(
              (inputRef, i) => (
                <CustomTextInput
                  containerStyle={styles.OTPTextView}
                  value={otpArray[i]}
                  onKeyPress={onOtpKeyPress(i)}
                  onChangeText={onOptChange(i)}
                  keyboardType="numbers-and-punctuation"                 
                  textContentType="oneTimeCode"
                  maxLength={1}
                  autoFocus={i === 0 ? true : false}
                  refCallback={refCallback(inputRef)}
                  key={i}
                  style={[styles.otpText]}
                />
              )
            )}
          </View>

          <View style={styles.resendView}>
            <Text style={styles.didnotText}>Didn't receive the OTP?  </Text>
            <TouchableOpacity style={{height: 40}} onPress={onResendOtpButtonPress}>
              <Text style={ resendButtonDisabledTime > 0 ? styles.resendButtonDisabled : styles.resendButton }>RESEND OTP</Text>
            </TouchableOpacity>
          </View>

          <View style={{height : Platform.OS === 'ios' ? DEVICE_HEIGHT - getStatusBarHeight() - 610 : DEVICE_HEIGHT - 616}} />
          <View style={{flex: 1}} />

          <TouchableOpacity style={styles.loginButton}onPress={onSubmitPressed}>
            <Text style={styles.loginText}>Verify</Text>
          </TouchableOpacity>

          <View style={styles.termsView}>
            <Text style={styles.byText}>By continuing you agree to </Text>
            <TouchableOpacity onPress={() => openTerms()}>
              <Text style={styles.termsText}>Terms and Conditions.</Text>
            </TouchableOpacity>
          </View>

        </View>

        {isLoading? 
        (<ActivityIndicator
          color={theme.colors.primary}
          size="large"
          style={styles.preloader}
          />
        ) : null}

      </Background>
    </TouchableWithoutFeedback>
  )
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
    justifyContent: 'center',
    alignItems: 'flex-end',    
    flexDirection: 'row',
    backgroundColor: theme.colors.inputBar
  },

  containerBack: {
    position: 'absolute',
    width: 50,
    height: 50,
    bottom: 4,
    left: 0,
    paddingLeft: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  imageBack: {
    width: 12,
    height: 20.5,
  },

  pageTitle: {
    height: 30, 
    marginBottom: 14,  
    fontSize: 18,
    lineHeight: 30,
    fontFamily: 'Poppins-Medium', 
    fontWeight: '500',
  },

  rightButton: {
    position: 'absolute',
    height: 50,
    width: 50, 
    bottom: 4,
    right: 0,
    paddingRight: 16,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },

  arrowImage: {
    width: 22,  
    height: 22
  },

  contentView: {
    width: '100%',
    flex: 1,
    alignSelf: 'center',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },

  enterText: {
    marginTop: 42,
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
  },

  emailText: {
    fontSize: 20,
    marginBottom: 40,
    fontFamily: 'Poppins-Medium',
  },

  inputView: {
    flexDirection: 'row',
    marginHorizontal: (DEVICE_WIDTH - 324)/2,  
    height: 49,
  },

  OTPTextView: {
    flex: 1,
    height: 49,
    width: 49,
    marginHorizontal: 16,
    backgroundColor: theme.colors.inputBar,
  },

  otpText: {
    textAlign: 'center',    
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
  },

  resendView: {
    flexDirection: 'row',
    marginTop: 36,
  },

  didnotText: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  }, 

  resendButton: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.primary,
  },

  resendButtonDisabled: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Medium',  
    color: theme.colors.primaryDisabled,
  },

  loginButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginBottom: 32,
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

  termsView: {
    height: 41,
    marginBottom: 46,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },

  byText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.lightGray,
  }, 

  termsText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.lightGray,
    textDecorationLine: 'underline',
  }, 

  stepView: {
    width: DEVICE_WIDTH,
    height: 80,
    flexDirection: 'row',    
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.inputBar,
  },

  activeCircle: {
    width: 34,
    height: 34,    
    backgroundColor: theme.colors.primary, 
    borderColor: theme.colors.primaryLight,
    borderRadius: 17,
    borderWidth: 3, 
  },

  activedCircle: {
    width: 34,
    height: 34,    
    backgroundColor: theme.colors.primary, 
    borderRadius: 17,
    borderWidth: 3, 
    borderColor: theme.colors.primary,
  },
  
  circle: {
    width: 34,
    height: 34,    
    backgroundColor: 'white', 
    borderRadius: 17,
  },

  circleActiveText: {
    marginTop: 3,
    alignSelf: 'center',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
    color: 'white'
  }, 

  circleText: {
    marginTop: 6,
    alignSelf: 'center',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
  },

  stepText: {
    height: 20,
    marginTop: 8,
    marginBottom: 7,
    alignSelf: 'center',
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },

  stepActiveText: {
    height: 20,
    marginTop: 8,
    marginBottom: 7,
    alignSelf: 'center',
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  }, 
})

const mapStateToProps = ({ auth, chat, users }) => ({
  loading: auth.loading || chat.loading || users.loading,
})

const mapDispatchToProps = {
  connectAndSubscribe: chatConnectAndSubscribe,
  createUser: usersCreate,
  signIn: loginRequest,
  updateUser: usersUpdate,
}

export default connect(mapStateToProps, mapDispatchToProps)(RegisterScreen2)
