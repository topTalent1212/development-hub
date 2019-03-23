import React from 'react'
import { ScrollView, View } from 'react-native'

import { useCSSVariablesOrSpringAnimatedTheme } from '../../hooks/use-css-variables-or-spring--animated-theme'
import { useReduxAction } from '../../hooks/use-redux-action'
import { useReduxState } from '../../hooks/use-redux-state'
import * as actions from '../../redux/actions'
import * as selectors from '../../redux/selectors'
import { contentPadding } from '../../styles/variables'
import { SpringAnimatedText } from '../animated/spring/SpringAnimatedText'
import { ModalColumn } from '../columns/ModalColumn'
import { AppVersion } from '../common/AppVersion'
import { Avatar } from '../common/Avatar'
import { Button } from '../common/Button'
import { Link } from '../common/Link'
import { Spacer } from '../common/Spacer'
import { SubHeader } from '../common/SubHeader'
import { useAppLayout } from '../context/LayoutContext'
import { ThemePreference } from '../widgets/ThemePreference'

export interface SettingsModalProps {
  showBackButton: boolean
}

export const SettingsModal = React.memo((props: SettingsModalProps) => {
  const { showBackButton } = props

  const { sizename } = useAppLayout()

  const springAnimatedTheme = useCSSVariablesOrSpringAnimatedTheme()

  const username = useReduxState(selectors.currentGitHubUsernameSelector)

  const logout = useReduxAction(actions.logout)
  const pushModal = useReduxAction(actions.pushModal)

  return (
    <ModalColumn
      hideCloseButton={sizename === '1-small'}
      iconName="gear"
      name="SETTINGS"
      right={
        sizename === '1-small' && username ? (
          <Avatar
            backgroundColorLoading={null}
            shape="circle"
            size={28}
            username={username}
          />
        ) : (
          undefined
        )
      }
      showBackButton={showBackButton}
      title="Preferences"
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
        }}
      >
        <ThemePreference />

        {/* <Spacer height={contentPadding * 2} />

        <View>
          <SubHeader title="Enterprise" />

          <Button
            key="setup-github-enterprise-button"
            analyticsCategory="enterprise"
            analyticsAction="setup"
            analyticsLabel={username}
            analyticsPayload={{ user_id: userId }}
            onPress={() => pushModal({ name: 'SETUP_GITHUB_ENTERPRISE' })}
          >
            Setup GitHub Enterprise
          </Button>
        </View> */}

        <Spacer height={contentPadding} />

        <View>
          <SubHeader title="Follow on Twitter" />

          <View
            style={{ flexDirection: 'row', paddingHorizontal: contentPadding }}
          >
            <Link
              analyticsLabel="follow_on_twitter_devhub"
              href="https://twitter.com/devhub_app"
              openOnNewTab
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Avatar disableLink username="devhubapp" size={24} />

              <SpringAnimatedText
                style={{
                  flex: 1,
                  paddingHorizontal: contentPadding / 2,
                  color: springAnimatedTheme.foregroundColor,
                }}
              >
                @devhub_app
              </SpringAnimatedText>
            </Link>

            <Link
              analyticsLabel="follow_on_twitter_brunolemos"
              href="https://twitter.com/brunolemos"
              openOnNewTab
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                paddingTop: contentPadding / 2,
              }}
            >
              <Avatar disableLink username="brunolemos" size={24} />

              <SpringAnimatedText
                style={{
                  flex: 1,
                  paddingHorizontal: contentPadding / 2,
                  color: springAnimatedTheme.foregroundColor,
                }}
              >
                @brunolemos
              </SpringAnimatedText>
            </Link>
          </View>
        </View>

        <Spacer flex={1} minHeight={contentPadding} />

        <View style={{ padding: contentPadding }}>
          <AppVersion />

          <Spacer height={contentPadding} />

          <Button
            key="adbanced-button"
            analyticsLabel=""
            onPress={() => pushModal({ name: 'ADVANCED_SETTINGS' })}
          >
            Show advanced settings
          </Button>

          <Spacer height={contentPadding / 2} />

          <Button
            key="logout-button"
            analyticsCategory="engagement"
            analyticsAction="logout"
            analyticsLabel=""
            onPress={() => logout()}
          >
            Logout
          </Button>
        </View>
      </ScrollView>
    </ModalColumn>
  )
})
