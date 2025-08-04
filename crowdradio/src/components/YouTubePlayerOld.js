// filepath: /home/baymax/Documents/projects/music-player/crowdradio/src/components/YouTubePlayer.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { AntDesign } from '@expo/vector-icons';

/**
 * A simplified YouTube audio player component focused solely on audio playback
 * This implementation uses a direct HTML5-friendly approach to improve compatibility
 */
const YouTubePlayer = ({ videoUrl, isHost, onSongEnd, onNext, onPrevious }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerState, setPlayerState] = useState('loading');
  const [retry, setRetry] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [buffering, setBuffering] = useState(false);
  const [currentTitle, setCurrentTitle] = useState('');

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
    // For non-hosts, render nothing (or a minimal placeholder if you want)
    return null;
  }

  if (!videoId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Invalid YouTube URL</Text>
      </View>
    );
  }

  // Simplified and more reliable HTML for YouTube playback
  const enhancedAudioHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          body {
            margin: 0;
            padding: 8px;
            background-color: #2C3E50;
            color: white;
            font-family: system-ui, -apple-system, sans-serif;
            height: 100vh;
            overflow: hidden;
          }
          
          .player-container {
            position: relative;
            width: 100%;
            height: 200px;
            background: #1a252f;
            border-radius: 8px;
            overflow: hidden;
          }
          
          .youtube-embed {
            width: 100%;
            height: 100%;
            border: none;
          }
          
          .fallback-container {
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            text-align: center;
            padding: 20px;
          }
          
          .controls {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin: 15px 0;
          }
          
          .control-btn {
            background: #3498db;
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
          }
          
          .control-btn:hover {
            background: #2980b9;
          }
          
          .error-message {
            color: #e74c3c;
            margin: 10px 0;
          }
          
          .info-text {
            color: #95a5a6;
            font-size: 12px;
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="player-container">
          <!-- Try YouTube embed first -->
          <iframe 
            id="youtube-iframe"
            class="youtube-embed"
            src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1&rel=0&showinfo=0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            onload="handleIframeLoad()"
            onerror="handleIframeError()">
          </iframe>
          
          <!-- Fallback content -->
          <div id="fallback" class="fallback-container">
            <h3>🎵 YouTube Player</h3>
            <p class="error-message" id="error-msg">Loading video...</p>
            <div class="controls">
              <button class="control-btn" onclick="openInYouTube()">Open in YouTube</button>
              <button class="control-btn" onclick="retryEmbed()">Retry</button>
              <button class="control-btn" onclick="skipSong()">Skip Song</button>
            </div>
            <p class="info-text">Video ID: ${videoId}</p>
          </div>
        </div>
        
        <script>
          let embedWorking = true;
          let retryCount = 0;
          
          // Handle iframe load
          function handleIframeLoad() {
            console.log('YouTube iframe loaded');
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage('PLAYER_READY');
          }
          
          // Handle iframe error
          function handleIframeError() {
            console.log('YouTube iframe failed to load');
            showFallback('Failed to load YouTube player');
          }
          
          // Show fallback interface
          function showFallback(errorMsg) {
            document.getElementById('youtube-iframe').style.display = 'none';
            document.getElementById('fallback').style.display = 'flex';
            document.getElementById('error-msg').textContent = errorMsg || 'Video cannot be embedded';
            
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage('EMBEDDING_RESTRICTED');
          }
          
          // Retry embedding
          function retryEmbed() {
            if (retryCount < 3) {
              retryCount++;
              document.getElementById('error-msg').textContent = 'Retrying... (' + retryCount + '/3)';
              
              const iframe = document.getElementById('youtube-iframe');
              const newSrc = iframe.src + '&retry=' + retryCount;
              iframe.src = newSrc;
              iframe.style.display = 'block';
              document.getElementById('fallback').style.display = 'none';
              
              // Show fallback again after 5 seconds if still not working
              setTimeout(() => {
                if (!embedWorking) {
                  showFallback('Embed retry failed');
                }
              }, 5000);
            } else {
              document.getElementById('error-msg').textContent = 'Maximum retries reached';
            }
          }
          
          // Open in YouTube app
          function openInYouTube() {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage('OPEN_IN_YOUTUBE:${videoId}');
          }
          
          // Skip this song
          function skipSong() {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage('SKIP_RESTRICTED_SONG');
          }
          
          // Monitor for embedding issues
          setTimeout(() => {
            try {
              const iframe = document.getElementById('youtube-iframe');
              if (!iframe.contentDocument && !iframe.contentWindow) {
                embedWorking = false;
                showFallback('Video owner does not allow embedding');
              }
            } catch (e) {
              embedWorking = false;
              showFallback('Cross-origin access denied');
            }
          }, 3000);
          
          // Notify React Native when ready
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage('INITIALIZED');
        </script>
      </body>
    </html>
  `;
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
          
          .volume-control {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 8px 0;
          }
          
          .volume-slider {
            flex: 1;
            height: 4px;
            border-radius: 2px;
            background: rgba(255, 255, 255, 0.2);
            -webkit-appearance: none;
            cursor: pointer;
          }
          
          .volume-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #3498db;
            cursor: pointer;
          }
          
          .volume-icon {
            width: 24px;
            text-align: center;
            cursor: pointer;
          }
          
          .skip-controls {
            display: flex;
            justify-content: center;
            gap: 16px;
            margin-top: 8px;
          }
          
          .skip-button {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            padding: 4px;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .skip-button:hover {
            color: white;
          }
          
          .loading-spinner {
            display: inline-block;
            width: 12px;
            height: 12px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
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
            <button class="control-button" id="prev" onclick="previousSong()" title="Previous song">⏮</button>
            <button class="control-button play-button" id="play-pause" onclick="togglePlayback()">▶</button>
            <button class="control-button" id="next" onclick="nextSong()" title="Next song">⏭</button>
          </div>
          
          <div class="volume-control">
            <span class="volume-icon" id="volume" onclick="toggleMute()">🔊</span>
            <input type="range" class="volume-slider" id="volume-slider" min="0" max="100" value="100" />
          </div>
          
          <div class="skip-controls">
            <button class="skip-button" onclick="skipBackward()">-10s ⏪</button>
            <button class="skip-button" onclick="skipForward()">⏩ +10s</button>
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
          
          // Initialize volume slider
          const volumeSlider = document.getElementById('volume-slider');
          volumeSlider.addEventListener('input', (e) => {
            const volume = parseInt(e.target.value);
            if (player && typeof player.setVolume === 'function') {
              player.setVolume(volume);
              
              // Update mute state and icon based on volume
              isMuted = volume === 0;
              document.getElementById('volume').textContent = 
                volume === 0 ? '🔇' : 
                volume < 50 ? '🔉' : '🔊';
            }
          });

          // Skip forward/backward functions
          function skipForward() {
            if (player && typeof player.getCurrentTime === 'function') {
              const newTime = Math.min(currentTime + 10, duration);
              player.seekTo(newTime);
              currentTime = newTime;
              updateProgress();
            }
          }

          function skipBackward() {
            if (player && typeof player.getCurrentTime === 'function') {
              const newTime = Math.max(currentTime - 10, 0);
              player.seekTo(newTime);
              currentTime = newTime;
              updateProgress();
            }
          }

          // Previous/Next song functions
          function previousSong() {
            window.ReactNativeWebView.postMessage('PREVIOUS_SONG');
          }

          function nextSong() {
            window.ReactNativeWebView.postMessage('NEXT_SONG');
          }

          // Enhanced toggle mute function
          function toggleMute() {
            if (player && typeof player.isMuted === 'function') {
              isMuted = !isMuted;
              if (isMuted) {
                player.mute();
                volumeSlider.value = 0;
              } else {
                player.unMute();
                const lastVolume = parseInt(volumeSlider.getAttribute('data-last-volume') || '100');
                volumeSlider.value = lastVolume;
                player.setVolume(lastVolume);
              }
              
              document.getElementById('volume').textContent = isMuted ? '🔇' : '🔊';
              updateStatus(isMuted ? 'Muted' : isPlaying ? 'Playing' : 'Paused');
            }
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

          // Define onPlayerError to handle YouTube player errors
          function onPlayerError(event) {
            let errorMsg = 'Unknown error';
            let shouldTryFallback = false;
            
            switch (event.data) {
              case 2:
                errorMsg = 'Invalid parameter in request.';
                break;
              case 5:
                errorMsg = 'HTML5 player error.';
                shouldTryFallback = true;
                break;
              case 100:
                errorMsg = 'Video not found or removed.';
                window.ReactNativeWebView.postMessage('SONG_NOT_AVAILABLE');
                break;
              case 101:
              case 150:
                errorMsg = 'Video owner does not allow playback in embedded players.';
                shouldTryFallback = true;
                window.ReactNativeWebView.postMessage('EMBEDDING_RESTRICTED');
                break;
            }
            
            updateStatus('Player error: ' + errorMsg);
            window.ReactNativeWebView.postMessage('PLAYER_ERROR:' + errorMsg);
            
            // Try fallback approach for embedding restrictions
            if (shouldTryFallback) {
              setTimeout(() => {
                tryFallbackPlayer();
              }, 1000);
            }
          }
          
          // Fallback player for restricted videos
          function tryFallbackPlayer() {
            updateStatus('Trying alternative playback method...');
            
            // Create a more basic iframe approach
            const fallbackContainer = document.createElement('div');
            fallbackContainer.innerHTML = \`
              <div style="text-align: center; padding: 20px;">
                <p style="color: #e74c3c; margin-bottom: 15px;">🚫 This video cannot be embedded</p>
                <p style="color: #95a5a6; font-size: 14px; margin-bottom: 15px;">
                  The video owner has restricted playback in external apps.
                </p>
                <button onclick="openInYouTube()" style="
                  background: #ff4444; 
                  color: white; 
                  border: none; 
                  padding: 12px 24px; 
                  border-radius: 6px; 
                  cursor: pointer; 
                  font-size: 16px;
                  margin-right: 10px;
                ">
                  Open in YouTube
                </button>
                <button onclick="skipSong()" style="
                  background: #666; 
                  color: white; 
                  border: none; 
                  padding: 12px 24px; 
                  border-radius: 6px; 
                  cursor: pointer; 
                  font-size: 16px;
                ">
                  Skip Song
                </button>
              </div>
            \`;
            
            const playerDiv = document.getElementById('youtube-player');
            if (playerDiv) {
              playerDiv.innerHTML = '';
              playerDiv.appendChild(fallbackContainer);
            }
            
            window.ReactNativeWebView.postMessage('FALLBACK_DISPLAYED');
          }
          
          // Helper functions for fallback actions
          function openInYouTube() {
            window.ReactNativeWebView.postMessage('OPEN_IN_YOUTUBE:${videoId}');
          }
          
          function skipSong() {
            window.ReactNativeWebView.postMessage('SKIP_RESTRICTED_SONG');
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
      setError(false);
      setErrorMessage('');
    } 
    else if (message === 'SONG_ENDED') {
      onSongEnd && onSongEnd();
    }
    else if (message === 'NEXT_SONG') {
      onNext && onNext();
    }
    else if (message === 'PREVIOUS_SONG') {
      onPrevious && onPrevious();
    }
    else if (message.startsWith('TITLE:')) {
      const title = message.substring(6);
      setCurrentTitle(title);
      console.log('Song title:', title);
    }
    else if (message.startsWith('PLAYER_ERROR:')) {
      const errorMsg = message.substring(13);
      console.log('Player error:', errorMsg);
      setErrorMessage(errorMsg);
      if (!playerReady) {
        setError(true);
        setPlayerState('error');
      }
    }
    else if (message === 'EMBEDDING_RESTRICTED') {
      console.log('Video embedding restricted - showing fallback options');
      setErrorMessage('Video embedding restricted by owner');
      setPlayerState('restricted');
    }
    else if (message === 'SONG_NOT_AVAILABLE') {
      console.log('Song not available - notifying parent to skip');
      setErrorMessage('Video not found or removed');
      // Automatically skip unavailable songs after a brief delay
      setTimeout(() => {
        onNext && onNext();
      }, 2000);
    }
    else if (message.startsWith('OPEN_IN_YOUTUBE:')) {
      const videoId = message.substring(16);
      console.log('Opening YouTube app for video:', videoId);
      // You could implement deep linking to YouTube app here
      setErrorMessage('Please open YouTube to play this song');
    }
    else if (message === 'SKIP_RESTRICTED_SONG') {
      console.log('User requested to skip restricted song');
      onNext && onNext();
    }
    else if (message === 'FALLBACK_DISPLAYED') {
      setPlayerState('fallback');
    }
    else if (message === 'BUFFERING') {
      setBuffering(true);
    }
    else if (message === 'PLAYING') {
      setBuffering(false);
      setPlayerState('playing');
    }
    else if (message === 'PAUSED') {
      setBuffering(false);
      setPlayerState('paused');
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
          <Text style={styles.errorText}>{errorMessage || 'Failed to load audio'}</Text>
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
      
      {isHost && (
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
          onError={(syntheticEvent) => {
            console.error('WebView error:', syntheticEvent.nativeEvent);
            setError(true);
            setLoading(false);
            setErrorMessage('Failed to load YouTube player');
          }}
          startInLoadingState={true}
          onLoadEnd={() => {
            // Backup in case player ready message is never received
            setTimeout(() => {
              if (loading) {
                setLoading(false);
                if (!playerReady) {
                  setError(true);
                  setErrorMessage('Player failed to initialize');
                }
              }
            }, 8000);
          }}
        />
      )}
      
      {playerReady && (
        <View style={[
          styles.audioIndicator,
          buffering && styles.audioIndicatorBuffering
        ]}>
          {buffering ? (
            <ActivityIndicator size="small" color="#3498db" style={styles.bufferingIndicator} />
          ) : (
            <AntDesign 
              name={playerState === 'playing' ? "sound" : "pause"} 
              size={16} 
              color="#3498db" 
            />
          )}
          <Text style={styles.audioText} numberOfLines={1} ellipsizeMode="tail">
            {buffering ? "Buffering..." : currentTitle || (isHost ? "Playing audio" : "Audio ready")}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 160, // Increased height to accommodate new controls
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
    padding: 16,
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
    maxWidth: '80%',
  },
  audioIndicatorBuffering: {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
  },
  bufferingIndicator: {
    marginRight: 4,
  },
  audioText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  }
});

export default YouTubePlayer;
