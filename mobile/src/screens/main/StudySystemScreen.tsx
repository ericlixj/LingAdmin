import React, {useState} from 'react';
import {View} from 'react-native';
import StudySessionListScreen from './StudySessionListScreen';

interface StudySystemScreenProps {
  navigation: any;
}

const StudySystemScreen: React.FC<StudySystemScreenProps> = ({navigation}) => {
  const handleStartPractice = (sessionId: number, mode: 'all' | 'wrong' | 'favorite') => {
    navigation.navigate('Practice', {
      sessionId,
      practiceMode: mode,
    });
  };

  return (
    <View style={{flex: 1}}>
      <StudySessionListScreen
        navigation={navigation}
        onStartPractice={handleStartPractice}
      />
    </View>
  );
};

export default StudySystemScreen;
