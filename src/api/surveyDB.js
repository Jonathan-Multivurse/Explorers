import auth, {firebase} from "@react-native-firebase/auth"
import firestore from '@react-native-firebase/firestore'

const surveysCollection = firestore().collection('survey');

const SURVEY_DB = {

  addSurveyAnswer: async (docID, answers, userAction) => {     
      const userid = auth().currentUser.uid
      
      surveysCollection
      .doc(docID)
      .collection("answers")
      .add({
          userID: userid,
          answers: answers,           
          date: new Date().getTime()
      })
      .then(() => {
          userAction()
      })
  },


  updateDSurvey: async (docID, values, userAction) => {   
    surveysCollection
    .doc(docID)
    .update(values)
    .then(() => {
        console.log('Survey updated!');
        userAction()
    });        
  },

  deleteSurvey: async (docID, userAction) => {   
    surveysCollection
    .doc(docID)
    .delete()
    .then(() => {
        console.log('Survey deleted!');
        userAction()
    });        
  },

  getSurvey: async(surveyId, userAction) => {
    surveysCollection
      .doc(surveyId)
      .get()
      .then(querySnapshot => {    
        if (querySnapshot.exists) {
          userAction(querySnapshot.data())
        }
    }); 

  },

  getSurveys: async (userAction) => {
    surveysCollection
      .orderBy('status')
      .get()
      .then(querySnapshot => {
        console.log('Total Surveys: ', querySnapshot.size);
        
        const surveys = []
        querySnapshot.forEach(documentSnapshot => {
            surveys.push({...documentSnapshot.data(), surveyId: documentSnapshot.id})
        });
        userAction(surveys)
    });      
  },    
};

export default SURVEY_DB;