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
                    Basics.max Constants.itemHeight <| Utils.getCanvasHeight settings items

                halfWidth : Int
                halfWidth =
                    Constants.itemWidth * 2 - Constants.canvasOffset
                
                quarterWidth : Int
                quarterWidth =
                    Constants.itemWidth - Constants.canvasOffset
            in
            Svg.g
                []
                [
                  -- 最上段: 目的・ビジョン
                  Lazy.lazy Canvas.view
                    { settings = settings
                    , property = property
                    , size = ( halfWidth, itemHeight - Constants.canvasOffset )
                    , position = ( 0, 0 )
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
                    , size = ( halfWidth, itemHeight - Constants.canvasOffset )
                    , position = ( halfWidth, 0 )
                    , selectedItem = selectedItem
                    , item = vision
                    , onEditSelectedItem = onEditSelectedItem
                    , onEndEditSelectedItem = onEndEditSelectedItem
                    , onSelect = onSelect
                    , dragStart = dragStart
                    }
                
                  -- 中央左側: 実現手段・優位性・指標・提案価値
                , Lazy.lazy Canvas.view
                    { settings = settings
                    , property = property
                    , size = ( quarterWidth, itemHeight - Constants.canvasOffset )
                    , position = ( 0, itemHeight - Constants.canvasOffset )
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
                    , size = ( quarterWidth, itemHeight - Constants.canvasOffset )
                    , position = ( 0, itemHeight * 2 - Constants.canvasOffset * 2 )
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
                    , size = ( quarterWidth, itemHeight - Constants.canvasOffset )
                    , position = ( quarterWidth, itemHeight - Constants.canvasOffset )
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
                    , size = ( quarterWidth, itemHeight - Constants.canvasOffset )
                    , position = ( quarterWidth, itemHeight * 2 - Constants.canvasOffset * 2 )
                    , selectedItem = selectedItem
                    , item = valueProposition
                    , onEditSelectedItem = onEditSelectedItem
                    , onEndEditSelectedItem = onEndEditSelectedItem
                    , onSelect = onSelect
                    , dragStart = dragStart
                    }
                
                  -- 中央右側: 顕在課題・潜在課題・代替手段・状況・チャネル・傾向
                , Lazy.lazy Canvas.view
                    { settings = settings
                    , property = property
                    , size = ( quarterWidth, itemHeight - Constants.canvasOffset )
                    , position = ( halfWidth, itemHeight - Constants.canvasOffset )
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
                    , size = ( quarterWidth, itemHeight - Constants.canvasOffset )
                    , position = ( halfWidth, itemHeight * 2 - Constants.canvasOffset * 2 )
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
                    , size = ( quarterWidth, itemHeight // 2 )
                    , position = ( Constants.itemWidth * 3 - Constants.canvasOffset, itemHeight - Constants.canvasOffset )
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
                    , size = ( quarterWidth, itemHeight // 2 )
                    , position = ( Constants.itemWidth * 3 - Constants.canvasOffset, itemHeight + (itemHeight // 2) )
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
                    , size = ( quarterWidth, itemHeight // 2 )
                    , position = ( Constants.itemWidth * 3 - Constants.canvasOffset, itemHeight * 2 - Constants.canvasOffset * 2 )
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
                    , size = ( quarterWidth, itemHeight // 2 )
                    , position = ( Constants.itemWidth * 3 - Constants.canvasOffset, (itemHeight * 2) + (itemHeight // 2) - Constants.canvasOffset * 3 )
                    , selectedItem = selectedItem
                    , item = trend
                    , onEditSelectedItem = onEditSelectedItem
                    , onEndEditSelectedItem = onEndEditSelectedItem
                    , onSelect = onSelect
                    , dragStart = dragStart
                    }
                
                  -- 最下段: 収益モデル・市場規模
                , Lazy.lazy Canvas.view
                    { settings = settings
                    , property = property
                    , size = ( halfWidth, itemHeight - Constants.canvasOffset )
                    , position = ( 0, itemHeight * 3 - Constants.canvasOffset * 3 )
                    , selectedItem = selectedItem
                    , item = revenueModel
                    , onEditSelectedItem = onEditSelectedItem
                    , onEndEditSelectedItem = onEndEditSelectedItem
                    , onSelect = onSelect
                    , dragStart = dragStart
                    }
                , Lazy.lazy Canvas.view
                    { settings = settings
                    , property = property
                    , size = ( halfWidth, itemHeight - Constants.canvasOffset )
                    , position = ( halfWidth, itemHeight * 3 - Constants.canvasOffset * 3 )
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