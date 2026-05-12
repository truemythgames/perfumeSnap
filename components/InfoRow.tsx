import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes, Spacing } from '../constants/theme';

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
}

export default function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
  },
  icon: {
    fontSize: 20,
    marginRight: Spacing.md,
    width: 28,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  value: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: Spacing.md,
  },
});
