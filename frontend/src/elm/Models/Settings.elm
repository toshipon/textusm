module Models.Settings exposing
    ( EditorSettings
    , Settings
    , activityBackgroundColor
    , activityColor
    , backgroundColor
    , decoder
    , defaultEditorSettings
    , defaultSettings
    , encoder
    , exportEncoder
    , font
    , fontSize
    , height
    , importDecoder
    , labelColor
    , lineColor
    , ofDiagramSettings
    , showLineNumber
    , storyBackgroundColor
    , storyColor
    , taskBackgroundColor
    , taskColor
    , textColor
    , toolbar
    , width
    , wordWrap
    , zoomControl
    )

import Json.Decode as D
import Json.Decode.Pipeline exposing (custom, hardcoded, optional, required)
import Json.Encode as E
import Json.Encode.Extra exposing (maybe)
import Models.Color as Color
import Models.Diagram.Item as DiagramItem exposing (DiagramItem)
import Models.Diagram.Location as DiagramLocation exposing (Location)
import Models.Diagram.Settings as DiagramSettings
import Models.Theme as Theme exposing (Theme)
import Monocle.Compose as Compose
import Monocle.Lens exposing (Lens)
import Monocle.Optional exposing (Optional)


type alias EditorSettings =
    { fontSize : Int
    , wordWrap : Bool
    , showLineNumber : Bool
    }


type alias Settings =
    { position : Maybe Int
    , font : String
    , diagramId : Maybe String
    , diagramSettings : DiagramSettings.Settings
    , text : Maybe String
    , title : Maybe String
    , editor : Maybe EditorSettings
    , diagram : Maybe DiagramItem
    , location : Maybe Location
    , theme : Maybe Theme
    }


defaultEditorSettings : Maybe EditorSettings -> EditorSettings
defaultEditorSettings settings =
    Maybe.withDefault
        { fontSize = 14
        , wordWrap = False
        , showLineNumber = True
        }
        settings


defaultSettings : Theme -> Settings
defaultSettings theme =
    { position = Just -10
    , font = "Nunito Sans"
    , diagramId = Nothing
    , diagramSettings =
        { font = "Nunito Sans"
        , size = { width = 140, height = 65 }
        , color =
            { activity =
                { color = Color.toString Color.white
                , backgroundColor = Color.toString Color.background1Defalut
                }
            , task =
                { color = Color.toString Color.white
                , backgroundColor = Color.toString Color.background2Defalut
                }
            , story =
                { color = Color.toString Color.gray
                , backgroundColor = Color.toString Color.white
                }
            , line = Color.toString Color.lineDefalut
            , label = Color.toString Color.labelDefalut
            , text = Just <| Color.toString Color.textDefalut
            }
        , backgroundColor =
            case theme of
                Theme.System True ->
                    Color.toString Color.backgroundDarkDefalut

                Theme.System False ->
                    Color.toString Color.backgroundDefalut

                Theme.Dark ->
                    Color.toString Color.backgroundDarkDefalut

                Theme.Light ->
                    Color.toString Color.backgroundDefalut
        , zoomControl = Just True
        , scale = Just 1.0
        , toolbar = Nothing
        }
    , text = Nothing
    , title = Nothing
    , editor = Nothing
    , diagram = Nothing
    , location = Nothing
    , theme = Nothing
    }


activityBackgroundColor : Lens Settings String
activityBackgroundColor =
    Compose.lensWithLens DiagramSettings.ofActivityBackgroundColor ofDiagramSettings


activityColor : Lens Settings String
activityColor =
    Compose.lensWithLens DiagramSettings.ofActivityColor ofDiagramSettings


backgroundColor : Lens Settings String
backgroundColor =
    Compose.lensWithLens DiagramSettings.ofBackgroundColor ofDiagramSettings


font : Lens Settings String
font =
    Compose.lensWithLens DiagramSettings.ofFont ofDiagramSettings


fontSize : Optional Settings Int
fontSize =
    Compose.optionalWithLens editorOfFontSize editorOfSettings


height : Lens Settings Int
height =
    Compose.lensWithLens DiagramSettings.ofHeight ofDiagramSettings


labelColor : Lens Settings String
labelColor =
    Compose.lensWithLens DiagramSettings.ofLabelColor ofDiagramSettings


lineColor : Lens Settings String
lineColor =
    Compose.lensWithLens DiagramSettings.ofLineColor ofDiagramSettings


showLineNumber : Optional Settings Bool
showLineNumber =
    Compose.optionalWithLens editorOfShowLineNumber editorOfSettings


storyBackgroundColor : Lens Settings String
storyBackgroundColor =
    Compose.lensWithLens DiagramSettings.ofStoryBackgroundColor ofDiagramSettings


storyColor : Lens Settings String
storyColor =
    Compose.lensWithLens DiagramSettings.ofStoryColor ofDiagramSettings


taskBackgroundColor : Lens Settings String
taskBackgroundColor =
    Compose.lensWithLens DiagramSettings.ofTaskBackgroundColor ofDiagramSettings


taskColor : Lens Settings String
taskColor =
    Compose.lensWithLens DiagramSettings.ofTaskColor ofDiagramSettings


textColor : Optional Settings String
textColor =
    Compose.lensWithOptional DiagramSettings.ofTextColor ofDiagramSettings


toolbar : Lens Settings (Maybe Bool)
toolbar =
    Compose.lensWithLens DiagramSettings.ofToolbar ofDiagramSettings


width : Lens Settings Int
width =
    Compose.lensWithLens DiagramSettings.ofWidth ofDiagramSettings


wordWrap : Optional Settings Bool
wordWrap =
    Compose.optionalWithLens editorOfWordWrap editorOfSettings


zoomControl : Lens Settings (Maybe Bool)
zoomControl =
    Compose.lensWithLens DiagramSettings.ofZoomControl ofDiagramSettings


decoder : D.Decoder Settings
decoder =
    D.succeed Settings
        |> optional "position" (D.map Just D.int) Nothing
        |> required "font" D.string
        |> optional "diagramId" (D.map Just D.string) Nothing
        |> custom (D.oneOf [ D.field "storyMap" diagramDecoder, D.field "diagramSettings" diagramDecoder ])
        |> optional "text" (D.map Just D.string) Nothing
        |> optional "title" (D.map Just D.string) Nothing
        |> optional "editor" (D.map Just editorSettingsDecoder) Nothing
        |> optional "diagram" (D.map Just DiagramItem.decoder) Nothing
        |> optional "location" (D.map Just DiagramLocation.decoder) (Just DiagramLocation.Remote)
        |> optional "theme" (D.map Just Theme.decoder) (Just <| Theme.System False)


encoder : Settings -> E.Value
encoder settings =
    E.object
        [ ( "position", maybe E.int settings.position )
        , ( "font", E.string settings.font )
        , ( "diagramId", maybe E.string settings.diagramId )
        , ( "diagramSettings", diagramEncoder settings.diagramSettings )
        , ( "text", maybe E.string settings.text )
        , ( "title", maybe E.string settings.title )
        , ( "editor", maybe editorSettingsEncoder settings.editor )
        , ( "diagram", maybe DiagramItem.encoder settings.diagram )
        , ( "location", maybe DiagramLocation.encoder settings.location )
        , ( "theme", maybe Theme.encoder settings.theme )
        ]


exportEncoder : Settings -> E.Value
exportEncoder settings =
    E.object
        [ ( "position", maybe E.int settings.position )
        , ( "font", E.string settings.font )
        , ( "diagramSettings", diagramEncoder settings.diagramSettings )
        , ( "editor", maybe editorSettingsEncoder settings.editor )
        , ( "location", maybe DiagramLocation.encoder settings.location )
        , ( "theme", maybe Theme.encoder settings.theme )
        ]


importDecoder : Settings -> D.Decoder Settings
importDecoder settings =
    D.succeed Settings
        |> optional "position" (D.map Just D.int) Nothing
        |> required "font" D.string
        |> hardcoded settings.diagramId
        |> custom (D.oneOf [ D.field "storyMap" diagramDecoder, D.field "diagramSettings" diagramDecoder ])
        |> hardcoded settings.text
        |> hardcoded settings.title
        |> optional "editor" (D.map Just editorSettingsDecoder) Nothing
        |> hardcoded settings.diagram
        |> optional "location" (D.map Just DiagramLocation.decoder) (Just DiagramLocation.Remote)
        |> optional "theme" (D.map Just Theme.decoder) (Just <| Theme.System False)


ofDiagramSettings : Lens Settings DiagramSettings.Settings
ofDiagramSettings =
    Lens .diagramSettings (\b a -> { a | diagramSettings = b })


colorDecoder : D.Decoder DiagramSettings.Color
colorDecoder =
    D.succeed DiagramSettings.Color
        |> required "color" D.string
        |> required "backgroundColor" D.string


colorEncoder : DiagramSettings.Color -> E.Value
colorEncoder color =
    E.object
        [ ( "color", E.string color.color )
        , ( "backgroundColor", E.string color.backgroundColor )
        ]


colorSettingsDecoder : D.Decoder DiagramSettings.ColorSettings
colorSettingsDecoder =
    D.succeed DiagramSettings.ColorSettings
        |> required "activity" colorDecoder
        |> required "task" colorDecoder
        |> required "story" colorDecoder
        |> required "line" D.string
        |> required "label" D.string
        |> optional "text" (D.map Just D.string) Nothing


colorSettingsEncoder : DiagramSettings.ColorSettings -> E.Value
colorSettingsEncoder colorSettings =
    E.object
        [ ( "activity", colorEncoder colorSettings.activity )
        , ( "task", colorEncoder colorSettings.task )
        , ( "story", colorEncoder colorSettings.story )
        , ( "line", E.string colorSettings.line )
        , ( "label", E.string colorSettings.label )
        , ( "text", maybe E.string colorSettings.text )
        ]


diagramDecoder : D.Decoder DiagramSettings.Settings
diagramDecoder =
    D.succeed DiagramSettings.Settings
        |> required "font" D.string
        |> required "size" sizeDecoder
        |> required "color" colorSettingsDecoder
        |> required "backgroundColor" D.string
        |> optional "zoomControl" (D.map Just D.bool) Nothing
        |> optional "scale" (D.map Just D.float) Nothing
        |> optional "toolbar" (D.map Just D.bool) Nothing


diagramEncoder : DiagramSettings.Settings -> E.Value
diagramEncoder settings =
    E.object
        [ ( "font", E.string settings.font )
        , ( "size", sizeEncoder settings.size )
        , ( "color", colorSettingsEncoder settings.color )
        , ( "backgroundColor", E.string settings.backgroundColor )
        , ( "zoomControl", maybe E.bool settings.zoomControl )
        , ( "scale", maybe E.float settings.scale )
        , ( "toolbar", maybe E.bool settings.toolbar )
        ]


editorOfFontSize : Lens EditorSettings Int
editorOfFontSize =
    Lens .fontSize (\b a -> { a | fontSize = b })


editorOfSettings : Optional Settings EditorSettings
editorOfSettings =
    Optional .editor (\b a -> { a | editor = Just b })


editorOfShowLineNumber : Lens EditorSettings Bool
editorOfShowLineNumber =
    Lens .showLineNumber (\b a -> { a | showLineNumber = b })


editorOfWordWrap : Lens EditorSettings Bool
editorOfWordWrap =
    Lens .wordWrap (\b a -> { a | wordWrap = b })


editorSettingsDecoder : D.Decoder EditorSettings
editorSettingsDecoder =
    D.succeed EditorSettings
        |> required "fontSize" D.int
        |> required "wordWrap" D.bool
        |> required "showLineNumber" D.bool


editorSettingsEncoder : EditorSettings -> E.Value
editorSettingsEncoder editorSettings =
    E.object
        [ ( "fontSize", E.int editorSettings.fontSize )
        , ( "wordWrap", E.bool editorSettings.wordWrap )
        , ( "showLineNumber", E.bool editorSettings.showLineNumber )
        ]


sizeDecoder : D.Decoder DiagramSettings.Size
sizeDecoder =
    D.succeed DiagramSettings.Size
        |> required "width" D.int
        |> required "height" D.int


sizeEncoder : DiagramSettings.Size -> E.Value
sizeEncoder size =
    E.object
        [ ( "width", E.int size.width )
        , ( "height", E.int size.height )
        ]
