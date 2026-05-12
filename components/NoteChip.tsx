import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';

interface NoteChipProps {
  label: string;
  color?: string;
}

export default function NoteChip({ label, color = Colors.primary }: NoteChipProps) {
  return (
    <View style={[styles.chip, { borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: 'rgba(192, 132, 252, 0.08)',
  },
  text: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
});
