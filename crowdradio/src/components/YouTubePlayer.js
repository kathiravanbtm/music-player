// filepath: /home/baymax/Documents/projects/music-player/crowdradio/src/components/YouTubePlayer.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { AntDesign } from '@expo/vector-icons';

/**
 * A simplified YouTube audio player component focused solely on audio playback
 * This implementation uses a direct HTML5-friendly approach to improve compatibility
 */
const YouTubePlayer = ({ videoUrl, isHost, onSongEnd }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerState, setPlayerState] = useState('loading'); // loading, playing, paused, error
  const [retry, setRetry] = useState(0);
  
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

  // Enhanced HTML for better audio playback with improved controls
  const enhancedAudioHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <style>
          body {
            margin: 0;
            padding: 8px;
            background-color: #2C3E50;
            color: white;
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            overflow: hidden;
          }
          
          .audio-player {
            width: 100%;
            max-width: 400px;
            margin: 0 auto;
            text-align: center;
          }
          
          .audio-title {
            font-size: 14px;
            font-weight: bold;
            margin: 8px 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            opacity: 0.9;
          }
          
          .controls {
            display: flex;
            justify-content: center;
            gap: 12px;
            margin: 12px 0;
          }
          
          .control-button {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #3498db;
            border: none;
            color: white;
            font-size: 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          }
          
          .control-button:hover {
            background: #2980b9;
            transform: scale(1.05);
          }
          
          .control-button:disabled {
            background: #7f8c8d;
            cursor: not-allowed;
            transform: none;
          }
          
          .play-button {
            width: 44px;
            height: 44px;
            background: #e74c3c;
          }
          
          .play-button:hover {
            background: #c0392b;
          }
          
          .progress {
            width: 100%;
            height: 6px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
            position: relative;
            margin: 10px 0;
            cursor: pointer;
          }
          
          .progress-bar {
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            background: #3498db;
            border-radius: 3px;
            width: 0%;
            transition: width 0.3s ease;
          }
          
          .time-info {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
          }
          
          .status {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
            margin-top: 10px;
          }
          
          .visualizer {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 40px;
            gap: 2px;
            margin: 10px 0;
          }
          
          .bar {
            width: 3px;
            height: 3px;
            background: #3498db;
            border-radius: 1px;
          }
          
          .bar.active {
            animation: pulse 1s infinite;
          }
          
          @keyframes pulse {
            0% { height: 3px; }
            50% { height: 20px; }
            100% { height: 3px; }
          }

          #youtube-player {
            position: fixed;
            bottom: 0;
            right: 0;
            width: 320px;
            height: 240px;
            opacity: 0.01;
            pointer-events: none;
            z-index: -10;
            border: none;
          }
        </style>
      </head>
      <body>
        <div class="audio-player">
          <div class="audio-title" id="title">Loading audio...</div>
          
          <div class="visualizer" id="visualizer">
            <!-- Bars will be added dynamically -->
          </div>
          
          <div class="progress" id="progress-container">
            <div class="progress-bar" id="progress"></div>
          </div>
          
          <div class="time-info">
            <span id="current-time">0:00</span>
            <span id="duration">0:00</span>
          </div>
          
          <div class="controls">
            <button class="control-button" id="play-pause" onclick="togglePlayback()">▶</button>
            <button class="control-button" id="volume" onclick="toggleMute()">🔊</button>
          </div>
          
          <div class="status" id="status">Connecting...</div>
        </div>
        
        <!-- YouTube player container -->
        <div id="youtube-player"></div>
        
        <script>
          // Main configuration
          const videoId = "${videoId}";
          const isHost = ${isHost};
          let player = null;
          let isPlaying = isHost;
          let isMuted = false;
          let currentTime = 0;
          let duration = 0;
          let progressInterval = null;
          let heartbeatInterval = null;

          // Setup visualizer bars
          function setupVisualizer() {
            const visualizer = document.getElementById('visualizer');
            visualizer.innerHTML = '';
            
            for (let i = 0; i < 16; i++) {
              const bar = document.createElement('div');
              bar.className = 'bar';
              bar.style.animationDelay = \`\${i * 0.1}s\`;
              visualizer.appendChild(bar);
            }
          }
          
          // Format time in MM:SS
          function formatTime(seconds) {
            if (isNaN(seconds) || seconds === Infinity) return '0:00';
            const min = Math.floor(seconds / 60);
            const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
            return \`\${min}:\${sec}\`;
          }
          
          // Update progress bar
          function updateProgress() {
            if (duration > 0) {
              const progressPercent = (currentTime / duration) * 100;
              document.getElementById('progress').style.width = Math.min(progressPercent, 100) + '%';
            }
            
            document.getElementById('current-time').textContent = formatTime(currentTime);
            document.getElementById('duration').textContent = formatTime(duration);
          }
          
          // Update status message
          function updateStatus(message) {
            document.getElementById('status').textContent = message;
          }
          
          // Control visualizer animation
          function activateVisualizer(active) {
            const bars = document.querySelectorAll('.visualizer .bar');
            bars.forEach(bar => {
              if (active) {
                bar.classList.add('active');
              } else {
                bar.classList.remove('active');
              }
            });
          }
          
          // Toggle play/pause
          function togglePlayback() {
            if (player && typeof player.getPlayerState === 'function') {
              const playerState = player.getPlayerState();
              if (playerState === 1) { // Playing
                player.pauseVideo();
              } else {
                player.playVideo();
              }
            } else {
              isPlaying = !isPlaying;
              
              if (isPlaying) {
                updateStatus('Playing');
                document.getElementById('play-pause').textContent = '❚❚';
                activateVisualizer(true);
                window.ReactNativeWebView.postMessage('PLAYING');
              } else {
                updateStatus('Paused');
                document.getElementById('play-pause').textContent = '▶';
                activateVisualizer(false);
                window.ReactNativeWebView.postMessage('PAUSED');
              }
            }
          }
          
          // Toggle mute
          function toggleMute() {
            isMuted = !isMuted;
            
            if (player && typeof player.mute === 'function' && typeof player.unMute === 'function') {
              if (isMuted) {
                player.mute();
              } else {
                player.unMute();
              }
            }
            
            document.getElementById('volume').textContent = isMuted ? '🔇' : '🔊';
            updateStatus(isMuted ? 'Muted' : isPlaying ? 'Playing' : 'Paused');
            window.ReactNativeWebView.postMessage('MUTE_TOGGLED:' + isMuted);
          }
          
          // Handle song end
          function handleSongEnd() {
            isPlaying = false;
            document.getElementById('play-pause').textContent = '▶';
            activateVisualizer(false);
            updateStatus('Song ended');
            window.ReactNativeWebView.postMessage('SONG_ENDED');
            
            if (progressInterval) {
              clearInterval(progressInterval);
            }
          }
          
          // Load and initialize YouTube API
          function loadYouTubeAPI() {
            // Inject YouTube API script if not already present
            if (!window.YT) {
              const tag = document.createElement('script');
              tag.src = 'https://www.youtube.com/iframe_api';
              const firstScript = document.getElementsByTagName('script')[0];
              firstScript.parentNode.insertBefore(tag, firstScript);
            } else if (window.YT && window.YT.Player) {
              createPlayer();
            }
            
            window.onYouTubeIframeAPIReady = createPlayer;
          }
          
          // Create YouTube player
          function createPlayer() {
            try {
              player = new YT.Player('youtube-player', {
                videoId: videoId,
                playerVars: {
                  autoplay: isHost ? 1 : 0,
                  controls: 0,
                  disablekb: 1,
                  fs: 0,
                  iv_load_policy: 3,
                  modestbranding: 1,
                  playsinline: 1,
                  rel: 0,
                  showinfo: 0,
                  origin: window.location.origin,
                  mute: 0
                },
                events: {
                  'onReady': onPlayerReady,
                  'onStateChange': onPlayerStateChange,
                  'onError': onPlayerError
                }
              });
              
              updateStatus('Initializing YouTube player...');
            } catch (error) {
              console.error('Error creating YouTube player:', error);
              updateStatus('Error creating player: ' + error.message);
              window.ReactNativeWebView.postMessage('PLAYER_ERROR:' + error.message);
            }
          }
          
          // YouTube API callbacks
          function onPlayerReady(event) {
            window.ReactNativeWebView.postMessage('PLAYER_READY');
            
            // Set player volume to 100% and ensure it's not muted
            event.target.setVolume(100);
            event.target.unMute();
            
            // Start playing if host
            if (isHost) {
              event.target.playVideo();
              document.getElementById('play-pause').textContent = '❚❚';
              updateStatus('Playing');
              activateVisualizer(true);
            } else {
              updateStatus('Ready to play');
            }
            
            // Get video details
            try {
              duration = event.target.getDuration() || 0;
              const videoData = event.target.getVideoData();
              if (videoData && videoData.title) {
                document.getElementById('title').textContent = videoData.title;
                window.ReactNativeWebView.postMessage('TITLE:' + videoData.title);
              }
            } catch (e) {
              console.error('Error getting video details:', e);
            }
            
            updateProgress();
            
            // Start progress tracking
            if (progressInterval) clearInterval(progressInterval);
            progressInterval = setInterval(() => {
              if (isPlaying && player && typeof player.getCurrentTime === 'function') {
                try {
                  currentTime = player.getCurrentTime();
                  updateProgress();
                } catch (e) {
                  console.error('Error updating progress:', e);
                }
              }
            }, 1000);
          }
          
          function onPlayerStateChange(event) {
            switch (event.data) {
              case YT.PlayerState.PLAYING:
                isPlaying = true;
                document.getElementById('play-pause').textContent = '❚❚';
                activateVisualizer(true);
                updateStatus('Playing');
                window.ReactNativeWebView.postMessage('PLAYING');
                break;
                
              case YT.PlayerState.PAUSED:
                isPlaying = false;
                document.getElementById('play-pause').textContent = '▶';
                activateVisualizer(false);
                updateStatus('Paused');
                window.ReactNativeWebView.postMessage('PAUSED');
                break;
                
              case YT.PlayerState.ENDED:
                handleSongEnd();
                break;
                
              case YT.PlayerState.BUFFERING:
                updateStatus('Buffering...');
                break;
                
              case YT.PlayerState.CUED:
                updateStatus('Video cued');
                break;
            }
          }
          
          function onPlayerError(event) {
            const errorCodes = {
              2: 'Invalid video ID',
              5: 'HTML5 player error',
              100: 'Video not found',
              101: 'Video unavailable',
              150: 'Video unavailable'
            };
            
            const errorMessage = errorCodes[event.data] || 'Unknown error ' + event.data;
            console.error('YouTube player error:', errorMessage);
            updateStatus('Error: ' + errorMessage);
            window.ReactNativeWebView.postMessage('PLAYER_ERROR:' + errorMessage);
            
            // Try to recover from the error
            setTimeout(() => {
              if (player && typeof player.cueVideoById === 'function') {
                try {
                  player.cueVideoById(videoId);
                } catch (e) {
                  console.error('Error recovering player:', e);
                }
              }
            }, 3000);
          }
          
          // Initialize player when document is ready
          document.addEventListener('DOMContentLoaded', () => {
            setupVisualizer();
            
            if (isHost) {
              activateVisualizer(true);
              document.getElementById('play-pause').textContent = '❚❚';
            }
            
            // Add a tiny delay before loading API (helps with mobile initialization)
            setTimeout(() => loadYouTubeAPI(), 100);
            
            // Handle progress bar clicks
            document.getElementById('progress-container').addEventListener('click', (e) => {
              if (player && typeof player.getDuration === 'function' && typeof player.seekTo === 'function') {
                const progressBar = e.currentTarget;
                const rect = progressBar.getBoundingClientRect();
                const clickPosition = (e.clientX - rect.left) / rect.width;
                const seekTime = clickPosition * player.getDuration();
                player.seekTo(seekTime);
                currentTime = seekTime;
                updateProgress();
              }
            });
            
            // Start heartbeat to keep connection alive
            heartbeatInterval = setInterval(() => {
              window.ReactNativeWebView.postMessage('HEARTBEAT');
            }, 5000);
            
            // Let React Native know we're initialized
            window.ReactNativeWebView.postMessage('INITIALIZED');
          });
        </script>
      </body>
    </html>
  `;

  // Handle messages from WebView
  const handleWebViewMessage = (event) => {
    const message = event.nativeEvent.data;
    
    if (message === 'PLAYER_READY') {
      setLoading(false);
      setPlayerReady(true);
      setPlayerState('playing');
    } 
    else if (message === 'SONG_ENDED') {
      onSongEnd && onSongEnd();
    } 
    else if (message.startsWith('TITLE:')) {
      console.log('Song title:', message.substring(6));
    }
    else if (message.startsWith('PLAYER_ERROR:')) {
      console.log('Player error:', message);
      if (!playerReady) {
        setError(true);
        setPlayerState('error');
      }
    }
    // All other messages are just logged for debugging
    else if (!message.startsWith('HEARTBEAT')) {
      console.log('Player message:', message);
    }
  };

  // Retry mechanism for errors
  useEffect(() => {
    if (error) {
      const retryTimer = setTimeout(() => {
        console.log('Attempting to reload player...');
        setError(false);
        setLoading(true);
        setRetry(prev => prev + 1);
      }, 5000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [error]);

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading audio...</Text>
        </View>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <AntDesign name="warning" size={24} color="#FFCC00" />
          <Text style={styles.errorText}>Failed to load audio</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setError(false);
              setLoading(true);
              setPlayerReady(false);
              setRetry(prev => prev + 1);
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <WebView
        key={`player-${retry}`}
        style={styles.webView}
        originWhitelist={['*']}
        source={{ html: enhancedAudioHTML }}
        onMessage={handleWebViewMessage}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        androidLayerType="hardware"
        bounces={false}
        scrollEnabled={false}
        allowsFullscreenVideo={false}
        cacheEnabled={true}
        automaticallyAdjustContentInsets={false}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        startInLoadingState={true}
        onLoadEnd={() => {
          // Backup in case player ready message is never received
          setTimeout(() => {
            if (loading) setLoading(false);
          }, 8000);
        }}
      />
      
      {playerReady && (
        <View style={styles.audioIndicator}>
          <AntDesign name="sound" size={16} color="#3498db" />
          <Text style={styles.audioText}>{isHost ? "Playing audio" : "Audio ready"}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 110, // Reduced height for audio-only player
    width: '100%',
    backgroundColor: '#2C3E50',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  webView: {
    flex: 1,
    opacity: 0.99, // Fix for Android WebView rendering issues
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2C3E50',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  errorText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  audioIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioText: {
    color: 'white',
    fontSize: 10,
    marginLeft: 4,
  }
});

export default YouTubePlayer;
