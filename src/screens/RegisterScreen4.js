import React, { useState, useEffect } from 'react'
import { StyleSheet, View, TouchableOpacity, Text, Dimensions, TouchableWithoutFeedback, Platform, Alert, Modal, FlatList, Image } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import CustomTextInput from '../components/CustomTextInput'
import { theme } from '../core/theme'
import USER_DB from '../api/userDB'

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

export default function RegisterScreen4({route, navigation }) {
  const { facility, isFromRegister } = route.params;
  const [branchArray, setBranchArray] = useState([])
  const [curBranch, setBranch] = useState('')
  
  useEffect(() => {
    getBranches();
  }, []);
 
  const getBranches = () => {
    const aryBranch = facility.branch
    setBranchArray(aryBranch)

    if(aryBranch.length == 1){
        setBranch(aryBranch[0].name)
    }
  };

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
      const aryRequestFacility = []
      aryFacility.push({ 'branch': "ATL", 'facility': "YO7rs25rZ4InCTwFv4HK", 'access': 'single'})
      aryRequestFacility.push({ 'branch': curBranch, 'facility': facility.facilityid, 'access': 'single'})

      USER_DB.updateProfile({facility: aryRequestFacility}, onUpdated(facility))      
    }
  }

  const onUpdated = () => {
    if (isFromRegister) {
        global.isFromCall = false
        navigation.navigate('Dashboard')
    } else {
        navigation.goBack()
    }    
  }

  return (
    <TouchableWithoutFeedback  accessible={false}>
        <Background>
            <View style = {styles.navigationView}>
                <TouchableOpacity onPress={navigation.goBack} style={styles.containerBack}>
                    <Image style={styles.imageBack} source={require('../assets/images/login/arrow_back.png')}/>
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
                        <View style={styles.activedCircle}>
                            <Text style={styles.circleActiveText}>2</Text>
                        </View>
                        <Text style={styles.stepText}>Email Verification</Text>
                    </View>

                    <View style = {{flex: 1, height: 80, alignItems: 'center', justifyContent: 'center'}}>
                        <View style={styles.activeCircle}>
                            <Text style={styles.circleActiveText}>3</Text>
                        </View>
                        <Text style={styles.stepActiveText}>Facility</Text>
                    </View>
                </View>

                <View style={{flexDirection: 'row', marginTop: 20}}>
                    <Text style={styles.enterText}>{facility.title}</Text> 
                    <Text style={styles.branchText}>{facility.facilityCode}</Text> 
                </View>

                <Text style={styles.selectText}>Select Branch</Text> 
                
                <FlatList
                    style={{marginTop: 8, flex: 1}}
                    contentContainerStyle={{marginBottom: 80}}
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

                <TouchableOpacity style={{...styles.loginButton, backgroundColor: curBranch == '' ? theme.colors.disabledYellow : theme.colors.lightYellow}} onPress={onDonePressed}>
                    <Text style={styles.loginText}>Proceed</Text>
                </TouchableOpacity>

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

  enterText: {
    textAlign: 'center',
    fontSize: 17,    
    fontFamily: 'Poppins-Medium',
  },

  branchText: {
    paddingLeft: 12,  
    paddingTop: 4,
    fontSize: 13,
    fontFamily: 'Poppins-Regular',      
  },

  selectText: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: 'Poppins-Regular', 
    color: theme.colors.lightGray  
  },

  loginButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginTop: 2,
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


  nameText: {
    marginTop: 14,
    marginLeft: 16,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',     
  },

  checkmarkRead: {
    marginTop: 16, 
    marginRight: 12,
    width: 16,
    height: 12,
    resizeMode: 'cover',
    tintColor: theme.colors.primary,
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