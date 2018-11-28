import _ from 'lodash'
import React, { useContext, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { Column } from 'shared-core/dist/types'
import {
  eventTypes,
  getEventTypeMetadata,
} from 'shared-core/dist/utils/helpers/github/events'
import { useDimensions } from '../../hooks/use-dimensions'
import { Octicons as Icon } from '../../libs/vector-icons'
import * as actions from '../../redux/actions'
import { useReduxAction } from '../../redux/hooks/use-redux-action'
import { columnHeaderHeight, contentPadding } from '../../styles/variables'
import { filterRecordHasThisValue } from '../../utils/helpers/filters'
import {
  getNotificationReasonMetadata,
  notificationReasons,
} from '../../utils/helpers/github/notifications'
import { CardItemSeparator } from '../cards/partials/CardItemSeparator'
import { Checkbox } from '../common/Checkbox'
import { Spacer } from '../common/Spacer'
import { ThemeContext } from '../context/ThemeContext'
import { ColumnHeaderItem } from './ColumnHeaderItem'
import { ColumnOptionsRow } from './ColumnOptionsRow'

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  innerContainer: {},
})

const notificationReasonOptions = notificationReasons
  .map(getNotificationReasonMetadata)
  .sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0))

const eventTypeOptions = eventTypes
  .map(getEventTypeMetadata)
  .sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0))

export interface ColumnOptionsProps {
  column: Column
  columnIndex: number
}

export type ColumnOptionCategory =
  | 'event_types'
  | 'notification_types'
  | 'privacy'
  | 'unread'

export function ColumnOptions(props: ColumnOptionsProps) {
  const [
    openedOptionCategory,
    setOpenedOptionCategory,
  ] = useState<ColumnOptionCategory | null>(null)
  const { theme } = useContext(ThemeContext)
  const deleteColumn = useReduxAction(actions.deleteColumn)
  const dimensions = useDimensions()
  const moveColumn = useReduxAction(actions.moveColumn)
  const setColumnActivityTypeFilter = useReduxAction(
    actions.setColumnActivityTypeFilter,
  )
  const setColumnPrivacyFilter = useReduxAction(actions.setColumnPrivacyFilter)
  const setColumnReasonFilter = useReduxAction(actions.setColumnReasonFilter)
  const setColumnUnreadFilter = useReduxAction(actions.setColumnUnreadFilter)

  const toggleOpenedOptionCategory = (
    optionCategory: ColumnOptionCategory | null,
  ) =>
    setOpenedOptionCategory(
      optionCategory === openedOptionCategory ? null : optionCategory,
    )

  const { column, columnIndex } = props

  return (
    <View
      style={[
        styles.container,
        {
          maxHeight: dimensions.window.height - columnHeaderHeight,
          backgroundColor: theme.backgroundColorLess08,
        },
      ]}
    >
      <ScrollView alwaysBounceVertical={false} style={styles.innerContainer}>
        {column.type === 'notifications' && (
          <ColumnOptionsRow
            contentContainerStyle={{
              marginVertical: -contentPadding / 4,
              marginRight: contentPadding,
            }}
            iconName="check"
            onToggle={() => toggleOpenedOptionCategory('notification_types')}
            opened={openedOptionCategory === 'notification_types'}
            title="Notification reasons"
          >
            {(() => {
              const filters =
                column.filters &&
                column.filters.notifications &&
                column.filters.notifications.reasons

              const defaultBooleanValue = true
              const isFilterStrict = filterRecordHasThisValue(
                filters,
                defaultBooleanValue,
              )

              return notificationReasonOptions.map(item => {
                const checked =
                  filters && typeof filters[item.reason] === 'boolean'
                    ? filters[item.reason]
                    : null

                return (
                  <Checkbox
                    key={`notification-reason-option-${item.reason}`}
                    checked={checked}
                    checkedBackgroundColor={item.color}
                    checkedForegroundColor={theme.backgroundColorDarker08}
                    containerStyle={{
                      flexGrow: 1,
                      paddingVertical: contentPadding / 4,
                    }}
                    defaultValue={defaultBooleanValue}
                    enableTrippleState={
                      !isFilterStrict || checked === defaultBooleanValue
                    }
                    label={item.label}
                    onChange={value => {
                      setColumnReasonFilter({
                        columnId: column.id,
                        reason: item.reason,
                        value,
                      })
                    }}
                    uncheckedForegroundColor={item.color}
                  />
                )
              })
            })()}
          </ColumnOptionsRow>
        )}

        {column.type === 'activity' && (
          <ColumnOptionsRow
            contentContainerStyle={{
              marginVertical: -contentPadding / 4,
              marginRight: contentPadding,
            }}
            iconName="check"
            onToggle={() => toggleOpenedOptionCategory('event_types')}
            opened={openedOptionCategory === 'event_types'}
            title="Event types"
          >
            {(() => {
              const filters =
                column.filters &&
                column.filters.activity &&
                column.filters.activity.types

              const defaultBooleanValue = true
              const isFilterStrict = filterRecordHasThisValue(
                filters,
                defaultBooleanValue,
              )

              return eventTypeOptions.map(item => {
                const checked =
                  filters && typeof filters[item.type] === 'boolean'
                    ? filters[item.type]
                    : null

                return (
                  <Checkbox
                    key={`event-type-option-${item.type}`}
                    checked={checked}
                    containerStyle={{
                      flexGrow: 1,
                      paddingVertical: contentPadding / 4,
                    }}
                    defaultValue={defaultBooleanValue}
                    enableTrippleState={
                      !isFilterStrict || checked === defaultBooleanValue
                    }
                    label={item.label}
                    onChange={value => {
                      setColumnActivityTypeFilter({
                        columnId: column.id,
                        type: item.type,
                        value,
                      })
                    }}
                  />
                )
              })
            })()}
          </ColumnOptionsRow>
        )}

        {column.type === 'notifications' &&
          (() => {
            const isReadChecked = !(
              column.filters && column.filters.unread === true
            )

            const isUnreadChecked = !(
              column.filters && column.filters.unread === false
            )

            const getFilterValue = (read?: boolean, unread?: boolean) =>
              read && unread ? undefined : read ? false : unread

            return (
              <ColumnOptionsRow
                contentContainerStyle={{ marginRight: contentPadding }}
                iconName="eye"
                onToggle={() => toggleOpenedOptionCategory('unread')}
                opened={openedOptionCategory === 'unread'}
                title="Read status"
              >
                <Checkbox
                  checked={isReadChecked}
                  containerStyle={{ flexGrow: 1 }}
                  disabled={isReadChecked && !isUnreadChecked}
                  label="Read"
                  onChange={checked => {
                    setColumnUnreadFilter({
                      columnId: column.id,
                      unread: getFilterValue(!!checked, isUnreadChecked),
                    })
                  }}
                />

                <Spacer height={contentPadding / 2} />

                <Checkbox
                  checked={isUnreadChecked}
                  containerStyle={{ flexGrow: 1 }}
                  disabled={isUnreadChecked && !isReadChecked}
                  label="Unread"
                  onChange={checked => {
                    setColumnUnreadFilter({
                      columnId: column.id,
                      unread: getFilterValue(isReadChecked, !!checked),
                    })
                  }}
                />
              </ColumnOptionsRow>
            )
          })()}

        {(() => {
          const isPrivateChecked = !(
            column.filters && column.filters.private === false
          )

          const isPublicChecked = !(
            column.filters && column.filters.private === true
          )

          const getFilterValue = (
            showPublic?: boolean,
            showPrivate?: boolean,
          ) =>
            showPublic && showPrivate
              ? undefined
              : showPublic
              ? false
              : showPrivate

          return (
            <ColumnOptionsRow
              contentContainerStyle={{ marginRight: contentPadding }}
              iconName="lock"
              onToggle={() => toggleOpenedOptionCategory('privacy')}
              opened={openedOptionCategory === 'privacy'}
              title="Privacy"
            >
              <Checkbox
                checked={isPublicChecked}
                containerStyle={{ flexGrow: 1 }}
                disabled={isPublicChecked && !isPrivateChecked}
                label="Public"
                onChange={checked => {
                  setColumnPrivacyFilter({
                    columnId: column.id,
                    private: getFilterValue(!!checked, isPrivateChecked),
                  })
                }}
              />

              <Spacer height={contentPadding / 2} />

              <Checkbox
                checked={isPrivateChecked}
                containerStyle={{ flexGrow: 1 }}
                disabled={isPrivateChecked && !isPublicChecked}
                label="Private"
                onChange={checked => {
                  setColumnPrivacyFilter({
                    columnId: column.id,
                    private: getFilterValue(isPublicChecked, !!checked),
                  })
                }}
              />
            </ColumnOptionsRow>
          )
        })()}

        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: contentPadding / 2,
          }}
        >
          <ColumnHeaderItem
            iconName="chevron-left"
            onPress={() =>
              moveColumn({ columnId: column.id, columnIndex: columnIndex - 1 })
            }
          />
          <ColumnHeaderItem
            iconName="chevron-right"
            onPress={() =>
              moveColumn({ columnId: column.id, columnIndex: columnIndex + 1 })
            }
          />

          <Spacer flex={1} />

          <ColumnHeaderItem
            iconName="trashcan"
            onPress={() => deleteColumn(column.id)}
            text="Remove"
          />
        </View>
      </ScrollView>
      <CardItemSeparator />
    </View>
  )
}
