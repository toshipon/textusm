module Diagram.HypothesisCanvas.Types exposing (HypothesisCanvas, HypothesisCanvasItem(..), from, size)

import Constants
import Diagram.Types.Settings as DiagramSettings
import Types.Item as Item exposing (Item, Items)
import Types.Size exposing (Size)
import Utils.Common as Utils


type alias HypothesisCanvas =
    { purpose : HypothesisCanvasItem
    , vision : HypothesisCanvasItem
    , means : HypothesisCanvasItem
    , advantage : HypothesisCanvasItem
    , metrics : HypothesisCanvasItem
    , valueProposition : HypothesisCanvasItem
    , obviousProblem : HypothesisCanvasItem
    , latentProblem : HypothesisCanvasItem
    , alternatives : HypothesisCanvasItem
    , situation : HypothesisCanvasItem
    , channel : HypothesisCanvasItem
    , trend : HypothesisCanvasItem
    , revenueModel : HypothesisCanvasItem
    , marketSize : HypothesisCanvasItem
    }


type HypothesisCanvasItem
    = HypothesisCanvasItem Item


from : Items -> HypothesisCanvas
from items =
    HypothesisCanvas 
        (items |> Item.getAt 0 |> Maybe.withDefault Item.new |> HypothesisCanvasItem)
        (items |> Item.getAt 1 |> Maybe.withDefault Item.new |> HypothesisCanvasItem)
        (items |> Item.getAt 2 |> Maybe.withDefault Item.new |> HypothesisCanvasItem)
        (items |> Item.getAt 3 |> Maybe.withDefault Item.new |> HypothesisCanvasItem)
        (items |> Item.getAt 4 |> Maybe.withDefault Item.new |> HypothesisCanvasItem)
        (items |> Item.getAt 5 |> Maybe.withDefault Item.new |> HypothesisCanvasItem)
        (items |> Item.getAt 6 |> Maybe.withDefault Item.new |> HypothesisCanvasItem)
        (items |> Item.getAt 7 |> Maybe.withDefault Item.new |> HypothesisCanvasItem)
        (items |> Item.getAt 8 |> Maybe.withDefault Item.new |> HypothesisCanvasItem)
        (items |> Item.getAt 9 |> Maybe.withDefault Item.new |> HypothesisCanvasItem)
        (items |> Item.getAt 10 |> Maybe.withDefault Item.new |> HypothesisCanvasItem)
        (items |> Item.getAt 11 |> Maybe.withDefault Item.new |> HypothesisCanvasItem)
        (items |> Item.getAt 12 |> Maybe.withDefault Item.new |> HypothesisCanvasItem)
        (items |> Item.getAt 13 |> Maybe.withDefault Item.new |> HypothesisCanvasItem)


size : DiagramSettings.Settings -> Items -> Size
size settings items =
    ( Constants.itemWidth * 4 + 20, Basics.max Constants.itemHeight (Utils.getCanvasHeight settings items) * 4 + 50 )