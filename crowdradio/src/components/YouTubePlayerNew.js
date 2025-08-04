import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { AntDesign } from '@expo/vector-icons';

/**
 * Simplified YouTube player with better fallback handling
 */
const YouTubePlayer = ({ videoUrl, isHost, onSongEnd, onNext, onPrevious }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showFallback, setShowFallback] = useState(false);

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

  if (!isHost) {
    return null;
  }

  if (!videoId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Invalid YouTube URL</Text>
      </View>
    );
  }

  const openInYouTube = async () => {
    try {
      const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const canOpen = await Linking.canOpenURL(youtubeUrl);
      if (canOpen) {
        await Linking.openURL(youtubeUrl);
      } else {
        // Fallback to browser
        await Linking.openURL(youtubeUrl);
      }
    } catch (error) {
      console.error('Failed to open YouTube:', error);
    }
  };

  const skipSong = () => {
    onNext && onNext();
  };

  // Simple HTML with direct YouTube embed
  const simpleEmbedHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #2C3E50;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          
          .player-container {
            width: 100%;
            height: 200px;
            position: relative;
          }
          
          .youtube-iframe {
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 8px;
          }
          
          .fallback {
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #1a252f;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            color: white;
            height: 100%;
          }
          
          .fallback button {
            background: #3498db;
            color: white;
            border: none;
            padding: 10px 20px;
            margin: 5px;
            border-radius: 5px;
            cursor: pointer;
          }
          
          .fallback button:hover {
            background: #2980b9;
          }
        </style>
      </head>
      <body>
        <div class="player-container">
          <iframe 
            id="youtube-iframe"
            class="youtube-iframe"
            src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1&rel=0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
          </iframe>
          
          <div id="fallback" class="fallback">
            <h3>🎵 Video Unavailable</h3>
            <p>This video cannot be played in the embedded player.</p>
            <div>
              <button onclick="openInYouTube()">Open in YouTube</button>
              <button onclick="skipSong()">Skip Song</button>
            </div>
            <small>Video ID: ${videoId}</small>
          </div>
        </div>
        
        <script>
          let loadTimeout;
          
          // Check if iframe loads successfully
          const iframe = document.getElementById('youtube-iframe');
          
          // Set a timeout to show fallback if iframe doesn't load
          loadTimeout = setTimeout(() => {
            showFallback();
          }, 5000);
          
          iframe.onload = function() {
            clearTimeout(loadTimeout);
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage('PLAYER_READY');
          };
          
          iframe.onerror = function() {
            clearTimeout(loadTimeout);
            showFallback();
          };
          
          function showFallback() {
            document.getElementById('youtube-iframe').style.display = 'none';
            document.getElementById('fallback').style.display = 'flex';
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage('EMBEDDING_RESTRICTED');
          }
          
          function openInYouTube() {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage('OPEN_IN_YOUTUBE');
          }
          
          function skipSong() {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage('SKIP_SONG');
          }
          
          // Monitor for cross-origin issues
          try {
            iframe.addEventListener('error', showFallback);
          } catch (e) {
            console.log('Could not add error listener:', e);
          }
        </script>
      </body>
    </html>
  `;

  // Handle messages from WebView
  const handleWebViewMessage = (event) => {
    const message = event.nativeEvent.data;
    
    switch (message) {
      case 'PLAYER_READY':
        setLoading(false);
        setPlayerReady(true);
        setError(false);
        setShowFallback(false);
        break;
        
      case 'EMBEDDING_RESTRICTED':
        setLoading(false);
        setShowFallback(true);
        setErrorMessage('Video embedding restricted');
        break;
        
      case 'OPEN_IN_YOUTUBE':
        openInYouTube();
        break;
        
      case 'SKIP_SONG':
        skipSong();
        break;
        
      default:
        console.log('YouTube player message:', message);
    }
  };

  if (showFallback) {
    return (
      <View style={styles.container}>
        <View style={styles.fallbackContainer}>
          <AntDesign name="exclamationcircle" size={32} color="#e74c3c" />
          <Text style={styles.fallbackTitle}>Video Unavailable</Text>
          <Text style={styles.fallbackText}>
            This video cannot be played in the embedded player.
          </Text>
          <View style={styles.fallbackButtons}>
            <TouchableOpacity style={styles.fallbackButton} onPress={openInYouTube}>
              <Text style={styles.fallbackButtonText}>Open in YouTube</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.fallbackButton, styles.skipButton]} onPress={skipSong}>
              <Text style={styles.fallbackButtonText}>Skip Song</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.videoIdText}>Video ID: {videoId}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      )}
      
      <WebView
        style={styles.webView}
        originWhitelist={['*']}
        source={{ html: simpleEmbedHTML }}
        onMessage={handleWebViewMessage}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        onError={() => {
          setLoading(false);
          setShowFallback(true);
          setErrorMessage('Failed to load video player');
        }}
        onLoadEnd={() => {
          // Backup timeout in case messages don't come through
          setTimeout(() => {
            if (loading) {
              setLoading(false);
              setShowFallback(true);
            }
          }, 8000);
        }}
      />
      
      {playerReady && !loading && (
        <View style={styles.playerInfo}>
          <AntDesign name="sound" size={16} color="#3498db" />
          <Text style={styles.playerInfoText}>Playing audio</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200,
    width: '100%',
    backgroundColor: '#2C3E50',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#2C3E50',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2C3E50',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
  },
  errorContainer: {
    height: 200,
    backgroundColor: '#2C3E50',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    textAlign: 'center',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a252f',
  },
  fallbackTitle: {
    color: '#e74c3c',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  fallbackText: {
    color: '#95a5a6',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  fallbackButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  fallbackButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  skipButton: {
    backgroundColor: '#95a5a6',
  },
  fallbackButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  videoIdText: {
    color: '#7f8c8d',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  playerInfo: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerInfoText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
  },
});

export default YouTubePlayer;
