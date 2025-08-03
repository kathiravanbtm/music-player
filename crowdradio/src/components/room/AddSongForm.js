import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import Input from '../ui/Input';
import Button from '../ui/Button';

const AddSongForm = ({ onAddSong, isLoading = false }) => {
  const [songUrl, setSongUrl] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateYouTubeUrl = (url) => {
    if (!url) return false;
    return url.includes('youtube.com/watch?v=') || url.includes('youtu.be/');
  };

  const handleAddSong = async () => {
    // Prevent multiple submissions
    if (isSubmitting || isLoading) {
      return;
    }

    if (!songUrl.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!validateYouTubeUrl(songUrl)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setError('');
    setIsSubmitting(true);
    
    try {
      await onAddSong(songUrl.trim());
      setSongUrl(''); // Clear the input only on success
    } catch (error) {
      console.error('Error adding song:', error);
      Alert.alert('Error', 'Failed to add song. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isButtonDisabled = !songUrl.trim() || isLoading || isSubmitting;

  return (
    <View>
      <Input
        label="Add a YouTube Song"
        placeholder="Paste YouTube URL here..."
        value={songUrl}
        onChangeText={(text) => {
          setSongUrl(text);
          if (error) setError('');
        }}
        error={error}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isSubmitting && !isLoading}
      />
      
      <Button
        title={isSubmitting ? "Adding Song..." : "Add Song"}
        onPress={handleAddSong}
        loading={isSubmitting || isLoading}
        disabled={isButtonDisabled}
      />
    </View>
  );
};

export default AddSongForm;
