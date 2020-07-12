-- Do not manually edit this file, it was auto-generated by dillonkearns/elm-graphql
-- https://github.com/dillonkearns/elm-graphql


module TextUSM.Mutation exposing (..)

import Graphql.Internal.Builder.Argument as Argument exposing (Argument)
import Graphql.Internal.Builder.Object as Object
import Graphql.Internal.Encode as Encode exposing (Value)
import Graphql.Operation exposing (RootMutation, RootQuery, RootSubscription)
import Graphql.OptionalArgument exposing (OptionalArgument(..))
import Graphql.SelectionSet exposing (SelectionSet)
import Json.Decode as Decode exposing (Decoder)
import TextUSM.InputObject
import TextUSM.Interface
import TextUSM.Object
import TextUSM.Scalar
import TextUSM.ScalarCodecs
import TextUSM.Union


type alias SaveRequiredArguments =
    { input : TextUSM.InputObject.InputItem }


{-|

  - input -

-}
save :
    SaveRequiredArguments
    -> SelectionSet decodesTo TextUSM.Object.Item
    -> SelectionSet decodesTo RootMutation
save requiredArgs object_ =
    Object.selectionForCompositeField "save" [ Argument.required "input" requiredArgs.input TextUSM.InputObject.encodeInputItem ] object_ identity


type alias DeleteRequiredArguments =
    { itemID : String }


{-|

  - itemID -

-}
delete :
    DeleteRequiredArguments
    -> SelectionSet decodesTo TextUSM.Object.Item
    -> SelectionSet (Maybe decodesTo) RootMutation
delete requiredArgs object_ =
    Object.selectionForCompositeField "delete" [ Argument.required "itemID" requiredArgs.itemID Encode.string ] object_ (identity >> Decode.nullable)


type alias BookmarkRequiredArguments =
    { itemID : String
    , isBookmark : Bool
    }


{-|

  - itemID -
  - isBookmark -

-}
bookmark :
    BookmarkRequiredArguments
    -> SelectionSet decodesTo TextUSM.Object.Item
    -> SelectionSet (Maybe decodesTo) RootMutation
bookmark requiredArgs object_ =
    Object.selectionForCompositeField "bookmark" [ Argument.required "itemID" requiredArgs.itemID Encode.string, Argument.required "isBookmark" requiredArgs.isBookmark Encode.bool ] object_ (identity >> Decode.nullable)
