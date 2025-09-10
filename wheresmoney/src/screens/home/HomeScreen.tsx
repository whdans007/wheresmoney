import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { 
  Text, 
  Button, 
  Card,
  Title,
  List,
  ActivityIndicator
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { HomeStackParamList } from '../../types';
import { useFamilyStore } from '../../stores/familyStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { FamilyService } from '../../services/family';
import { colors, darkColors } from '../../theme';

type HomeScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'HomeScreen'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { families, loading, setFamilies, setLoading } = useFamilyStore();
  const { isDarkMode } = useSettingsStore();
  const themeColors = isDarkMode ? darkColors : colors;

  const loadFamilies = async () => {
    setLoading(true);
    try {
      const { families: userFamilies, error } = await FamilyService.getUserFamilies();
      if (error) {
        console.error('Failed to load families:', error);
      } else {
        setFamilies(userFamilies);
      }
    } catch (error) {
      console.error('Error loading families:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadFamilies();
    }, [])
  );

  const renderFamilyItem = ({ item }: { item: any }) => (
    <List.Item
      title={item.name}
      description={item.description || t('home.noDescription')}
      left={(props) => <List.Icon {...props} icon="home-group" />}
      right={(props) => <List.Icon {...props} icon="chevron-right" />}
      onPress={() => navigation.navigate('FamilyDetail', { familyId: item.id })}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.secondary }]}>
      <Card style={[styles.welcomeCard, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={{ color: themeColors.text.primary }}>{t('home.welcome')}</Title>
          <Text style={{ color: themeColors.text.secondary }}>{t('home.welcomeMessage')}</Text>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('CreateFamily')}
          style={styles.actionButton}
          icon="plus"
        >
          {t('home.createNewFamily')}
        </Button>
        
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('JoinFamily')}
          style={styles.actionButton}
          icon="account-plus"
        >
          {t('home.joinFamily')}
        </Button>
      </View>

      <Card style={[styles.familiesCard, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: themeColors.text.primary }]}>{t('home.myFamilies')}</Title>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" />
              <Text style={[styles.loadingText, { color: themeColors.text.secondary }]}>{t('home.loadingFamilies')}</Text>
            </View>
          ) : families.length === 0 ? (
            <Text style={[styles.emptyText, { color: themeColors.text.secondary }]}>
              {t('home.noFamilies')}
            </Text>
          ) : (
            <FlatList
              data={families}
              renderItem={renderFamilyItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  welcomeCard: {
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
  },
  familiesCard: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginLeft: 12,
  },
});