import React, { useState, useRef, useEffect } from 'react'
import { Platform, StyleSheet, View, TouchableOpacity, Text, Dimensions, TouchableWithoutFeedback, Keyboard, Linking, Alert, Modal, FlatList, Image } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import CustomTextInput from '../components/CustomTextInput'
import { theme } from '../core/theme'
import OTPSender from '../api/api'
import FACILITY_DB from '../api/facilityDB'
import USER_DB from '../api/userDB'

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;
const RESEND_OTP_TIME_LIMIT = 60;
let resendInterval;

export default function FacilityCode({route, navigation }) {
  const { isFromRegister } = route.params;
  const [curFacility, setFacility] = useState('')
  const [otpArray, setOtpArray] = useState(['', '', '', '', '']);
  const [resendButtonDisabledTime, setResendButtonDisabledTime] = useState(0);
  const [facilityArray, setFacArray] = useState([])

  const [curBranch, setBranch] = useState('')
  const [branchArray, setBranchArray] = useState([])
  const [isBranchModal, setBranchModal] = useState(false)

  useEffect(() => {
    getFacitlities();
    startResendOtpTimer();

    return () => {
      if (resendInterval) {
        clearInterval(resendInterval);
      }
    };
  }, [resendButtonDisabledTime]);

  const getFacitlities = () => {
    setOtpArray(['', '', '', '', '']);
    FACILITY_DB.getFacilities(onGetFacilities)  
  };

  const onGetFacilities = (facilities) => {   
    setFacArray(facilities)  
  }

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

  const refCallback = textInputRef => node => {
    textInputRef.current = node;
  };
  
  const inputRef1 = useRef(null);
  const inputRef2 = useRef(null);
  const inputRef3 = useRef(null);
  const inputRef4 = useRef(null);
  const inputRef5 = useRef(null);

  const onOptChange = (index) => {
    return (value) => {
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
          inputRef5.current.focus();
        } else if (index === 4) {
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
        } else if (index === 4) {
            inputRef4.current.focus();
        } 

        if (Platform.OS === 'android' && index > 0) {
            const otpArrayCpy = otpArray.concat();
            otpArrayCpy[index - 1] = '';
            setOtpArray(otpArrayCpy);
        }
      }
    };
  };

  const onSubmitPressed = () => {
    var typedCode = JSON.stringify(otpArray.join(''));

    const filtered = facilityArray.filter(
      function(item){
        const itemCode = item.facilityCode ? JSON.stringify(item.facilityCode.toUpperCase()) : '0'
        const upperCode = typedCode.toUpperCase()
        return itemCode == upperCode
      }
    )

    if (filtered.length > 0 ) {
      setFacility(filtered[0])
      
      const aryBranch = filtered[0].branch
      setBranchArray(aryBranch)
      setBranchModal(true)
      // const defaultBranch = aryBranch.length > 0 ? aryBranch[0].name : 'default branch'
      // const aryFacility = []
      // aryFacility.push({ 'branch': defaultBranch, 'facility': filtered[0].facilityid })
      // USER_DB.updateProfile({facility: aryFacility}, onUpdated(filtered[0]))
    } else {
      Alert.alert(
        "Invalid Code",
        `Please enter a valid code again.`,
        [
          {
            text: "Ok",
            onPress: () => {
              if (inputRef1) {
                setOtpArray(['', '', '', '', '']);
                inputRef1.current.focus();
              }
            },
          },
        ],
        { cancelable: false }
      );
    }  
  }

  const selectItem = (item) => {
    setBranch(item.name)       
  }

  const onDonePressed = () => {
    if (curBranch == '') {
      Alert.alert(
        "Warning",
        `Please select a branch.`,
        [
          {
            text: "Ok",
            onPress: () => {
            },
          },
        ],
        { cancelable: false }
      );
    } else {
      const aryFacility = []
      aryFacility.push({ 'branch': curBranch, 'facility': curFacility.facilityid, 'access': 'single'})
      USER_DB.updateProfile({requestFacility: aryFacility}, onUpdated(curFacility))      
    }
  }

  const onUpdated = (item) => {
    setBranchModal(false)
    if (isFromRegister) {
      global.isFromCall = false
      navigation.navigate('Dashboard')
    } else {
      console.log("facility code ===>", item)
      route.params.onGoBackFromOptions(item)
      navigation.goBack()
    }
  }

  const openTerms = async () => {
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

      <Modal
          animationType="fade"
          transparent={true}
          visible={isBranchModal}
          onRequestClose={() => {
            setBranchModal(false)
            setBranch('')
          }}
        >
          <View style={styles.centeredView2}>
            <View style = {styles.navigationView2}>
              <View style={{flex:1}}/>
              <Text style={styles.pageTitle1}>Select Branch</Text> 
              <View style={{flex:1}}/>
              <TouchableOpacity style={styles.arrowButton} onPress={() => {
                setBranchModal(false)
                setBranch('')
              }}>
                <Image style={styles.arrowImage} source={require('../assets/images/home/icon_bclose.png')}/>
              </TouchableOpacity>
            </View>

            <View style={styles.listView}>
              <Text style={styles.branchText}>Branches</Text> 
              <FlatList
                style={{marginTop: 8, flex: 1}}
                data={branchArray}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({item, index}) => (            
                  <TouchableOpacity style={styles.cellContentView} onPress={() => selectItem(item)} >
                    <Text style={styles.nameText}>{item.name}</Text> 
                    <View style={{flex: 1}}/>   
                    {curBranch == item.name ? <Image source={require('../assets/images/message/check.png')} style={styles.checkmarkRead} />  : <View key={item.name}/>}
                  </TouchableOpacity>     
                )}
              /> 

              <TouchableOpacity style={styles.loginButton1} onPress={onDonePressed}>
                <Text style={styles.loginText}>Proceed</Text>
              </TouchableOpacity>

            </View>
          </View>
        </Modal>

        <View style = {styles.navigationView}>
          <BackButton goBack={navigation.goBack} />
          <PageTitle>{isFromRegister ? 'Set Your Facility' : 'Change Your Facility'}</PageTitle>
        </View>

        <View style = {styles.contentView}>
          <Text style={styles.enterText}>{isFromRegister ? 'Please enter the facility code to verify the authorization.' : 'Please enter new facility code to verify the authorization.'}</Text>

          <View style={styles.inputView}>
            {[inputRef1, inputRef2, inputRef3, inputRef4, inputRef5].map(
              (inputRef, i) => (
                <CustomTextInput
                  containerStyle={styles.OTPTextView}
                  value={otpArray[i]}
                  onKeyPress={onOtpKeyPress(i)}
                  onChangeText={onOptChange(i)}
                  keyboardType="default"                 
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
            <Text style={styles.didnotText}>Didn't receive the facility code?  </Text>
          </View>

          <View style={{height : Platform.OS === 'ios' ? DEVICE_HEIGHT - getStatusBarHeight() - 503 : DEVICE_HEIGHT - 509 }} />
          <View style={{flex: 1}} />

          <TouchableOpacity style={styles.loginButton}onPress={onSubmitPressed}>
            <Text style={styles.loginText}>Proceed</Text>
          </TouchableOpacity>

          {/* <View style={styles.termsView}>
            <Text style={styles.byText}>By continuing you agree to </Text>
            <TouchableOpacity onPress={() => openTerms()}>
              <Text style={styles.termsText}>Terms and Conditions.</Text>
            </TouchableOpacity>
          </View> */}

        </View>
      </Background>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  navigationView: {
    width: '100%',
    height: Platform.OS === 'ios' ? 54 + getStatusBarHeight() : 60,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
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
    marginBottom: 40,
    marginHorizontal: 32,
    textAlign: 'center',

    fontSize: 18,    
    fontFamily: 'Poppins-Medium',
  },

  inputView: {
    flexDirection: 'row',
    marginHorizontal: 25,  
    height: 49,
    justifyContent: 'space-evenly'
  },

  OTPTextView: {
    height: 49,
    width: 49,
    marginHorizontal: (DEVICE_WIDTH - 49 * 5 - 50)/5,
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
    marginBottom: 96,
    borderRadius: 28.5,
    backgroundColor: theme.colors.lightYellow,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  loginButton1: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginLeft: 24,
    marginTop: 16,
    marginBottom: 47,
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
    marginBottom: 69,
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

  centeredView2: {
    width: DEVICE_WIDTH,
    height: DEVICE_HEIGHT,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: 'white'
  },

  navigationView2: {
    width: '100%',
    height: Platform.OS === 'ios' ? 54 + getStatusBarHeight() : 60,
    alignItems: 'flex-end',
    flexDirection: 'row',
    backgroundColor: theme.colors.inputBar
  },

  pageTitle1: {
    height: 30, 
    marginBottom: 14,  
    fontSize: 20, 
    lineHeight: 30,    
    fontFamily: 'Poppins-SemiBold', 
    fontWeight: '500',
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

  arrowButton: {
    width: 50, 
    height: 50, 
    position: 'absolute',
    right: 10,
    bottom: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  arrowImage: {
    width: 22,  
    height: 22
  },

  nameText: {
    marginTop: 14,
    marginLeft: 16,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',     
  },

  branchText: {
    paddingLeft: 16,
    paddingTop: 8,    
    fontSize: 15,
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',      
    color: theme.colors.sectionHeader
  },

  checkmarkRead: {
    marginTop: 16, 
    marginRight: 12,
    width: 16,
    height: 12,
    resizeMode: 'cover',
    tintColor: theme.colors.primary,
  },

  listView: {
    flex: 1,
    marginTop: 8,  
  },

  cellContentView: {    
    flex: 1,
    width: DEVICE_WIDTH - 32,
    height: 45,
    marginTop: 6,
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.inputBar,
    flexDirection: 'row',
  },

})