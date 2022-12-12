import React, { Component } from 'react'
import { StyleSheet, View, Platform, TouchableOpacity, Text, TextInput, Dimensions, ActivityIndicator, Linking, ScrollView, Alert, Image } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import CheckBox from '@react-native-community/checkbox'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { theme } from '../core/theme'
import { nameValidator } from '../helpers/nameValidator'
import { lastNameValidator } from '../helpers/lastNameValidator'
import { emailValidator } from '../helpers/emailValidator'
import { passwordValidator } from '../helpers/passwordValidator'
import OTPSender from '../api/api'

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

export default class RegisterScreen1 extends Component {
  constructor(props) {
    super(props)

    this.state = { 
      firstName: '',       
      lastName: '',      
      email: '',   
      firstNameError: '',
      lastNameError: '', 
      emailError: '',
      password: '',      
      cpassword: '',
      passwordError: '',
      cpasswordError: '',
      otpCode: '',
      isLoading: false,

      isAccept: false,
    }
  }

  componentDidMount() {
    this.getAcceptInfo()
  }

  getAcceptInfo = async () => {
    try {
      const acceptValue = await AsyncStorage.getItem('terms_accept')    
      if(acceptValue !== null) {
        const bValue = acceptValue == 'true' ? true : false
        this.setState({isAccept: bValue})
      }
    } catch(e) {
      console.log('Failed read Terms Value.')
    }
  }

  setToggleCheckBox = async(value) => {
    this.setState({isAccept: value})
    const strValue = value ? 'true' : 'false'
    try {
      console.log(this.state.email)
      await AsyncStorage.setItem('terms_accept', strValue)
    } catch (e) {
      console.log('saving user email error')
    }
  }

  updateInputVal = (val, prop) => {
    const state = this.state
    state[prop] = val
    this.setState(state)
  }

  onVerifyPressed = () => {
    const firstNameError = nameValidator(this.state.firstName)
    const lastNameError = lastNameValidator(this.state.lastName)
    const emailError = emailValidator(this.state.email)    
    const passwordError = passwordValidator(this.state.password)
    const cpasswordError = passwordValidator(this.state.cpassword)

    if (firstNameError || lastNameError || emailError || passwordError || cpasswordError ) {
      this.updateInputVal(firstNameError, 'firstNameError')
      this.updateInputVal(lastNameError, 'lastNameError')
      this.updateInputVal(emailError, 'emailError')
      this.updateInputVal(passwordError, 'passwordError')
      this.updateInputVal(cpasswordError, 'cpasswordError')

      const errorMessage = firstNameError || lastNameError || emailError || passwordError || cpasswordError

      Alert.alert(
        "Error",
        errorMessage
      );
      return
    }

    if (this.state.password != this.state.cpassword) {     
      Alert.alert(
        "Error",
        "Passwords don't match. Please type again."
      );
      return
    } else {

      if (!this.state.isLoading) {
        this.updateInputVal(true, 'isLoading')
        var randomNumber = Math.floor(1000 + Math.random() * 9000);
        this.updateInputVal(randomNumber.toString(), 'otpCode')
        OTPSender.sendEmail(this.state.email, randomNumber.toString(), 'verification', this.onSentCode, this.onSentCodeFailed);        
      }   
    }    
  }

  onSentCodeFailed = () => {
    this.setState({
      isLoading: false
    })  
  }

  onSentCode = () => {
    console.log("Verification code", this.state.otpCode)

    this.props.navigation.navigate('RegisterScreen2', {
      firstName: this.state.firstName,
      lastName: this.state.lastName,
      email: this.state.email,
      password: this.state.password,
      codeOTP: this.state.otpCode,
    })    

    this.setState({
      firstName: '',       
      lastName: '',      
      email: '', 
      password: '',
      cpassword: '',
      isLoading: false
    })  
  }

  openTerms = async () => {
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

  render() {
    return (
      <Background>

        <View style = {styles.navigationView}>
          <Text style={styles.pageTitle}>Registration</Text> 
          <TouchableOpacity onPress={() => this.props.navigation.navigate('StartScreen')} style={styles.rightButton}>
            <Image style={styles.arrowImage} source={require('../assets/images/home/icon_bclose.png')}/>
          </TouchableOpacity>
        </View>

        <View style = {styles.contentView}>
          <View style = {styles.stepView}>
            <View style = {{flex: 1, height: 80, alignItems: 'center', justifyContent: 'center'}}>
              <View style={styles.activeCircle}>
                <Text style={styles.circleActiveText}>1</Text>
              </View>
              <Text style={styles.stepActiveText}>Sign up</Text>
            </View>

            <View style = {{flex: 1.2, height: 80, alignItems: 'center', justifyContent: 'center'}}>
              <View style={styles.circle}>
                <Text style={styles.circleText}>2</Text>
              </View>
              <Text style={styles.stepText}>Email Verification</Text>
            </View>

            <View style = {{flex: 1, height: 80, alignItems: 'center', justifyContent: 'center'}}>
              <View style={styles.circle}>
                <Text style={styles.circleText}>3</Text>
              </View>
              <Text style={styles.stepText}>Facility</Text>
            </View>
          </View>

            <ScrollView style={{width: '100%',}}
            showsVerticalScrollIndicator={false}>
                <Text style={styles.firstNameText}>First name</Text>
                <TextInput
                  style={styles.emailInput}
                  value={this.state.firstName}
                  onChangeText={ (text) => this.updateInputVal(text, 'firstName') }
                  autoCapitalize="none"
                  autoCompleteType="name"
                  textContentType="name"
                />

                <Text style={styles.lastNameText}>Last name</Text>
                <TextInput
                  style={styles.emailInput}
                  value={this.state.lastName}
                  onChangeText={ (text) => this.updateInputVal(text, 'lastName') }
                  autoCapitalize="none"
                  autoCompleteType="name"
                  textContentType="name"
                />

                <Text style={styles.lastNameText}>Email</Text>
                <TextInput
                  style={styles.emailInput}
                  value={this.state.email}
                  onChangeText={ (text) => this.updateInputVal(text, 'email') }
                  autoCapitalize="none"
                  autoCompleteType="email"
                  textContentType="emailAddress"
                  keyboardType="email-address"
                />

                <Text style={styles.lastNameText}>Create a password</Text>
                <TextInput
                  style={styles.emailInput}
                  returnKeyType="done"  
                  value={this.state.password}
                  onChangeText={ (text) => this.updateInputVal(text, 'password') }
                  secureTextEntry={true}
                />

                <Text style={styles.lastNameText}>Verify password</Text>
                <TextInput
                  style={styles.emailInput}
                  returnKeyType="done"            
                  value={this.state.cpassword}
                  onChangeText={ (text) => this.updateInputVal(text, 'cpassword') }
                  secureTextEntry={true}
                />

            <View style={{height : Platform.OS === 'ios' ? DEVICE_HEIGHT - getStatusBarHeight() - 710 : DEVICE_HEIGHT - 716}} />
            <View style={{flex: 1}} />

            <TouchableOpacity style={styles.loginButton} onPress={() => this.onVerifyPressed()}>
                <Text style={styles.loginText}>Continue</Text>
            </TouchableOpacity>

            <View style={styles.termsView}>
                <CheckBox
                style={{marginRight: 12}}
                disabled={false}
                value={this.state.isAccept}
                onValueChange={(newValue) => this.setToggleCheckBox(newValue)}
                />

                <View style={styles.termsView1}>
                <Text style={styles.byText}>By continuing you agree to </Text>
                <TouchableOpacity onPress={() => this.openTerms()}>
                    <Text style={styles.termsText}>Terms and Conditions.</Text>
                </TouchableOpacity>
                </View>
                
            </View>

        </ScrollView>  

          

        </View>

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
    justifyContent: 'center',
    alignItems: 'flex-end',
    flexDirection: 'row',
    backgroundColor: theme.colors.inputBar
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
    height: 50, 
    bottom: 4,
    right: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  arrowImage: {
    width: 22,  
    height: 22
  },

  rightText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
    textAlign: 'right',
    color: theme.colors.primary
  },

  contentView: {
    width: '100%',
    flex: 1,
    paddingHorizontal: 16,
    alignSelf: 'center',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },

  firstNameText: {
    height: 20,
    marginTop: 20,
    marginBottom: 4,
    alignSelf: 'flex-start',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  emailInput: {
    width: '100%',
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
    paddingLeft: 12,
    paddingRight: 12,
  },

  lastNameText: {
    marginTop: 12,
    marginBottom: 4,
    alignSelf: 'flex-start',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  forgotText: {
    height: 60,
    paddingTop: 16,
    alignSelf: 'center',
    fontSize: 16,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.lightGray,
  },

  loginButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginLeft: 8,
    marginBottom: 24,
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
    flexDirection: 'row'
  },
  
  termsView1: {
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
