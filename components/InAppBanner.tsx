import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { IdleEvent } from '../store';

interface Props {
  event: IdleEvent | null;
  onDismiss: () => void;
}

export function InAppBanner({ event, onDismiss }: Props) {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (!event) return;

    Animated.sequence([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.delay(4000),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  }, [event]);

  if (!event) return null;

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}>
      <TouchableOpacity style={styles.content} onPress={onDismiss} activeOpacity={0.9}>
        <Text style={styles.title}>{event.tool_name} is waiting</Text>
        {event.notification_body ? (
          <Text style={styles.body} numberOfLines={1}>{event.notification_body}</Text>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: '#1C1C1E',
    margin: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: { padding: 14 },
  title: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 2 },
  body: { fontSize: 13, color: '#aaa' },
});
