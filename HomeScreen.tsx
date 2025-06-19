import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Platform,
  Vibration,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

// Types for better TypeScript support
interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  animationType: number;
  animationDuration: number;
  animationDelay: number;
  twinkleSpeed: number;
  twinkleIntensity: number;
  colorVariation: boolean;
  colorHue: number;
  draggable: boolean;
}

interface Planet {
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  rings: boolean;
  ringsColor: string;
  rotation: number;
}

interface ZodiacSymbol {
  symbol: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  rotation: number;
}

interface AnswerOption {
  text: string;
  color: string;
  shadowColor: string;
}

interface QuestionHistoryItem {
  question: string;
  answer: string;
  color: string;
  timestamp: string;
}

// Constants - reduced star count for better performance
const PIXEL_SIZE = 2;
const NUM_STARS = 100; // Reduced from 140 for better performance
const NUM_PLANETS = 4;
const NUM_PARTICLES = 20; // For explosion effect

// Enhanced answer options
const ANSWER_OPTIONS: AnswerOption[] = [
  { text: 'YES', color: '#50FA7B', shadowColor: 'rgba(80, 250, 123, 0.8)' },
  { text: 'NO', color: '#FF5555', shadowColor: 'rgba(255, 85, 85, 0.8)' },
  { text: 'PERHAPS', color: '#8BE9FD', shadowColor: 'rgba(139, 233, 253, 0.8)' },
  { text: 'UNLIKELY', color: '#FFB86C', shadowColor: 'rgba(255, 184, 108, 0.8)' },
  { text: 'CERTAINLY', color: '#BD93F9', shadowColor: 'rgba(189, 147, 249, 0.8)' },
  { text: 'ASK AGAIN', color: '#F1FA8C', shadowColor: 'rgba(241, 250, 140, 0.8)' },
];

// Get weighted random answer with specific distribution
const getWeightedRandomAnswer = () => {
  const random = Math.random() * 100;
  
  if (random < 30) {
    return ANSWER_OPTIONS[0]; // YES - 30%
  } else if (random < 60) {
    return ANSWER_OPTIONS[1]; // NO - 30%
  } else if (random < 70) {
    return ANSWER_OPTIONS[2]; // PERHAPS - 10%
  } else if (random < 85) {
    return ANSWER_OPTIONS[3]; // UNLIKELY - 15%
  } else if (random < 95) {
    return ANSWER_OPTIONS[4]; // CERTAINLY - 10%
  } else {
    return ANSWER_OPTIONS[5]; // ASK AGAIN - 5%
  }
};

// Custom hook for star generation and animation
const useStarField = (width: number, height: number) => {
  // Generate random stars
  const generateStars = useCallback(() => {
    return Array.from({ length: NUM_STARS }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.7 + 0.3,
      animationType: Math.floor(Math.random() * 3), // 0: twinkle, 1: pulse, 2: drift
      animationDuration: Math.random() * 3000 + 2000,
      animationDelay: Math.random() * 2000,
      // Enhanced twinkling properties
      twinkleSpeed: Math.random() * 1500 + 1000, 
      twinkleIntensity: Math.random() * 0.5 + 0.3,
      colorVariation: Math.random() > 0.8,
      colorHue: Math.floor(Math.random() * 60),
      // Make some stars draggable
      draggable: Math.random() > 0.7,
    }));
  }, [width, height]);

  const [stars, setStars] = useState<Star[]>(() => generateStars());
  
  // Regenerate stars when dimensions change
  useEffect(() => {
    setStars(generateStars());
  }, [width, height, generateStars]);
  
  return { stars, setStars };
};

// Custom hook for planet generation
const usePlanets = (width: number, height: number) => {
  // Generate planets for background
  const generatePlanets = useCallback(() => {
    return Array.from({ length: NUM_PLANETS }, () => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.7, // Keep planets in upper 70% of screen
      size: Math.random() * 20 + 15, // Larger than stars
      color: [
        '#A976F0', // Purple
        '#76A5F0', // Blue
        '#F0A976', // Orange
        '#76F0A9', // Green
        '#F076A9', // Pink
      ][Math.floor(Math.random() * 5)],
      opacity: Math.random() * 0.3 + 0.1, // Very subtle opacity
      rings: Math.random() > 0.5, // 50% chance to have rings
      ringsColor: `rgba(255, 255, 255, ${Math.random() * 0.2 + 0.1})`,
      rotation: Math.random() * 360, // Random rotation for rings
    }));
  }, [width, height]);

  return useMemo(() => generatePlanets(), [generatePlanets]);
};

// Custom hook for zodiac symbol generation
const useZodiacSymbols = (width: number, height: number) => {
  // Generate zodiac symbols
  const generateZodiacSymbols = useCallback(() => {
    const symbols = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
    return Array.from({ length: 12 }, (_, i) => ({
      symbol: symbols[i],
      x: Math.random() * width * 0.8 + width * 0.1,
      y: Math.random() * height * 0.8 + height * 0.1,
      size: Math.random() * 10 + 15,
      opacity: Math.random() * 0.2 + 0.1,
      rotation: Math.random() * 360,
    }));
  }, [width, height]);

  return useMemo(() => generateZodiacSymbols(), [generateZodiacSymbols]);
};

// Custom hook for question history
const useQuestionHistory = () => {
  const [questionHistory, setQuestionHistory] = useState<QuestionHistoryItem[]>([]);
  
  const addToHistory = useCallback((question: string, answer: string, color: string) => {
    setQuestionHistory(prev => [
      { 
        question, 
        answer, 
        color,
        timestamp: new Date().toLocaleTimeString()
      },
      ...prev
    ].slice(0, 10)); // Keep only last 10 items
  }, []);
  
  return { questionHistory, addToHistory };
};

export default function HomeScreen() {
  // Use window dimensions hook for responsive layout
  const { width, height } = useWindowDimensions();
  
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [answerColor, setAnswerColor] = useState('#FFFFFF');
  const [answerShadowColor, setAnswerShadowColor] = useState('rgba(255, 255, 255, 0.8)');
  const [isAnimating, setIsAnimating] = useState(false);
  const [landingPosition, setLandingPosition] = useState({ x: width / 2, y: height / 2 });
  const [showHistory, setShowHistory] = useState(false);
  const [backgroundGlow, setBackgroundGlow] = useState('rgba(0, 0, 0, 0)');
  
  // Use custom hooks
  const { stars, setStars } = useStarField(width, height);
  const planets = usePlanets(width, height);
  const zodiacSymbols = useZodiacSymbols(width, height);
  const { questionHistory, addToHistory } = useQuestionHistory();
  
  // Store a consistent random star index for animations
  const randomStarIndexRef = useRef(Math.floor(Math.random() * stars.length));
  
  // Animation references
  const starAnimations = useRef(stars.map(() => new Animated.Value(0))).current;
  const fallingStarAnimation = useRef(new Animated.Value(0)).current;
  const answerOpacity = useRef(new Animated.Value(0)).current;
  const answerScale = useRef(new Animated.Value(0)).current;
  const backgroundGlowAnim = useRef(new Animated.Value(0)).current;
  const particleAnimations = useRef(Array.from({ length: NUM_PARTICLES }, () => new Animated.Value(0))).current;
  const zodiacAnimations = useRef(Array.from({ length: 12 }, () => new Animated.Value(0))).current;
  
  // Platform-safe animation config
  const useNativeDriverValue = Platform.OS !== 'web';
  
  // Animate background stars with enhanced twinkling
  useEffect(() => {
    // Create animation array to track all animations
    const animations: Animated.CompositeAnimation[] = [];
    
    stars.forEach((star, index) => {
      // Create different animation patterns for different stars
      let animation;
      
      switch (star.animationType) {
        case 0: // Enhanced twinkling
          animation = Animated.loop(
            Animated.sequence([
              Animated.timing(starAnimations[index], {
                toValue: 1,
                duration: star.twinkleSpeed,
                delay: star.animationDelay,
                useNativeDriver: useNativeDriverValue,
                easing: Easing.inOut(Easing.sine),
              }),
              Animated.timing(starAnimations[index], {
                toValue: 0,
                duration: star.twinkleSpeed * 0.8,
                useNativeDriver: useNativeDriverValue,
                easing: Easing.inOut(Easing.cubic),
              }),
            ])
          );
          break;
        case 1: // Pulse
          animation = Animated.loop(
            Animated.sequence([
              Animated.timing(starAnimations[index], {
                toValue: 1,
                duration: star.animationDuration,
                delay: star.animationDelay,
                useNativeDriver: useNativeDriverValue,
                easing: Easing.inOut(Easing.quad),
              }),
              Animated.timing(starAnimations[index], {
                toValue: 0,
                duration: star.animationDuration * 0.7,
                useNativeDriver: useNativeDriverValue,
                easing: Easing.inOut(Easing.quad),
              }),
            ])
          );
          break;
        case 2: // Drift
        default:
          animation = Animated.loop(
            Animated.sequence([
              Animated.timing(starAnimations[index], {
                toValue: 1,
                duration: star.animationDuration,
                delay: star.animationDelay,
                useNativeDriver: useNativeDriverValue,
                easing: Easing.inOut(Easing.sine),
              }),
              Animated.timing(starAnimations[index], {
                toValue: 0,
                duration: star.animationDuration,
                useNativeDriver: useNativeDriverValue,
                easing: Easing.inOut(Easing.sine),
              }),
            ])
          );
          break;
      }
      
      animation.start();
      animations.push(animation);
    });

    // Animate zodiac symbols with staggered timing
    zodiacSymbols.forEach((_, index) => {
      const zodiacAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(zodiacAnimations[index], {
            toValue: 1,
            duration: 3000 + Math.random() * 2000,
            delay: Math.random() * 1000,
            useNativeDriver: useNativeDriverValue,
            easing: Easing.inOut(Easing.sine),
          }),
          Animated.timing(zodiacAnimations[index], {
            toValue: 0,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: useNativeDriverValue,
            easing: Easing.inOut(Easing.sine),
          }),
        ])
      );
      
      zodiacAnimation.start();
      animations.push(zodiacAnimation);
    });
    
    // Cleanup function to stop animations when component unmounts
    return () => {
      animations.forEach(animation => {
        animation.stop();
      });
    };
  }, [stars, zodiacSymbols, useNativeDriverValue]);

  // Get a valid star position for animation - memoized for performance
  const getValidStarPosition = useCallback(() => {
    // Find stars that are visible on screen
    let validStars = stars.filter(star => 
      star.x > width * 0.1 && star.x < width * 0.9 && // Within 10%-90% of screen width
      star.y > height * 0.1 && star.y < height * 0.7   // Within 10%-70% of screen height
    );
    
    // If no valid stars found, use a fallback
    if (validStars.length === 0) {
      validStars = stars;
    }
    
    // Select a random star from valid ones
    const randomIndex = Math.floor(Math.random() * validStars.length);
    randomStarIndexRef.current = stars.findIndex(star => 
      star.x === validStars[randomIndex].x && 
      star.y === validStars[randomIndex].y
    );
    
    if (randomStarIndexRef.current === -1) {
      // Fallback if no match found
      randomStarIndexRef.current = Math.floor(Math.random() * stars.length);
    }
    
    return {
      x: stars[randomStarIndexRef.current].x,
      y: stars[randomStarIndexRef.current].y
    };
  }, [stars, width, height]);
  
  // Generate a valid landing position within screen boundaries
  const generateLandingPosition = useCallback(() => {
    // Generate random position within safe screen boundaries
    return {
      x: width * (0.3 + Math.random() * 0.4), // Between 30% and 70% of screen width
      y: height * (0.3 + Math.random() * 0.4), // Between 30% and 70% of screen height
    };
  }, [width, height]);

  // Create particle explosion effect
  const createExplosionEffect = useCallback((position) => {
    // Reset all particle animations
    particleAnimations.forEach(anim => anim.setValue(0));
    
    // Animate each particle
    particleAnimations.forEach((anim, index) => {
      // Random angle for particle movement
      const angle = (Math.PI * 2 * index) / NUM_PARTICLES;
      const distance = 50 + Math.random() * 50; // Random distance
      
      Animated.timing(anim, {
        toValue: 1,
        duration: 800 + Math.random() * 400,
        useNativeDriver: useNativeDriverValue,
        easing: Easing.out(Easing.cubic),
      }).start();
    });
  }, [particleAnimations, useNativeDriverValue]);

  // Handle star dragging - implemented for the draggable stars feature
  const handleStarDrag = useCallback((index, newPosition) => {
    setStars(prevStars => {
      const newStars = [...prevStars];
      newStars[index] = {
        ...newStars[index],
        x: newPosition.x,
        y: newPosition.y,
      };
      return newStars;
    });
  }, [setStars]);

  const handleSubmit = useCallback(() => {
    if (question.trim() === '' || isAnimating) return;
    
    setIsAnimating(true);
    
    // Get a valid star position
    const starPosition = getValidStarPosition();
    
    // Generate a random landing position within screen boundaries
    const newLandingPosition = generateLandingPosition();
    setLandingPosition(newLandingPosition);
    
    // Reset animations
    fallingStarAnimation.setValue(0);
    answerOpacity.setValue(0);
    answerScale.setValue(0);
    backgroundGlowAnim.setValue(0);
    
    // Determine answer - select weighted random from options
    const selectedAnswer = getWeightedRandomAnswer();
    setAnswer(selectedAnswer.text);
    setAnswerColor(selectedAnswer.color);
    setAnswerShadowColor(selectedAnswer.shadowColor);
    
    // Set background glow based on answer
    setBackgroundGlow(selectedAnswer.shadowColor);
    
    // Animate falling star with improved easing
    Animated.timing(fallingStarAnimation, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: useNativeDriverValue,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Improved easing for more natural motion
    }).start(({ finished }) => {
      if (finished) {
        // Trigger haptic feedback if available
        if (Platform.OS !== 'web') {
          Vibration.vibrate(100);
        }
        
        // Create explosion effect
        createExplosionEffect(newLandingPosition);
        
        // Animate background glow
        Animated.timing(backgroundGlowAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false, // Can't use native driver for backgroundColor
        }).start();
        
        // Animate answer appearance
        Animated.parallel([
          Animated.timing(answerOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: useNativeDriverValue,
          }),
          Animated.spring(answerScale, {
            toValue: 1,
            friction: 5,
            tension: 100,
            useNativeDriver: useNativeDriverValue,
          }),
        ]).start();
        
        // Add to history
        addToHistory(question, selectedAnswer.text, selectedAnswer.color);
        
        // Reset animation state after a delay
        setTimeout(() => {
          // Fade out the answer and background glow
          Animated.parallel([
            Animated.timing(answerOpacity, {
              toValue: 0,
              duration: 800,
              delay: 1200, // Show answer for 1.2 seconds before fading
              useNativeDriver: useNativeDriverValue,
            }),
            Animated.timing(answerScale, {
              toValue: 0.5,
              duration: 800,
              delay: 1200,
              useNativeDriver: useNativeDriverValue,
            }),
            Animated.timing(backgroundGlowAnim, {
              toValue: 0,
              duration: 1000,
              delay: 1000,
              useNativeDriver: false,
            }),
          ]).start(() => {
            setIsAnimating(false);
          });
        }, 1500);
      }
    });
  }, [
    question, 
    isAnimating, 
    getValidStarPosition, 
    generateLandingPosition, 
    fallingStarAnimation, 
    answerOpacity, 
    answerScale, 
    backgroundGlowAnim, 
    useNativeDriverValue, 
    createExplosionEffect, 
    addToHistory
  ]);
  
  // Memoized render functions for better performance
  const renderStars = useMemo(() => {
    return stars.map((star, index) => {
      const animatedValue = starAnimations[index];
      
      // Different animation types with enhanced twinkling
      let animatedStyle;
      let starColor = '#FFFFFF'; // Default white
      
      // Add color variation to some stars
      if (star.colorVariation) {
        // Create slight color variations for some stars
        const hue = star.colorHue;
        starColor = `rgb(255, ${255 - hue}, ${255 - Math.floor(hue/2)})`;
      }
      
      switch (star.animationType) {
        case 0: // Enhanced Twinkle
          animatedStyle = {
            opacity: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [star.opacity * star.twinkleIntensity, star.opacity],
            }),
            transform: [
              {
                scale: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.1],
                }),
              },
            ],
          };
          break;
        case 1: // Pulse
          animatedStyle = {
            transform: [
              {
                scale: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.5],
                }),
              },
            ],
            opacity: animatedValue.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [star.opacity * 0.7, star.opacity, star.opacity * 0.7],
            }),
          };
          break;
        case 2: // Drift
          animatedStyle = {
            transform: [
              {
                translateX: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, PIXEL_SIZE * 2 * (Math.random() > 0.5 ? 1 : -1)],
                }),
              },
              {
                translateY: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, PIXEL_SIZE * 2 * (Math.random() > 0.5 ? 1 : -1)],
                }),
              },
            ],
          };
          break;
        default:
          animatedStyle = {};
      }
      
      return (
        <Animated.View
          key={`star-${index}`}
          style={[
            styles.star,
            {
              left: star.x,
              top: star.y,
              width: star.size * PIXEL_SIZE,
              height: star.size * PIXEL_SIZE,
              opacity: star.opacity,
              backgroundColor: starColor,
            },
            animatedStyle,
          ]}
          // Implement draggable stars feature
          {...(star.draggable ? {
            onStartShouldSetResponder: () => true,
            onResponderMove: (evt) => {
              handleStarDrag(index, {
                x: evt.nativeEvent.pageX,
                y: evt.nativeEvent.pageY,
              });
            }
          } : {})}
          accessible={false}
        />
      );
    });
  }, [stars, starAnimations, handleStarDrag]);
  
  // Render planets in the background - memoized
  const renderPlanets = useMemo(() => {
    return planets.map((planet, index) => (
      <View
        key={`planet-${index}`}
        style={[
          styles.planet,
          {
            left: planet.x,
            top: planet.y,
            width: planet.size,
            height: planet.size,
            backgroundColor: planet.color,
            opacity: planet.opacity,
          },
        ]}
        accessible={false}
      >
        {planet.rings && (
          <View
            style={[
              styles.planetRings,
              {
                borderColor: planet.ringsColor,
                transform: [{ rotateX: '70deg' }, { rotate: `${planet.rotation}deg` }],
              },
            ]}
          />
        )}
      </View>
    ));
  }, [planets]);

  // Render zodiac symbols - memoized
  const renderZodiacSymbols = useMemo(() => {
    return zodiacSymbols.map((zodiac, index) => {
      const animatedValue = zodiacAnimations[index];
      
      return (
        <Animated.Text
          key={`zodiac-${index}`}
          style={[
            styles.zodiacSymbol,
            {
              left: zodiac.x,
              top: zodiac.y,
              fontSize: zodiac.size,
              opacity: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [zodiac.opacity * 0.5, zodiac.opacity],
              }),
              transform: [
                { rotate: `${zodiac.rotation}deg` },
                {
                  scale: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1.1],
                  }),
                },
              ],
            },
          ]}
          accessible={false}
        >
          {zodiac.symbol}
        </Animated.Text>
      );
    });
  }, [zodiacSymbols, zodiacAnimations]);
  
  // Falling star animation
  const fallingStarStyle = {
    position: 'absolute',
    width: 6 * PIXEL_SIZE,
    height: 6 * PIXEL_SIZE,
    backgroundColor: '#FFD700',
    borderRadius: 3 * PIXEL_SIZE, // Make it more circular
    transform: [
      {
        translateX: fallingStarAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [stars[randomStarIndexRef.current]?.x || width/2, landingPosition.x],
        }),
      },
      {
        translateY: fallingStarAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [stars[randomStarIndexRef.current]?.y || height/4, landingPosition.y],
        }),
      },
      {
        rotate: fallingStarAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '720deg'],
        }),
      },
      {
        scale: fallingStarAnimation.interpolate({
          inputRange: [0, 0.8, 1],
          outputRange: [1, 1.5, 0],
        }),
      },
    ],
  };
  
  // Trailing effect for falling star
  const renderTrail = useCallback(() => {
    const segments = 8;
    const starPos = {
      x: stars[randomStarIndexRef.current]?.x || width/2,
      y: stars[randomStarIndexRef.current]?.y || height/4
    };
    
    return Array.from({ length: segments }).map((_, i) => {
      const segmentDelay = i / segments;
      return (
        <Animated.View
          key={`trail-${i}`}
          style={{
            position: 'absolute',
            width: (4 - i * 0.4) * PIXEL_SIZE,
            height: (4 - i * 0.4) * PIXEL_SIZE,
            borderRadius: (2 - i * 0.2) * PIXEL_SIZE, // Make it more circular
            backgroundColor: `rgba(255, 215, 0, ${0.8 - i * 0.1})`,
            transform: [
              {
                translateX: fallingStarAnimation.interpolate({
                  inputRange: [0, segmentDelay, 1],
                  outputRange: [
                    starPos.x,
                    starPos.x,
                    landingPosition.x,
                  ],
                  extrapolate: 'clamp',
                }),
              },
              {
                translateY: fallingStarAnimation.interpolate({
                  inputRange: [0, segmentDelay, 1],
                  outputRange: [
                    starPos.y,
                    starPos.y,
                    landingPosition.y,
                  ],
                  extrapolate: 'clamp',
                }),
              },
              {
                scale: fallingStarAnimation.interpolate({
                  inputRange: [0, 0.9, 1],
                  outputRange: [1, 1, 0],
                }),
              },
            ],
            opacity: fallingStarAnimation.interpolate({
              inputRange: [0, segmentDelay, segmentDelay + 0.1, 1],
              outputRange: [0, 0, 0.7 - i * 0.08, 0],
              extrapolate: 'clamp',
            }),
          }}
          accessible={false}
        />
      );
    });
  }, [stars, fallingStarAnimation, landingPosition, width, height]);

  // Render explosion particles
  const renderExplosionParticles = useCallback(() => {
    return particleAnimations.map((anim, index) => {
      // Calculate angle for this particle
      const angle = (Math.PI * 2 * index) / NUM_PARTICLES;
      const distance = 50 + Math.random() * 50;
      
      return (
        <Animated.View
          key={`particle-${index}`}
          style={{
            position: 'absolute',
            width: 3 * PIXEL_SIZE,
            height: 3 * PIXEL_SIZE,
            borderRadius: 1.5 * PIXEL_SIZE,
            backgroundColor: answerColor || '#FFD700',
            opacity: anim.interpolate({
              inputRange: [0, 0.3, 1],
              outputRange: [0, 0.8, 0],
            }),
            transform: [
              {
                translateX: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [landingPosition.x, landingPosition.x + Math.cos(angle) * distance],
                }),
              },
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [landingPosition.y, landingPosition.y + Math.sin(angle) * distance],
                }),
              },
              {
                scale: anim.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [0.5, 1.5, 0.2],
                }),
              },
            ],
          }}
          accessible={false}
        />
      );
    });
  }, [particleAnimations, landingPosition, answerColor]);
  
  // Answer text animation
  const answerStyle = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [
      { translateX: -50 },
      { translateY: -50 },
      { scale: answerScale },
    ],
    opacity: answerOpacity,
    justifyContent: 'center',
    alignItems: 'center',
  };

  // History panel - extracted as a separate component
  const HistoryPanel = useCallback(() => {
    if (!showHistory) return null;
    
    return (
      <View style={styles.historyPanel}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Cosmic History</Text>
          <TouchableOpacity 
            onPress={() => setShowHistory(false)}
            accessibilityLabel="Close history"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={questionHistory}
          keyExtractor={(item, index) => `history-${index}`}
          renderItem={({ item }) => (
            <View style={styles.historyItem}>
              <Text style={styles.historyQuestion}>{item.question}</Text>
              <Text style={[styles.historyAnswer, { color: item.color }]}>{item.answer}</Text>
              <Text style={styles.historyTime}>{item.timestamp}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.historyEmptyText}>No questions asked yet...</Text>
          }
          style={styles.historyList}
          initialNumToRender={5}
          maxToRenderPerBatch={3}
          windowSize={5}
        />
      </View>
    );
  }, [showHistory, questionHistory]);
  
  // Background glow effect
  const backgroundStyle = {
    backgroundColor: backgroundGlowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['#0A0E17', backgroundGlow.replace('0.8)', '0.15)')],
    }),
  };
  
  // Reset animations when component loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Reset animations when screen loses focus
        fallingStarAnimation.setValue(0);
        answerOpacity.setValue(0);
        answerScale.setValue(0);
        backgroundGlowAnim.setValue(0);
        particleAnimations.forEach(anim => anim.setValue(0));
      };
    }, [fallingStarAnimation, answerOpacity, answerScale, backgroundGlowAnim, particleAnimations])
  );
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Dynamic background */}
      <Animated.View style={[styles.backgroundGlow, backgroundStyle]} />
      
      {/* Background stars */}
      {renderStars}
      
      {/* Background planets */}
      {renderPlanets}
      
      {/* Zodiac symbols */}
      {renderZodiacSymbols}
      
      {/* App title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title} accessibilityRole="header">⊕ NYX DICE ⊕</Text>
      </View>
      
      {/* History button */}
      <TouchableOpacity 
        style={styles.historyButton}
        onPress={() => setShowHistory(true)}
        accessibilityLabel="View question history"
        accessibilityRole="button"
      >
        <Ionicons name="time-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      {/* Spacer to push content down */}
      <View style={styles.spacer} />
      
      {/* Question input - moved down above button */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Let the stars decide... ask your question.</Text>
        <TextInput
          style={styles.input}
          value={question}
          onChangeText={setQuestion}
          placeholder="What mysteries await me?"
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          multiline
          maxLength={100}
          accessibilityLabel="Enter your question"
          accessibilityHint="Type a question for the cosmic oracle"
        />
      </View>
      
      {/* Submit button */}
      <TouchableOpacity
        style={[styles.button, isAnimating && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isAnimating}
        accessibilityLabel="Ask Nyx"
        accessibilityHint="Submit your question to the cosmic oracle"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Ask Nyx</Text>
      </TouchableOpacity>
      
      {/* Falling star animation */}
      {isAnimating && (
        <>
          {renderTrail()}
          <Animated.View style={fallingStarStyle} accessible={false} />
          {renderExplosionParticles()}
        </>
      )}
      
      {/* Answer text */}
      {isAnimating && (
        <Animated.View style={answerStyle} accessible={true} accessibilityLabel={`The answer is ${answer}`}>
          <Text 
            style={[
              styles.answerText, 
              { 
                color: answerColor,
                textShadowColor: answerShadowColor,
              }
            ]}
          >
            {answer}
          </Text>
        </Animated.View>
      )}
      
      {/* History panel */}
      <HistoryPanel />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17', // Deep space color
    alignItems: 'center',
    padding: 20,
  },
  backgroundGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  titleContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E0E0FF',
    letterSpacing: 8,
    textShadowColor: 'rgba(130, 87, 229, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(176, 156, 255, 0.8)',
    fontStyle: 'italic',
    letterSpacing: 1.5,
  },
  spacer: {
    flex: 1, // This pushes the input field down
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: PIXEL_SIZE / 2, // Make stars more circular
  },
  planet: {
    position: 'absolute',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planetRings: {
    position: 'absolute',
    width: '140%',
    height: '40%',
    borderRadius: 50,
    borderWidth: 2,
  },
  zodiacSymbol: {
    position: 'absolute',
    color: 'rgba(255, 255, 255, 0.2)',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    color: '#B0C4DE',
    marginBottom: 10,
    fontSize: 16,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(130, 87, 229, 0.5)',
    borderRadius: 8,
    color: '#FFFFFF',
    padding: 15,
    width: '100%',
    minHeight: 70, // Further reduced from 80
    maxHeight: 70, // Further reduced from 80
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  button: {
    backgroundColor: 'rgba(130, 87, 229, 0.8)',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 30,
    width: '70%',
    alignSelf: 'center',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(130, 87, 229, 0.4)',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  answerText: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Heavy' : 'monospace',
  },
  historyButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(130, 87, 229, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  historyPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 14, 23, 0.95)',
    zIndex: 100,
    padding: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 40,
  },
  historyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E0E0FF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  historyQuestion: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  historyAnswer: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  historyTime: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  historyEmptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontStyle: 'italic',
  },
});