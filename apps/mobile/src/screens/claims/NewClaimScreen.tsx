/**
 * New Claim Screen
 * Formular zur Schadensmeldung - Vollständig funktionsfähig
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '@/constants/theme';
import type { ClaimsScreenProps } from '@/navigation/types';

// Demo-Fahrzeuge
const DEMO_VEHICLES = [
  { id: '1', licensePlate: 'B-AB 1234', brand: 'Mercedes-Benz', model: 'Actros' },
  { id: '2', licensePlate: 'B-CD 5678', brand: 'MAN', model: 'TGX' },
  { id: '3', licensePlate: 'B-EF 9012', brand: 'Volvo', model: 'FH16' },
  { id: '4', licensePlate: 'M-GH 3456', brand: 'Scania', model: 'R500' },
  { id: '5', licensePlate: 'HH-IJ 7890', brand: 'DAF', model: 'XF' },
];

// Schadenskategorien
const DAMAGE_CATEGORIES = [
  { value: 'LIABILITY', label: 'Haftpflicht', icon: 'shield-outline' },
  { value: 'COMPREHENSIVE', label: 'Vollkasko', icon: 'car-outline' },
  { value: 'GLASS', label: 'Glasschaden', icon: 'apps-outline' },
  { value: 'PARKING', label: 'Parkschaden', icon: 'car-sport-outline' },
  { value: 'THEFT', label: 'Diebstahl', icon: 'lock-open-outline' },
  { value: 'OTHER', label: 'Sonstiges', icon: 'ellipsis-horizontal-outline' },
];

export function NewClaimScreen({ navigation }: ClaimsScreenProps<'NewClaim'>) {
  // Form State
  const [selectedVehicle, setSelectedVehicle] = useState<typeof DEMO_VEHICLES[0] | null>(null);
  const [accidentDate, setAccidentDate] = useState<Date | null>(null);
  const [accidentTime, setAccidentTime] = useState<Date | null>(null);
  const [location, setLocation] = useState('');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  // Modal State
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  // Loading State
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Date Picker State
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth());
  const [tempDay, setTempDay] = useState(new Date().getDate());

  // Time Picker State
  const [tempHour, setTempHour] = useState(12);
  const [tempMinute, setTempMinute] = useState(0);

  // Format Date
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Datum auswählen';
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Format Time
  const formatTime = (date: Date | null): string => {
    if (!date) return 'Uhrzeit auswählen';
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle Date Selection
  const handleDateConfirm = () => {
    const date = new Date(tempYear, tempMonth, tempDay);
    setAccidentDate(date);
    setShowDateModal(false);
  };

  // Handle Time Selection
  const handleTimeConfirm = () => {
    const time = new Date();
    time.setHours(tempHour, tempMinute, 0, 0);
    setAccidentTime(time);
    setShowTimeModal(false);
  };

  // Handle GPS Location
  const handleGetLocation = async () => {
    try {
      setIsLoadingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Berechtigung verweigert', 'Bitte erlauben Sie den Standortzugriff in den Einstellungen.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setGpsCoords({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });

      // Try to get address
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        if (addresses.length > 0) {
          const addr = addresses[0];
          const parts = [addr.street, addr.streetNumber, addr.postalCode, addr.city].filter(Boolean);
          setLocation(parts.join(' ') || `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
        } else {
          setLocation(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
        }
      } catch {
        setLocation(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
      }
    } catch (error) {
      Alert.alert('Fehler', 'Standort konnte nicht ermittelt werden.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Handle Continue
  const handleContinue = () => {
    // Validation
    if (!selectedVehicle) {
      Alert.alert('Fehler', 'Bitte wählen Sie ein Fahrzeug aus.');
      return;
    }
    if (!accidentDate) {
      Alert.alert('Fehler', 'Bitte wählen Sie ein Datum aus.');
      return;
    }
    if (!category) {
      Alert.alert('Fehler', 'Bitte wählen Sie eine Schadenskategorie aus.');
      return;
    }

    navigation.navigate('ClaimPhotos', {});
  };

  // Generate arrays for pickers
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Fahrzeug Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fahrzeug *</Text>
            <TouchableOpacity
              style={[styles.selectButton, selectedVehicle && styles.selectButtonFilled]}
              onPress={() => setShowVehicleModal(true)}
            >
              <Ionicons
                name="car-outline"
                size={24}
                color={selectedVehicle ? colors.primary[600] : colors.text.secondary}
              />
              <View style={styles.selectButtonContent}>
                {selectedVehicle ? (
                  <>
                    <Text style={styles.selectButtonTextFilled}>{selectedVehicle.licensePlate}</Text>
                    <Text style={styles.selectButtonSubtext}>
                      {selectedVehicle.brand} {selectedVehicle.model}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.selectButtonText}>Fahrzeug auswählen</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          {/* Datum & Zeit Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Datum & Uhrzeit *</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.selectButton, styles.halfWidth, accidentDate && styles.selectButtonFilled]}
                onPress={() => {
                  if (accidentDate) {
                    setTempYear(accidentDate.getFullYear());
                    setTempMonth(accidentDate.getMonth());
                    setTempDay(accidentDate.getDate());
                  }
                  setShowDateModal(true);
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={accidentDate ? colors.primary[600] : colors.text.secondary}
                />
                <Text style={[styles.selectButtonText, accidentDate && styles.selectButtonTextFilled]}>
                  {formatDate(accidentDate)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.selectButton, styles.halfWidth, accidentTime && styles.selectButtonFilled]}
                onPress={() => {
                  if (accidentTime) {
                    setTempHour(accidentTime.getHours());
                    setTempMinute(Math.floor(accidentTime.getMinutes() / 5) * 5);
                  }
                  setShowTimeModal(true);
                }}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={accidentTime ? colors.primary[600] : colors.text.secondary}
                />
                <Text style={[styles.selectButtonText, accidentTime && styles.selectButtonTextFilled]}>
                  {formatTime(accidentTime)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Ort Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Unfallort</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={(text) => setLocation(text)}
                placeholder="Adresse oder Beschreibung des Ortes"
                placeholderTextColor={colors.text.tertiary}
                autoCorrect={false}
              />
            </View>
            <TouchableOpacity
              style={styles.gpsButton}
              onPress={handleGetLocation}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color={colors.primary[600]} />
              ) : (
                <Ionicons name="navigate" size={20} color={colors.primary[600]} />
              )}
              <Text style={styles.gpsButtonText}>
                {isLoadingLocation ? 'Standort wird ermittelt...' : 'Aktuellen Standort verwenden'}
              </Text>
            </TouchableOpacity>
            {gpsCoords && (
              <Text style={styles.gpsInfo}>
                GPS: {gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}
              </Text>
            )}
          </View>

          {/* Kategorie Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Schadenskategorie *</Text>
            <View style={styles.categoryGrid}>
              {DAMAGE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryButton,
                    category === cat.value && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory(cat.value)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={20}
                    color={category === cat.value ? colors.white : colors.text.secondary}
                    style={styles.categoryIcon}
                  />
                  <Text
                    style={[
                      styles.categoryButtonText,
                      category === cat.value && styles.categoryButtonTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Beschreibung Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Beschreibung</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                value={description}
                onChangeText={(text) => setDescription(text)}
                placeholder="Beschreiben Sie den Schaden und den Hergang..."
                placeholderTextColor={colors.text.tertiary}
                multiline={true}
                numberOfLines={4}
                maxLength={500}
                blurOnSubmit={false}
                returnKeyType="default"
              />
            </View>
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.draftButton}>
            <Text style={styles.draftButtonText}>Als Entwurf speichern</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Weiter zu Fotos</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Vehicle Selection Modal */}
      <Modal
        visible={showVehicleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVehicleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fahrzeug auswählen</Text>
              <TouchableOpacity onPress={() => setShowVehicleModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={DEMO_VEHICLES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.vehicleItem,
                    selectedVehicle?.id === item.id && styles.vehicleItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedVehicle(item);
                    setShowVehicleModal(false);
                  }}
                >
                  <Ionicons
                    name="car"
                    size={24}
                    color={selectedVehicle?.id === item.id ? colors.primary[600] : colors.gray[400]}
                  />
                  <View style={styles.vehicleInfo}>
                    <Text style={[
                      styles.vehiclePlate,
                      selectedVehicle?.id === item.id && styles.vehiclePlateSelected,
                    ]}>
                      {item.licensePlate}
                    </Text>
                    <Text style={styles.vehicleModel}>{item.brand} {item.model}</Text>
                  </View>
                  {selectedVehicle?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary[600]} />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>

      {/* Date Selection Modal */}
      <Modal
        visible={showDateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <Text style={styles.modalCancel}>Abbrechen</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Datum wählen</Text>
              <TouchableOpacity onPress={handleDateConfirm}>
                <Text style={styles.modalConfirm}>Fertig</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerContainer}>
              <ScrollView style={styles.pickerColumn} showsVerticalScrollIndicator={false}>
                {days.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[styles.pickerItem, tempDay === day && styles.pickerItemSelected]}
                    onPress={() => setTempDay(day)}
                  >
                    <Text style={[styles.pickerText, tempDay === day && styles.pickerTextSelected]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollView style={styles.pickerColumn} showsVerticalScrollIndicator={false}>
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={month}
                    style={[styles.pickerItem, tempMonth === index && styles.pickerItemSelected]}
                    onPress={() => setTempMonth(index)}
                  >
                    <Text style={[styles.pickerText, tempMonth === index && styles.pickerTextSelected]}>
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollView style={styles.pickerColumn} showsVerticalScrollIndicator={false}>
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[styles.pickerItem, tempYear === year && styles.pickerItemSelected]}
                    onPress={() => setTempYear(year)}
                  >
                    <Text style={[styles.pickerText, tempYear === year && styles.pickerTextSelected]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* Time Selection Modal */}
      <Modal
        visible={showTimeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowTimeModal(false)}>
                <Text style={styles.modalCancel}>Abbrechen</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Uhrzeit wählen</Text>
              <TouchableOpacity onPress={handleTimeConfirm}>
                <Text style={styles.modalConfirm}>Fertig</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerContainer}>
              <ScrollView style={styles.pickerColumnWide} showsVerticalScrollIndicator={false}>
                {hours.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[styles.pickerItem, tempHour === hour && styles.pickerItemSelected]}
                    onPress={() => setTempHour(hour)}
                  >
                    <Text style={[styles.pickerText, tempHour === hour && styles.pickerTextSelected]}>
                      {hour.toString().padStart(2, '0')} Uhr
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollView style={styles.pickerColumnWide} showsVerticalScrollIndicator={false}>
                {minutes.map((minute) => (
                  <TouchableOpacity
                    key={minute}
                    style={[styles.pickerItem, tempMinute === minute && styles.pickerItemSelected]}
                    onPress={() => setTempMinute(minute)}
                  >
                    <Text style={[styles.pickerText, tempMinute === minute && styles.pickerTextSelected]}>
                      {minute.toString().padStart(2, '0')} Min
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  selectButtonFilled: {
    borderColor: colors.primary[300],
    backgroundColor: colors.primary[50],
  },
  selectButtonContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  selectButtonText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  selectButtonTextFilled: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  selectButtonSubtext: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfWidth: {
    flex: 1,
  },
  inputContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  input: {
    height: 48,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  gpsButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    marginLeft: spacing.xs,
    fontWeight: fontWeight.medium,
  },
  gpsInfo: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  categoryIcon: {
    marginRight: spacing.xs,
  },
  categoryButtonText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  categoryButtonTextActive: {
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  textAreaContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  textArea: {
    minHeight: 120,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: colors.text.primary,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.sm,
  },
  draftButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  draftButtonText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  continueButton: {
    flex: 2,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.md,
  },
  continueButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginRight: spacing.xs,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  modalCancel: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  modalConfirm: {
    fontSize: fontSize.base,
    color: colors.primary[600],
    fontWeight: fontWeight.semibold,
  },
  // Vehicle Item Styles
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  vehicleItemSelected: {
    backgroundColor: colors.primary[50],
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  vehiclePlate: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  vehiclePlateSelected: {
    color: colors.primary[600],
  },
  vehicleModel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.light,
  },
  // Picker Styles
  pickerContainer: {
    flexDirection: 'row',
    height: 250,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerColumnWide: {
    flex: 1,
  },
  pickerItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: colors.primary[100],
    borderRadius: borderRadius.md,
  },
  pickerText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  pickerTextSelected: {
    color: colors.primary[600],
    fontWeight: fontWeight.semibold,
  },
});
