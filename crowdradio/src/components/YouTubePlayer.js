import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { AntDesign } from '@expo/vector-icons';

const YouTubePlayer = ({ videoUrl, isHost, onSongEnd }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Extract video ID from YouTube URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    
    let videoId = null;
    
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1];
      const ampersandPosition = videoId.indexOf('&');
      if (ampersandPosition !== -1) {
        videoId = videoId.substring(0, ampersandPosition);
      }
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1];
      const questionMarkPosition = videoId.indexOf('?');
      if (questionMarkPosition !== -1) {
        videoId = videoId.substring(0, questionMarkPosition);
      }
    }
    
    return videoId;
  };
  
  const videoId = getYouTubeVideoId(videoUrl);
  
  if (!videoId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Invalid YouTube URL</Text>
      </View>
    );
  }

  // Create YouTube embed HTML with autoplay and event handling
  const youtubeHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          body { margin: 0; padding: 0; background-color: #000; }
          #player { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <div id="player"></div>
        <script>
          // Load YouTube IFrame Player API
          var tag = document.createElement('script');
          tag.src = "https://www.youtube.com/iframe_api";
          var firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

          var player;
          function onYouTubeIframeAPIReady() {
            player = new YT.Player('player', {
              height: '100%',
              width: '100%',
              videoId: '${videoId}',
              playerVars: {
                'playsinline': 1,
                'autoplay': 1,
                'controls': ${isHost ? 1 : 0}
              },
              events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError
              }
            });
          }

          function onPlayerReady(event) {
            window.ReactNativeWebView.postMessage('PLAYER_READY');
          }

          function onPlayerStateChange(event) {
            window.ReactNativeWebView.postMessage('STATE_' + event.data);
            
            // If video ended (state = 0) and is host
            if (event.data === 0 && ${isHost ? 'true' : 'false'}) {
              window.ReactNativeWebView.postMessage('VIDEO_ENDED');
            }
          }
          
          function onPlayerError(event) {
            window.ReactNativeWebView.postMessage('ERROR_' + event.data);
          }
        </script>
      </body>
    </html>
  `;

  // Handle messages from the WebView
  const handleWebViewMessage = (event) => {
    const message = event.nativeEvent.data;
    
    if (message === 'PLAYER_READY') {
      setLoading(false);
    } else if (message === 'VIDEO_ENDED') {
      // Call parent callback when video ends
      onSongEnd && onSongEnd();
    } else if (message.startsWith('ERROR_')) {
      setError(true);
      console.log('YouTube player error:', message);
    }
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <AntDesign name="youtube" size={48} color="#FF0000" />
          <Text style={styles.loadingText}>Loading YouTube video...</Text>
        </View>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <AntDesign name="warning" size={48} color="#FFCC00" />
          <Text style={styles.errorText}>Failed to load video</Text>
        </View>
      )}
      
      <WebView
        style={styles.webView}
        originWhitelist={['*']}
        source={{ html: youtubeHTML }}
        onMessage={handleWebViewMessage}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 220,
    width: '100%',
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  errorText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  }
});

export default YouTubePlayer;
