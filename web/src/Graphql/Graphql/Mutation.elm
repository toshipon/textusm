-- Do not manually edit this file, it was auto-generated by dillonkearns/elm-graphql
-- https://github.com/dillonkearns/elm-graphql


module Graphql.Mutation exposing (..)

import Graphql.Enum.Diagram
import Graphql.InputObject
import Graphql.Internal.Builder.Argument as Argument
import Graphql.Internal.Builder.Object as Object
import Graphql.Internal.Encode as Encode
import Graphql.Object
import Graphql.Operation exposing (RootMutation)
import Graphql.OptionalArgument exposing (OptionalArgument(..))
import Graphql.Scalar
import Graphql.ScalarCodecs
import Graphql.SelectionSet exposing (SelectionSet)
import Json.Decode as D


{-|

  - itemID -
  - isBookmark -

-}
bookmark :
    BookmarkRequiredArguments
    -> SelectionSet decodesTo Graphql.Object.Item
    -> SelectionSet (Maybe decodesTo) RootMutation
bookmark requiredArgs____ object____ =
    Object.selectionForCompositeField "bookmark" [ Argument.required "itemID" requiredArgs____.itemID (Graphql.ScalarCodecs.codecs |> Graphql.Scalar.unwrapEncoder .codecId), Argument.required "isBookmark" requiredArgs____.isBookmark Encode.bool ] object____ D.nullable


type alias BookmarkRequiredArguments =
    { itemID : Graphql.ScalarCodecs.Id
    , isBookmark : Bool
    }


{-|

  - itemID -
  - isPublic -

-}
delete :
    (DeleteOptionalArguments -> DeleteOptionalArguments)
    -> DeleteRequiredArguments
    -> SelectionSet Graphql.ScalarCodecs.Id RootMutation
delete fillInOptionals____ requiredArgs____ =
    let
        filledInOptionals____ =
            fillInOptionals____ { isPublic = Absent }

        optionalArgs____ =
            [ Argument.optional "isPublic" filledInOptionals____.isPublic Encode.bool ]
                |> List.filterMap Basics.identity
    in
    Object.selectionForField "ScalarCodecs.Id" "delete" (optionalArgs____ ++ [ Argument.required "itemID" requiredArgs____.itemID (Graphql.ScalarCodecs.codecs |> Graphql.Scalar.unwrapEncoder .codecId) ]) (Graphql.ScalarCodecs.codecs |> Graphql.Scalar.unwrapCodecs |> .codecId |> .decoder)


{-|

  - gistID -

-}
deleteGist :
    DeleteGistRequiredArguments
    -> SelectionSet Graphql.ScalarCodecs.Id RootMutation
deleteGist requiredArgs____ =
    Object.selectionForField "ScalarCodecs.Id" "deleteGist" [ Argument.required "gistID" requiredArgs____.gistID (Graphql.ScalarCodecs.codecs |> Graphql.Scalar.unwrapEncoder .codecId) ] (Graphql.ScalarCodecs.codecs |> Graphql.Scalar.unwrapCodecs |> .codecId |> .decoder)


type alias DeleteGistRequiredArguments =
    { gistID : Graphql.ScalarCodecs.Id }


type alias DeleteOptionalArguments =
    { isPublic : OptionalArgument Bool }


type alias DeleteRequiredArguments =
    { itemID : Graphql.ScalarCodecs.Id }


{-|

  - input -
  - isPublic -

-}
save :
    (SaveOptionalArguments -> SaveOptionalArguments)
    -> SaveRequiredArguments
    -> SelectionSet decodesTo Graphql.Object.Item
    -> SelectionSet decodesTo RootMutation
save fillInOptionals____ requiredArgs____ object____ =
    let
        filledInOptionals____ =
            fillInOptionals____ { isPublic = Absent }

        optionalArgs____ =
            [ Argument.optional "isPublic" filledInOptionals____.isPublic Encode.bool ]
                |> List.filterMap Basics.identity
    in
    Object.selectionForCompositeField "save" (optionalArgs____ ++ [ Argument.required "input" requiredArgs____.input Graphql.InputObject.encodeInputItem ]) object____ Basics.identity


{-|

  - input -

-}
saveGist :
    SaveGistRequiredArguments
    -> SelectionSet decodesTo Graphql.Object.GistItem
    -> SelectionSet decodesTo RootMutation
saveGist requiredArgs____ object____ =
    Object.selectionForCompositeField "saveGist" [ Argument.required "input" requiredArgs____.input Graphql.InputObject.encodeInputGistItem ] object____ Basics.identity


type alias SaveGistRequiredArguments =
    { input : Graphql.InputObject.InputGistItem }


type alias SaveOptionalArguments =
    { isPublic : OptionalArgument Bool }


type alias SaveRequiredArguments =
    { input : Graphql.InputObject.InputItem }


{-|

  - diagram -
  - input -

-}
saveSettings :
    SaveSettingsRequiredArguments
    -> SelectionSet decodesTo Graphql.Object.Settings
    -> SelectionSet decodesTo RootMutation
saveSettings requiredArgs____ object____ =
    Object.selectionForCompositeField "saveSettings" [ Argument.required "diagram" requiredArgs____.diagram (Encode.enum Graphql.Enum.Diagram.toString), Argument.required "input" requiredArgs____.input Graphql.InputObject.encodeInputSettings ] object____ Basics.identity


type alias SaveSettingsRequiredArguments =
    { diagram : Graphql.Enum.Diagram.Diagram
    , input : Graphql.InputObject.InputSettings
    }


{-|

  - input -

-}
share :
    ShareRequiredArguments
    -> SelectionSet String RootMutation
share requiredArgs____ =
    Object.selectionForField "String" "share" [ Argument.required "input" requiredArgs____.input Graphql.InputObject.encodeInputShareItem ] D.string


type alias ShareRequiredArguments =
    { input : Graphql.InputObject.InputShareItem }
