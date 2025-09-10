import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import {
  Text,
  Card,
  Title,
  List,
  Button,
  Divider
} from 'react-native-paper';
import { useSettingsStore } from '../../stores/settingsStore';
import { colors, darkColors } from '../../theme';

export default function HelpScreen() {
  const { isDarkMode } = useSettingsStore();
  const themeColors = isDarkMode ? darkColors : colors;
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const openEmail = () => {
    Linking.openURL('mailto:whdans0077@gmail.com?subject=Where\'s Money 우리집가계부 문의');
  };

  const openWebsite = () => {
    Linking.openURL('https://wheresmoney.app');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background.secondary }]}>
      {/* 앱 소개 */}
      <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={[styles.title, { color: themeColors.text.primary }]}>
            Where's Money 우리집가계부에 오신 것을 환영합니다! 👋
          </Title>
          <Text style={[styles.description, { color: themeColors.text.secondary }]}>
            가족과 함께 사용하는 똑똑한 가계부 앱입니다. 모든 지출을 투명하게 기록하고 가족 구성원들과 공유하여 
            더 나은 가계 관리를 할 수 있습니다.
          </Text>
        </Card.Content>
      </Card>

      {/* 주요 기능 */}
      <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
            주요 기능
          </Title>
          
          <List.Item
            title="가족방 생성 및 참여"
            description="가족 구성원들을 초대하여 함께 가계부를 관리하세요"
            left={(props) => <List.Icon {...props} icon="home-group" />}
            titleStyle={{ color: themeColors.text.primary }}
            descriptionStyle={{ color: themeColors.text.secondary }}
          />
          <Divider />
          
          <List.Item
            title="지출 기록 (사진 필수)"
            description="모든 지출에는 영수증이나 증빙 사진을 첨부해야 합니다"
            left={(props) => <List.Icon {...props} icon="camera" />}
            titleStyle={{ color: themeColors.text.primary }}
            descriptionStyle={{ color: themeColors.text.secondary }}
          />
          <Divider />
          
          <List.Item
            title="수입 기록"
            description="급여, 용돈, 부업 등 다양한 수입을 간편하게 기록하세요"
            left={(props) => <List.Icon {...props} icon="cash-plus" />}
            titleStyle={{ color: themeColors.text.primary }}
            descriptionStyle={{ color: themeColors.text.secondary }}
          />
          <Divider />
          
          <List.Item
            title="통계 및 분석"
            description="월별, 카테고리별, 멤버별 지출 패턴을 분석해보세요"
            left={(props) => <List.Icon {...props} icon="chart-line" />}
            titleStyle={{ color: themeColors.text.primary }}
            descriptionStyle={{ color: themeColors.text.secondary }}
          />
          <Divider />
          
          <List.Item
            title="실시간 알림"
            description="가족 구성원의 지출 기록을 실시간으로 알려드립니다"
            left={(props) => <List.Icon {...props} icon="bell" />}
            titleStyle={{ color: themeColors.text.primary }}
            descriptionStyle={{ color: themeColors.text.secondary }}
          />
        </Card.Content>
      </Card>

      {/* 사용 방법 */}
      <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
            사용 방법
          </Title>
          
          <View style={styles.stepContainer}>
            <Text style={[styles.stepNumber, { color: themeColors.primary[500] }]}>1</Text>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: themeColors.text.primary }]}>가족방 만들기</Text>
              <Text style={[styles.stepDescription, { color: themeColors.text.secondary }]}>
                홈 화면에서 "+" 버튼을 누르고 가족방을 생성하세요. 가족방 이름과 설명을 입력해주세요.
              </Text>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <Text style={[styles.stepNumber, { color: themeColors.primary[500] }]}>2</Text>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: themeColors.text.primary }]}>가족 초대하기</Text>
              <Text style={[styles.stepDescription, { color: themeColors.text.secondary }]}>
                가족방 상세 화면에서 "초대" 버튼을 누르고 초대 코드를 가족들에게 공유하세요.
              </Text>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <Text style={[styles.stepNumber, { color: themeColors.primary[500] }]}>3</Text>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: themeColors.text.primary }]}>지출 기록하기</Text>
              <Text style={[styles.stepDescription, { color: themeColors.text.secondary }]}>
                가족방에서 "+" 버튼을 누르고 지출 내역을 입력하세요. 사진 첨부는 필수입니다!
              </Text>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <Text style={[styles.stepNumber, { color: themeColors.primary[500] }]}>4</Text>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: themeColors.text.primary }]}>통계 확인하기</Text>
              <Text style={[styles.stepDescription, { color: themeColors.text.secondary }]}>
                가족방에서 "통계" 버튼을 눌러 월별 지출 패턴과 카테고리별 분석을 확인하세요.
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* 팁 */}
      <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
            💡 유용한 팁
          </Title>
          
          <View style={styles.tipContainer}>
            <Text style={[styles.tipText, { color: themeColors.text.secondary }]}>
              • 지출 기록 시 내용을 입력하고 엔터를 누르면 자동으로 사진 선택 화면이 나타납니다
            </Text>
          </View>
          
          <View style={styles.tipContainer}>
            <Text style={[styles.tipText, { color: themeColors.text.secondary }]}>
              • 알림 설정에서 원하지 않는 알림을 끌 수 있습니다
            </Text>
          </View>
          
          <View style={styles.tipContainer}>
            <Text style={[styles.tipText, { color: themeColors.text.secondary }]}>
              • 설정에서 다크 모드와 화폐 단위를 변경할 수 있습니다
            </Text>
          </View>
          
          <View style={styles.tipContainer}>
            <Text style={[styles.tipText, { color: themeColors.text.secondary }]}>
              • 통계 화면에서 차트는 좌우로 스크롤할 수 있습니다
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* FAQ */}
      <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
            자주 묻는 질문
          </Title>
          
          <List.Accordion
            title="지출 기록에 왜 사진이 필수인가요?"
            titleStyle={{ color: themeColors.text.primary, fontSize: 14 }}
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            expanded={expandedFAQ === 1}
            onPress={() => setExpandedFAQ(expandedFAQ === 1 ? null : 1)}
          >
            <View style={styles.faqContent}>
              <Text style={[styles.faqAnswer, { color: themeColors.text.secondary }]}>
                투명한 가계 관리를 위해 모든 지출에 증빙 자료가 필요합니다. 가족 구성원들이 서로 신뢰할 수 있도록 도와주며, 
                나중에 지출 내역을 확인할 때도 정확한 기록을 남길 수 있습니다. 영수증이나 상품 사진 등을 첨부해 주세요.
              </Text>
            </View>
          </List.Accordion>
          
          <List.Accordion
            title="가족방에서 나갈 수 있나요?"
            titleStyle={{ color: themeColors.text.primary, fontSize: 14 }}
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            expanded={expandedFAQ === 2}
            onPress={() => setExpandedFAQ(expandedFAQ === 2 ? null : 2)}
          >
            <View style={styles.faqContent}>
              <Text style={[styles.faqAnswer, { color: themeColors.text.secondary }]}>
                네, 가족방 설정에서 나가기 기능을 사용할 수 있습니다. 단, 방장은 다른 멤버에게 권한을 이양한 후 나갈 수 있습니다. 
                방을 나가더라도 기존에 작성한 가계부 기록은 그대로 유지됩니다.
              </Text>
            </View>
          </List.Accordion>
          
          <List.Accordion
            title="데이터가 삭제될까봐 걱정돼요"
            titleStyle={{ color: themeColors.text.primary, fontSize: 14 }}
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            expanded={expandedFAQ === 3}
            onPress={() => setExpandedFAQ(expandedFAQ === 3 ? null : 3)}
          >
            <View style={styles.faqContent}>
              <Text style={[styles.faqAnswer, { color: themeColors.text.secondary }]}>
                모든 데이터는 안전하게 클라우드에 저장되며, 자동 백업이 이루어집니다. 회원 탈퇴 시에도 가계부 데이터는 보존되어 
                다른 가족 구성원들이 계속 확인할 수 있습니다. 개인 정보만 삭제되고 가계부 기록은 그대로 유지됩니다.
              </Text>
            </View>
          </List.Accordion>

          <List.Accordion
            title="카테고리를 추가하거나 수정할 수 있나요?"
            titleStyle={{ color: themeColors.text.primary, fontSize: 14 }}
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            expanded={expandedFAQ === 4}
            onPress={() => setExpandedFAQ(expandedFAQ === 4 ? null : 4)}
          >
            <View style={styles.faqContent}>
              <Text style={[styles.faqAnswer, { color: themeColors.text.secondary }]}>
                현재는 기본 제공되는 카테고리만 사용 가능합니다 (식비, 교통비, 쇼핑, 의료비 등). 
                향후 업데이트에서 사용자 정의 카테고리 기능이 추가될 예정입니다.
              </Text>
            </View>
          </List.Accordion>

          <List.Accordion
            title="알림이 너무 많이 와요"
            titleStyle={{ color: themeColors.text.primary, fontSize: 14 }}
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            expanded={expandedFAQ === 5}
            onPress={() => setExpandedFAQ(expandedFAQ === 5 ? null : 5)}
          >
            <View style={styles.faqContent}>
              <Text style={[styles.faqAnswer, { color: themeColors.text.secondary }]}>
                프로필 → 알림 설정에서 원하지 않는 알림을 끌 수 있습니다. 가계부 기록 알림, 가족 초대 알림, 
                멤버 가입 알림을 각각 개별적으로 설정할 수 있습니다.
              </Text>
            </View>
          </List.Accordion>
        </Card.Content>
      </Card>

      {/* 연락처 */}
      <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
            문의하기
          </Title>
          <Text style={[styles.contactText, { color: themeColors.text.secondary }]}>
            궁금한 점이나 개선 요청사항이 있으시면 언제든 연락해주세요!
          </Text>
          
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              icon="email"
              onPress={openEmail}
              style={styles.contactButton}
            >
              이메일 문의
            </Button>
            
            <Button
              mode="outlined"
              icon="web"
              onPress={openWebsite}
              style={styles.contactButton}
            >
              웹사이트 방문
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* 버전 정보 */}
      <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <View style={styles.versionContainer}>
            <Text style={[styles.versionText, { color: themeColors.text.secondary }]}>
              Where's Money 우리집가계부 v1.0.0
            </Text>
            <Text style={[styles.versionText, { color: themeColors.text.secondary }]}>
              Made with ❤️ for families
            </Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 12,
    lineHeight: 24,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  tipContainer: {
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
  contactText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
  },
  contactButton: {
    marginVertical: 4,
  },
  versionContainer: {
    alignItems: 'center',
    gap: 4,
  },
  versionText: {
    fontSize: 12,
    textAlign: 'center',
  },
  faqContent: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 12,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
  },
});