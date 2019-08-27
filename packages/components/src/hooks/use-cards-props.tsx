import React, { useCallback, useMemo, useRef } from 'react'
import { View } from 'react-native'

import {
  Column,
  ColumnSubscription,
  constants,
  EnhancedItem,
  getDateSmallText,
} from '@devhub/core'
import {
  BaseCardProps,
  getCardPropsForItem,
  getCardSizeForProps,
} from '../components/cards/BaseCard.shared'
import {
  CardsFooter,
  CardsFooterProps,
  getCardsFooterSize,
} from '../components/cards/CardsFooter'
import {
  cardSearchTotalHeight,
  CardsSearchHeader,
} from '../components/cards/CardsSearchHeader'
import { EmptyCards } from '../components/cards/EmptyCards'
import {
  CardItemSeparator,
  cardItemSeparatorSize,
} from '../components/cards/partials/CardItemSeparator'
import {
  ColumnLoadingIndicator,
  columnLoadingIndicatorSize,
} from '../components/columns/ColumnLoadingIndicator'
import { RefreshControl } from '../components/common/RefreshControl'
import { OneListProps } from '../libs/one-list'
import { FlatListItemLayout } from '../utils/types'

export function useCardsProps<ItemT extends EnhancedItem>({
  column,
  columnIndex,
  fetchNextPage,
  items,
  lastFetchedAt,
  ownerIsKnown,
  refresh,
  repoIsKnown,
  type,
}: {
  column: Column
  columnIndex: number
  fetchNextPage: CardsFooterProps['fetchNextPage']
  items: ItemT[] | undefined
  lastFetchedAt: string | undefined
  ownerIsKnown: boolean
  refresh: CardsFooterProps['refresh']
  repoIsKnown: boolean
  type: ColumnSubscription['type']
}) {
  const cardPropsCacheMapRef = useRef(
    new WeakMap<EnhancedItem, BaseCardProps>(),
  )
  const sizeCacheMapRef = useRef(new WeakMap<EnhancedItem, number>())
  const firstVisibleItemIndexRef = useRef(-1)

  const itemCardProps = useMemo<Array<BaseCardProps | undefined>>(() => {
    const newCacheMap = new WeakMap()

    if (!(items && items.length)) {
      cardPropsCacheMapRef.current = newCacheMap
      return []
    }

    const result = items.map<BaseCardProps>(item => {
      const cached = cardPropsCacheMapRef.current.get(item)
      const value =
        cached || getCardPropsForItem(type, item, { ownerIsKnown, repoIsKnown })
      newCacheMap.set(item, value)

      return value
    })

    cardPropsCacheMapRef.current = newCacheMap

    return result
  }, [items, ownerIsKnown, repoIsKnown])

  const itemLayouts = useMemo<Array<FlatListItemLayout | undefined>>(() => {
    const newCacheMap = new WeakMap()

    if (!(items && items.length)) {
      sizeCacheMapRef.current = newCacheMap
      return []
    }

    let totalOffset = 0
    const result = items.map<FlatListItemLayout>((item, index) => {
      const cached = sizeCacheMapRef.current.get(item)
      const value = cached || getCardSizeForProps(itemCardProps[index]!) || 0
      newCacheMap.set(item, value)

      const offset = totalOffset
      totalOffset += value + cardItemSeparatorSize

      return {
        index,
        offset,
        length: value,
      }
    })

    sizeCacheMapRef.current = newCacheMap

    return result
  }, [itemCardProps, items, ownerIsKnown, repoIsKnown])

  const getItemSize = useCallback<
    NonNullable<OneListProps<ItemT>['getItemSize']>
  >((_, index) => (itemLayouts[index] && itemLayouts[index]!.length) || 0, [
    items,
    itemLayouts,
  ])

  const itemSeparator = useMemo<
    NonNullable<OneListProps<ItemT>['itemSeparator']>
  >(
    () => ({
      size: cardItemSeparatorSize,
      Component: ({ leading }) => (
        <CardItemSeparator leadingItem={leading && leading.item} />
      ),
    }),
    [cardItemSeparatorSize],
  )

  const header = useMemo<OneListProps<ItemT>['header']>(() => {
    return {
      size: cardSearchTotalHeight + columnLoadingIndicatorSize,
      sticky: true,
      Component: () => (
        <View>
          <CardsSearchHeader
            key={`cards-search-header-column-${column.id}`}
            columnId={column.id}
          />

          <ColumnLoadingIndicator columnId={column.id} />
        </View>
      ),
    }
  }, [column.id])

  const cardsFooterProps: CardsFooterProps = {
    clearedAt: column.filters && column.filters.clearedAt,
    columnId: column.id,
    fetchNextPage,
    isEmpty: !(items && items.length > 0),
    refresh,
  }
  const footer = useMemo<OneListProps<ItemT>['footer']>(() => {
    return {
      size: getCardsFooterSize({
        clearedAt: cardsFooterProps.clearedAt,
        hasFetchNextPage: !!cardsFooterProps.fetchNextPage,
        isEmpty: cardsFooterProps.isEmpty,
      }),
      sticky: false,
      Component: () => <CardsFooter {...cardsFooterProps} />,
    }
  }, [
    cardsFooterProps.clearedAt,
    cardsFooterProps.columnId,
    cardsFooterProps.fetchNextPage,
    cardsFooterProps.isEmpty,
    cardsFooterProps.refresh,
  ])

  const onVisibleItemsChanged = useCallback<
    NonNullable<OneListProps<ItemT>['onVisibleItemsChanged']>
  >(fromIndex => {
    firstVisibleItemIndexRef.current = fromIndex
  }, [])

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        intervalRefresh={lastFetchedAt}
        onRefresh={refresh}
        refreshing={false}
        title={
          lastFetchedAt
            ? `Last updated ${getDateSmallText(lastFetchedAt, true)}`
            : 'Pull to refresh'
        }
      />
    ),
    [lastFetchedAt, refresh],
  )

  const isOverColumnLimit = !!(
    columnIndex >= 0 && columnIndex + 1 > constants.COLUMNS_LIMIT
  )
  const OverrideRenderComponent = useMemo<
    React.ComponentType | undefined
  >(() => {
    if (isOverColumnLimit) {
      return () => (
        <EmptyCards
          column={column}
          errorMessage={`You have reached the limit of ${
            constants.COLUMNS_LIMIT
          } columns. This is to maintain a healthy usage of the GitHub API.`}
          errorTitle="Too many columns"
          fetchNextPage={undefined}
          refresh={undefined}
        />
      )
    }

    return undefined
  }, [column, isOverColumnLimit])

  return {
    OverrideRenderComponent,
    firstVisibleItemIndexRef,
    footer,
    getItemSize,
    header,
    itemCardProps,
    itemSeparator,
    onVisibleItemsChanged,
    refreshControl,
  }
}
