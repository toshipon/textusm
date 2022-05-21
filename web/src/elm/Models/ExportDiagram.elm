module Models.ExportDiagram exposing (ExportDiagram(..), copy, copyable, download, downloadable)

import File.Download as Download
import Models.FileType as FileType exposing (FileType)
import Models.Title as Title exposing (Title)
import Ports


type ExportDiagram
    = Downloadable FileType
    | Copyable FileType


copy : ExportDiagram -> String -> Maybe (Cmd msg)
copy exportDiagram content =
    case exportDiagram of
        Downloadable _ ->
            Nothing

        Copyable _ ->
            Just <| Ports.copyText content


copyable : FileType -> ExportDiagram
copyable fileType =
    Copyable fileType


download : ExportDiagram -> Title -> String -> Maybe (Cmd msg)
download exportDiagram title content =
    case exportDiagram of
        Downloadable fileType ->
            Just <| Download.string (Title.toString title ++ FileType.extension fileType) "text/plain" content

        Copyable _ ->
            Nothing


downloadable : FileType -> ExportDiagram
downloadable fileType =
    Downloadable fileType
