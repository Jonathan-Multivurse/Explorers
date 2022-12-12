import React, { Component } from 'react'
import { Platform, StyleSheet, View, TouchableOpacity, Text, TextInput, Dimensions, ActivityIndicator, Image, ScrollView, Alert } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import { theme } from '../core/theme'
import SURVEY_DB from '../api/surveyDB'
import auth, {firebase} from "@react-native-firebase/auth"

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

export default class SurveyScreen extends Component {
    constructor(props) {
        super(props)
        this._unsubscribeFocus = null;
        
        this.state = { 
            isLoading: false, 
            isExpand: false,  
            surveyId: this.props.route.params.surveyId,
            survey: null,
            questions: [],
            questionIndex: 0,
            answers: [],  
            isSubExpand: false, 
        }
    }

    componentDidMount() {
        this._unsubscribeFocus = this.props.navigation.addListener('focus', () => {
            this.getSurvey();
        });
    }

    componentWillUnmount() {    
        this._unsubscribeFocus();
    }

    getSurvey = () => {            
        this.setState({
          isLoading: true,
        });
    
        SURVEY_DB.getSurvey( this.props.route.params.surveyId, this.onGetSurvey)         
    }

    onGetSurvey = (temp) => {
        let answers = []
        temp.questions.map((question) => {
            if (question.type == 'Text') {
                answers.push([''])
            } else if (question.type == 'Radio Options') {
                answers.push([''])
            } else if (question.type == 'Multiple Choice') {
                answers.push([''])
            } else {
                answers.push([''])
            }
        })

        this.setState({
            isLoading: false,
            survey: temp,
            questions: temp.questions,
            answers: answers            
        })
    }

    continue = () => {
        if (this.state.questions.length > 0) {
            if (this.state.questionIndex == this.state.questions.length - 1){
                this.setState({isLoading: true})
                console.log(this.state.answers)
                let answers = []

                for (let i = 0; i < this.state.answers.length; i++) {
                    const temp = this.state.answers[i]
                    let tmp = temp.toString()
                    answers.push(tmp)
                }

                console.log(answers)
                // SURVEY_DB.addSurveyAnswer(this.state.survey.surveyId, answers, this.goBack)

                const userID = firebase.auth().currentUser.uid;
                const surveyID = this.state.survey.surveyId;
                const notificationID = this.props.route.params.notificationId

                fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/addSurveyAnswer', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        surveyid: surveyID,
                        userid: userID,
                        notificationid: notificationID,
                        answers: answers,
                    }),
                })
                .then((response) => response.json())
                .then((responseJson) => {            
                    if (responseJson.statusCode !== 200) {
                        this.setState({
                            isLoading: false,
                        });
                        return;
                    }
                
                    this.setState({
                        isLoading: false,
                    });                
                    this.goBack()
                })
                .catch((err) => {        
                    this.setState({
                        isLoading: false,
                        isSelect: false
                    });
                    Alert.alert('Network Error', 'Please check your network connection and try again.')
                }); 

            } else {
                let tmpIndex = this.state.questionIndex + 1;
                this.setState({questionIndex: tmpIndex})
            }
        }
    }

    goBack = () => {
        this.setState({isLoading: false})
        this.props.navigation.goBack()
    }

    goPreview = () => {
        if (this.state.questionIndex > 0) {
            let tmpIndex = this.state.questionIndex - 1;
            this.setState({questionIndex: tmpIndex})
        }
    }

    singleSelectRow = (text, index) => {
        console.log("Text ====>", text)
        let answers = this.state.answers
        let temp = answers[index]
        temp.splice(0, 1);
        temp.push(text)

        answers.splice(index, 0)
        answers.splice(index, 1, temp)
        console.log(answers)
        this.setState({answers: answers})
    }

    updateExpand = () => {        
        this.setState({isSubExpand: !this.state.isSubExpand})
    }

    multiSelectRow = (text, index) => {
        let answers = this.state.answers
        const temp = answers[index]

        if (temp[0] == ''){
            temp.splice(0, 1);
        }

        const findex = temp.indexOf(text);
        if (findex > -1) {
            temp.splice(findex, 1);
        } else {
            temp.push(text)
        }

        answers.splice(index, 0)
        answers.splice(index, 1, temp)
        console.log(answers)
        this.setState({answers: answers})
    }
  
   render() {
    return (
      <Background>

        <View style={styles.topView}> 
            <View style = {styles.navigationView}>
                <TouchableOpacity onPress={() => this.props.navigation.goBack()} style={styles.backButton}>
                    <Image style={styles.closeImage} source={require('../assets/images/faqs/icon_gclose.png')}/>
                </TouchableOpacity>
                <View style={{flex:5}}/>
                <Text style={styles.pageTitle}>{this.state.survey ? this.state.survey.title : ''}</Text> 
                <TouchableOpacity onPress={() => this.setState({isExpand: !this.state.isExpand})} style={styles.arrowButton}>
                    <Image style={styles.arrowImage} source={this.state.isExpand ? require('../assets/images/faqs/arrow_up_blue.png') : require('../assets/images/faqs/arrow_down_blue.png')}/>
                </TouchableOpacity>
                <View style={{flex:6}}/>
            </View>

            { this.state.isExpand ? (<Text style={styles.descriptionText}>{this.state.survey == null ? '' : this.state.survey.description}</Text>) : null }        
        </View>

        {this.state.survey == null ? null :
        (<ScrollView 
            horizontal={true}
            alwaysBounceHorizontal={false}
            style={styles.horizentalContainer}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            pagingEnabled={true}
            ref={(snapScroll) => {this.snapScroll = snapScroll}}
            contentOffset={{x:DEVICE_WIDTH * this.state.questionIndex, y:0}}
            scrollEnabled={false}
            >

            {this.state.questions.map((item, index) =>                 
                (<View style = {styles.contentView} key={index}> 
                    <View style={{flexDirection: 'row', width: DEVICE_WIDTH}}>
                        { 
                            index == 0 ? null : 
                            (<TouchableOpacity onPress={() => this.goPreview()} style={styles.arrowBack}>
                                <Image style={{width:12, height: 20.5}} source={require('../assets/images/login/arrow_back.png')}/>
                            </TouchableOpacity>)
                        }
                        <Text style={styles.pageIndexText}>{(index +1).toString() + " of " + this.state.survey.questions.length.toString()}</Text>
                    </View>                    
                        
                    <Text style={styles.pleaseText}>{item.title}</Text>
                    {   
                        item.type == 'Text' ? 
                            (<TextInput
                            style={styles.emailInput}
                            value={this.state.answers[index][0]}
                            onChangeText={ (text) => this.singleSelectRow(text, index) }
                            autoCapitalize="none"
                            autoCompleteType="name"
                            textContentType="name"
                            keyboardType="name-phone-pad"/>) 
                        : item.type == 'Radio Options' ?
                            item.options.map((option, optionIndex) => (
                                <TouchableOpacity onPress={() => this.singleSelectRow(option, index)} key={optionIndex} style={{flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'flex-start'}}>
                                    <Image style={{width: 24, height: 24, marginLeft: 28, marginTop: 8, marginBottom: 8}} source={this.state.answers[index][0] == option? require('../assets/images/faqs/radio_select.png') : require('../assets/images/faqs/radio_unSelect.png')}/>
                                    <Text style={{ marginLeft: 12, fontSize: 16, lineHeight: 22, fontFamily: 'Poppins-Regular'}}>{option}</Text>

                                </TouchableOpacity>
                            )) 
                        : item.type == 'Multiple Choice' ?
                            item.options.map((option, optionIndex) => (
                                <TouchableOpacity onPress={() => this.multiSelectRow(option, index)} key={optionIndex} style={{flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'flex-start'}}>
                                    <Image style={{width: 24, height: 24, marginLeft: 28, marginTop: 8, marginBottom: 8}} source={ this.state.answers[index].includes(option) ? require('../assets/images/faqs/check_check.png') : require('../assets/images/faqs/radio_unSelect.png')}/>
                                    <Text style={{ marginLeft: 12, fontSize: 16, lineHeight: 22, fontFamily: 'Poppins-Regular'}}>{option}</Text>

                                </TouchableOpacity>
                            ))                            
                        : (<View>
                            <TouchableOpacity onPress={() => this.updateExpand()} style={{...styles.emailInput, flexDirection: 'row', alignItems: 'center'}} >
                                <Text style={{fontSize: 16, lineHeight: 22, fontFamily: 'Poppins-Regular'}}>{this.state.answers[index][0] == '' ? 'Select' : this.state.answers[index][0]}</Text>
                                <View style={{flex: 1}}/>
                                <Image style={{width: 16.25, height:9.5}} source={ this.state.isSubExpand ? require('../assets/images/faqs/arrow_up_blue.png') : require('../assets/images/faqs/arrow_down_blue.png')} />
                            </TouchableOpacity>

                            {this.state.isSubExpand ? 
                                (<View style={{borderRadius: 10, marginHorizontal: 16, marginTop: 12, marginBottom: 12}}>
                                    {item.options.map((option, optionIndex) => (
                                        <TouchableOpacity key={optionIndex} onPress={() => this.singleSelectRow(option, index)} style={{justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'flex-start'}}>
                                            <Text style={{ marginTop: 12, marginBottom: 12, marginLeft: 12, fontSize: 16, lineHeight: 22, fontFamily: 'Poppins-Regular'}}>{option}</Text>
                                        </TouchableOpacity>
                                    ))}  
                                </View>) 
                                : null}

                        </View>)
                    }
                    
                </View>) 
            )}            
        </ScrollView>)
        }

        <TouchableOpacity style={styles.loginButton} onPress={() => this.continue()}>
            <Text style={styles.loginText}>{this.state.questionIndex == this.state.questions.length - 1 ? 'Done' : 'Continue'}</Text>
        </TouchableOpacity>     

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

    topView: {
      alignItems: 'flex-start',
      width: DEVICE_WIDTH, 
      backgroundColor: theme.colors.inputBar 
    },
  
    navigationView: {
        width: '100%',
        height: Platform.OS === 'ios' ? 54 + getStatusBarHeight() : 60,
        alignSelf: 'center',
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        flexDirection: 'row',
        backgroundColor: theme.colors.inputBar,
        flexDirection: 'row'    
    },

    backButton: {
        width: 50, 
        height: 50, 
        paddingBottom: 18, 
        paddingLeft: 20, 
        justifyContent: 'flex-end'
    },

    closeImage: {
        width: 22, 
        height: 22
    },

    pageTitle: {
        height: 30, 
        marginBottom: 14,  
        fontSize: 20, 
        lineHeight: 30,    
        fontFamily: 'Poppins-SemiBold', 
        fontWeight: '500'
    },

    arrowButton: {
        width: 41.3, 
        height: 50, 
        paddingBottom: 24, 
        paddingLeft: 15, 
        justifyContent: 'flex-end'
    },

    arrowImage: {
        width: 11.3,  
        height: 6.7
    },

    descriptionText: {
        marginHorizontal: 16, 
        marginBottom: 17, 
        color: '#464646', 
        textAlign: 'left', 
        fontSize: 13, 
        lineHeight: 20,    
        fontFamily: 'Poppins-Regular', 
        fontWeight: '500'
    },

    horizentalContainer: {
        width: DEVICE_WIDTH,
        flex: 1,
        marginBottom: 134,    
    },

    contentView: {
        width: DEVICE_WIDTH,
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
    },

    pageIndexText: {
        marginLeft: 20, 
        marginTop: 27, 
        marginBottom: 10,
        alignSelf: 'flex-start', 
        fontSize: 14, 
        lineHeight: 21, 
        fontFamily: 'Poppins-Regular', 
        color: theme.colors.lightGray
    },

    pleaseText: {
        marginTop: 11,
        marginBottom: 10,
        alignSelf: 'flex-start',
        marginHorizontal: 20,
        fontSize: 18,
        lineHeight: 27,
        fontFamily: 'Poppins-Medium',
        textAlign: 'left'
    },

    arrowBack: {
        width: 36, 
        paddingLeft: 16, 
        paddingTop: 26.5, 
        paddingBottom: 10
    },

    emailInput: {
        width: DEVICE_WIDTH - 32,
        height: 44,
        marginTop: 7,
        borderRadius: 10,
        backgroundColor: '#F2F2F2',
        paddingLeft: 12,
        paddingRight: 12,
    },

    loginButton: { 
        width: DEVICE_WIDTH - 48,
        height: 57,
        position: 'absolute',
        left: 24,
        top: DEVICE_HEIGHT - 124,
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
