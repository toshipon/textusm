-- Do not manually edit this file, it was auto-generated by dillonkearns/elm-graphql
-- https://github.com/dillonkearns/elm-graphql


module Graphql.Object.Color exposing (..)

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


{-| -}
foregroundColor : SelectionSet String Graphql.Object.Color
foregroundColor =
    Object.selectionForField "String" "foregroundColor" [] Decode.string


{-| -}
backgroundColor : SelectionSet String Graphql.Object.Color
backgroundColor =
    Object.selectionForField "String" "backgroundColor" [] Decode.string
