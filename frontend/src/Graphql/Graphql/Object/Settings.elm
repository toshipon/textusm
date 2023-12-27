-- Do not manually edit this file, it was auto-generated by dillonkearns/elm-graphql
-- https://github.com/dillonkearns/elm-graphql


module Graphql.Object.Settings exposing (..)

import Graphql.InputObject
import Graphql.Interface
import Graphql.Internal.Builder.Argument as Argument exposing (Argument)
import Graphql.Internal.Builder.Object as Object
import Graphql.Internal.Encode as Encode exposing (Value)
import Graphql.Object
import Graphql.Operation exposing (RootMutation, RootQuery, RootSubscription)
import Graphql.OptionalArgument exposing (OptionalArgument(..))
import Graphql.Scalar
import Graphql.ScalarCodecs
import Graphql.SelectionSet exposing (SelectionSet)
import Graphql.Union
import Json.Decode as Decode


font : SelectionSet String Graphql.Object.Settings
font =
    Object.selectionForField "String" "font" [] Decode.string


width : SelectionSet Int Graphql.Object.Settings
width =
    Object.selectionForField "Int" "width" [] Decode.int


height : SelectionSet Int Graphql.Object.Settings
height =
    Object.selectionForField "Int" "height" [] Decode.int


backgroundColor : SelectionSet String Graphql.Object.Settings
backgroundColor =
    Object.selectionForField "String" "backgroundColor" [] Decode.string


activityColor :
    SelectionSet decodesTo Graphql.Object.Color
    -> SelectionSet decodesTo Graphql.Object.Settings
activityColor object____ =
    Object.selectionForCompositeField "activityColor" [] object____ Basics.identity


taskColor :
    SelectionSet decodesTo Graphql.Object.Color
    -> SelectionSet decodesTo Graphql.Object.Settings
taskColor object____ =
    Object.selectionForCompositeField "taskColor" [] object____ Basics.identity


storyColor :
    SelectionSet decodesTo Graphql.Object.Color
    -> SelectionSet decodesTo Graphql.Object.Settings
storyColor object____ =
    Object.selectionForCompositeField "storyColor" [] object____ Basics.identity


lineColor : SelectionSet String Graphql.Object.Settings
lineColor =
    Object.selectionForField "String" "lineColor" [] Decode.string


labelColor : SelectionSet String Graphql.Object.Settings
labelColor =
    Object.selectionForField "String" "labelColor" [] Decode.string


textColor : SelectionSet (Maybe String) Graphql.Object.Settings
textColor =
    Object.selectionForField "(Maybe String)" "textColor" [] (Decode.string |> Decode.nullable)


zoomControl : SelectionSet (Maybe Bool) Graphql.Object.Settings
zoomControl =
    Object.selectionForField "(Maybe Bool)" "zoomControl" [] (Decode.bool |> Decode.nullable)


scale : SelectionSet (Maybe Float) Graphql.Object.Settings
scale =
    Object.selectionForField "(Maybe Float)" "scale" [] (Decode.float |> Decode.nullable)


toolbar : SelectionSet (Maybe Bool) Graphql.Object.Settings
toolbar =
    Object.selectionForField "(Maybe Bool)" "toolbar" [] (Decode.bool |> Decode.nullable)


lockEditing : SelectionSet (Maybe Bool) Graphql.Object.Settings
lockEditing =
    Object.selectionForField "(Maybe Bool)" "lockEditing" [] (Decode.bool |> Decode.nullable)
