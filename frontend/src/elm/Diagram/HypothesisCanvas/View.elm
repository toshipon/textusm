module Diagram.HypothesisCanvas.View exposing (docs, view)

import Constants
import Diagram.HypothesisCanvas.Types as HypothesisCanvas exposing (HypothesisCanvasItem(..))
import Diagram.Types exposing (SelectedItem, SelectedItemInfo)
import Diagram.Types.Data as DiagramData
import Diagram.Types.Settings as DiagramSettings
import Diagram.Types.Type as DiagramType
import Diagram.View.Canvas as Canvas
import Diagram.View.Views as View
import ElmBook.Actions as Actions
import ElmBook.Chapter as Chapter exposing (Chapter)
import Svg.Styled as Svg exposing (Svg)
import Svg.Styled.Attributes as SvgAttr
import Svg.Styled.Lazy as Lazy
import Types.Item as Item exposing (Item, Items)
import Types.Property as Property exposing (Property)
import Utils.Common as Utils
import View.Empty as Empty


view :
    { items : Items
    , data : DiagramData.Data
    , settings : DiagramSettings.Settings
    , selectedItem : SelectedItem
    , property : Property
    , onEditSelectedItem : String -> msg
    , onEndEditSelectedItem : Item -> msg
    , onSelect : Maybe SelectedItemInfo -> msg
    , dragStart : View.DragStart msg
    }
    -> Svg msg
view { data, settings, items, property, selectedItem, onEditSelectedItem, onEndEditSelectedItem, onSelect, dragStart } =
    case data of
        DiagramData.HypothesisCanvas h ->
            let
                (HypothesisCanvasItem purpose) =
                    h.purpose

                (HypothesisCanvasItem vision) =
                    h.vision

                (HypothesisCanvasItem means) =
                    h.means

                (HypothesisCanvasItem advantage) =
                    h.advantage

                (HypothesisCanvasItem metrics) =
                    h.metrics

                (HypothesisCanvasItem valueProposition) =
                    h.valueProposition

                (HypothesisCanvasItem obviousProblem) =
                    h.obviousProblem

                (HypothesisCanvasItem latentProblem) =
                    h.latentProblem

                (HypothesisCanvasItem alternatives) =
                    h.alternatives

                (HypothesisCanvasItem situation) =
                    h.situation

                (HypothesisCanvasItem channel) =
                    h.channel

                (HypothesisCanvasItem trend) =
                    h.trend

                (HypothesisCanvasItem revenueModel) =
                    h.revenueModel

                (HypothesisCanvasItem marketSize) =
                    h.marketSize

                itemHeight : Int
                itemHeight =
                    Utils.getCanvasHeight settings items

                -- レイアウト計算用の変数を調整
                fullWidth : Int
                fullWidth =
                    Constants.itemWidth * 4 - Constants.canvasOffset * 3

                halfWidth : Int
                halfWidth =
                    Constants.itemWidth * 2 - Constants.canvasOffset

                quarterWidth : Int
                quarterWidth =
                    Constants.itemWidth - Constants.canvasOffset

                rightColX : Int
                rightColX =
                    Constants.itemWidth * 3 - Constants.canvasOffset * 2

                -- 全体の高さを計算 (仮に4段とする)
                totalHeight : Int
                totalHeight =
                    itemHeight * 4 - Constants.canvasOffset * 3

                -- 各列のアイテムの高さを計算 (左列: 4項目, 右列: 9項目)
                leftItemCount : Int
                leftItemCount = 4

                rightItemCount : Int
                rightItemCount = 9 -- ビジョン、顕在課題、潜在課題、指標、代替手段、状況、チャネル、傾向、市場規模

                leftItemHeight : Int
                leftItemHeight =
                    if leftItemCount > 0 then totalHeight // leftItemCount - Constants.canvasOffset * (leftItemCount - 1) // leftItemCount else 0

                rightItemHeight : Int
                rightItemHeight =
                     if rightItemCount > 0 then totalHeight // rightItemCount - Constants.canvasOffset * (rightItemCount - 1) // rightItemCount else 0


                -- Y座標計算ヘルパー
                calculateYPos : Int -> Int -> Int -> Int
                calculateYPos index itemH baseOffset =
                    index * (itemH + baseOffset)

            in
            Svg.g
                []
                [
                  -- 左列 (目的, 実現手段, 優位性, 収益モデル) - 変数名は修正済みなので変更なし
                  Lazy.lazy Canvas.view
                    { settings = settings
                    , property = property
                    , size = ( quarterWidth, leftItemHeight )
                    , position = ( 0, calculateYPos 0 leftItemHeight Constants.canvasOffset )
                    , selectedItem = selectedItem
                    , item = purpose
                    , onEditSelectedItem = onEditSelectedItem
                    , onEndEditSelectedItem = onEndEditSelectedItem
                    , onSelect = onSelect
                    , dragStart = dragStart
                    }
                , Lazy.lazy Canvas.view
                    { settings = settings
                    , property = property
                    , size = ( quarterWidth, leftItemHeight )
                    , position = ( 0, calculateYPos 1 leftItemHeight Constants.canvasOffset )
                    , selectedItem = selectedItem
                    , item = means
                    , onEditSelectedItem = onEditSelectedItem
                    , onEndEditSelectedItem = onEndEditSelectedItem
                    , onSelect = onSelect
                    , dragStart = dragStart
                    }
                , Lazy.lazy Canvas.view
                    { settings = settings
                    , property = property
                    , size = ( quarterWidth, leftItemHeight )
                    , position = ( 0, calculateYPos 2 leftItemHeight Constants.canvasOffset )
                    , selectedItem = selectedItem
                    , item = advantage
                    , onEditSelectedItem = onEditSelectedItem
                    , onEndEditSelectedItem = onEndEditSelectedItem
                    , onSelect = onSelect
                    , dragStart = dragStart
                    }
                , Lazy.lazy Canvas.view
                    { settings = settings
                    , property = property
                    , size = ( quarterWidth, leftItemHeight )
                    , position = ( 0, calculateYPos 3 leftItemHeight Constants.canvasOffset )
                    , selectedItem = selectedItem
                    , item = revenueModel
                    , onEditSelectedItem = onEditSelectedItem
                    , onEndEditSelectedItem = onEndEditSelectedItem
                    , onSelect = onSelect
                    , dragStart = dragStart
                    }
                  -- 中央列: 提案価値 (縦長に) - 変数名は修正済みなので変更なし
                , Lazy.lazy Canvas.view
                    { settings = settings
                    , property = property
                    , size = ( halfWidth, totalHeight ) -- 幅は半分、高さは全体
                    , position = ( quarterWidth, 0 ) -- 中央上端から
                    , selectedItem = selectedItem
                    , item = valueProposition
                    , onEditSelectedItem = onEditSelectedItem
                    , onEndEditSelectedItem = onEndEditSelectedItem
                    , onSelect = onSelect
                    , dragStart = dragStart
                    }
                  -- 右列 (ビジョン, 顕在課題, 潜在課題, 指標, 代替手段, 状況, チャネル, 傾向, 市場規模) - 変数名は修正済みなので変更なし
                , Lazy.lazy Canvas.view
                    { settings = settings
                    , property = property
                    , size = ( quarterWidth, rightItemHeight )
                    , position = ( rightColX, calculateYPos 0 rightItemHeight Constants.canvasOffset )
                    , selectedItem = selectedItem
                    , item = vision
                    , onEditSelectedItem = onEditSelectedItem
                    , onEndEditSelectedItem = onEndEditSelectedItem
                    , onSelect = onSelect
                    , dragStart = dragStart
                    }
                , Lazy.lazy Canvas.view
                    { settings = settings
                    , property = property
                    , size = ( quarterWidth, rightItemHeight )
                    , position = ( rightColX, calculateYPos 1 rightItemHeight Constants.canvasOffset )
                    , selectedItem = selectedItem
                    , item = obviousProblem
                    , onEditSelectedItem = onEditSelectedItem
                    , onEndEditSelectedItem = onEndEditSelectedItem
                    , onSelect = onSelect
                    , dragStart = dragStart
                    }
                , Lazy.lazy Canvas.view
                    { settings = settings
                    , property = property
                    , size = ( quarterWidth, rightItemHeight )
                    , position = ( rightColX, calculateYPos 2 rightItemHeight Constants.canvasOffset )
                    , selectedItem = selectedItem
                    , item = latentProblem
                    , onEditSelectedItem = onEditSelectedItem
                    , onEndEditSelectedItem = onEndEditSelectedItem
                    , onSelect = onSelect
                    , dragStart = dragStart
                    }
                , Lazy.lazy Canvas.view
                    { settings = settings
                    , property = property
                    , size = ( quarterWidth, rightItemHeight )
                    , position = ( rightColX, calculateYPos 3 rightItemHeight Constants.canvasOffset )
                    , selectedItem = selectedItem
                    , item = metrics
                    , onEditSelectedItem = onEditSelectedItem
                    , onEndEditSelectedItem = onEndEditSelectedItem
                    , onSelect = onSelect
                    , dragStart = dragStart
                    }
                , Lazy.lazy Canvas.view
                    { settings = settings
                    , property = property
                    , size = ( quarterWidth, rightItemHeight )
                    , position = ( rightColX, calculateYPos 4 rightItemHeight Constants.canvasOffset )
                    , selectedItem = selectedItem
                    , item = alternatives
                    , onEditSelectedItem = onEditSelectedItem
                    , onEndEditSelectedItem = onEndEditSelectedItem
                    , onSelect = onSelect
                    , dragStart = dragStart
                    }
                , Lazy.lazy Canvas.view
                    { settings = settings
                    , property = property
                    , size = ( quarterWidth, rightItemHeight )
                    , position = ( rightColX, calculateYPos 5 rightItemHeight Constants.canvasOffset )
                    , selectedItem = selectedItem
                    , item = situation
                    , onEditSelectedItem = onEditSelectedItem
                    , onEndEditSelectedItem = onEndEditSelectedItem
                    , onSelect = onSelect
                    , dragStart = dragStart
                    }
                , Lazy.lazy Canvas.view
                    { settings = settings
                    , property = property
                    , size = ( quarterWidth, rightItemHeight )
                    , position = ( rightColX, calculateYPos 6 rightItemHeight Constants.canvasOffset )
                    , selectedItem = selectedItem
                    , item = channel
                    , onEditSelectedItem = onEditSelectedItem
                    , onEndEditSelectedItem = onEndEditSelectedItem
                    , onSelect = onSelect
                    , dragStart = dragStart
                    }
                , Lazy.lazy Canvas.view
                    { settings = settings
                    , property = property
                    , size = ( quarterWidth, rightItemHeight )
                    , position = ( rightColX, calculateYPos 7 rightItemHeight Constants.canvasOffset )
                    , selectedItem = selectedItem
                    , item = trend
                    , onEditSelectedItem = onEditSelectedItem
                    , onEndEditSelectedItem = onEndEditSelectedItem
                    , onSelect = onSelect
                    , dragStart = dragStart
                    }
                , Lazy.lazy Canvas.view
                    { settings = settings
                    , property = property
                    , size = ( quarterWidth, rightItemHeight ) -- 市場規模も右列に追加
                    , position = ( rightColX, calculateYPos 8 rightItemHeight Constants.canvasOffset ) -- 9番目のアイテムとして配置
                    , selectedItem = selectedItem
                    , item = marketSize
                    , onEditSelectedItem = onEditSelectedItem
                    , onEndEditSelectedItem = onEndEditSelectedItem
                    , onSelect = onSelect
                    , dragStart = dragStart
                    }
                ]

        _ ->
            Empty.view


docs : Chapter x
docs =
    Chapter.chapter "HypothesisCanvas"
        |> Chapter.renderComponent
            (Svg.svg
                [ SvgAttr.width "100%"
                , SvgAttr.height "100%"
                , SvgAttr.viewBox "0 0 2048 2048"
                ]
                [ view
                    { items = Item.empty
                    , data =
                        DiagramData.HypothesisCanvas <|
                            HypothesisCanvas.from <|
                                (DiagramType.defaultText DiagramType.HypothesisCanvas |> Item.fromString |> Tuple.second)
                    , settings = DiagramSettings.default
                    , selectedItem = Nothing
                    , property = Property.empty
                    , onEditSelectedItem = \_ -> Actions.logAction "onEditSelectedItem"
                    , onEndEditSelectedItem = \_ -> Actions.logAction "onEndEditSelectedItem"
                    , onSelect = \_ -> Actions.logAction "onEndEditSelectedItem"
                    , dragStart = \_ _ -> SvgAttr.style ""
                    }
                ]
                |> Svg.toUnstyled
            )