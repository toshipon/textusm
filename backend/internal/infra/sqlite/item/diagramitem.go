package item

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/harehare/textusm/internal/config"
	"github.com/harehare/textusm/internal/context/values"
	"github.com/harehare/textusm/internal/db/sqlite"
	"github.com/harehare/textusm/internal/domain/model/item/diagramitem"
	itemRepo "github.com/harehare/textusm/internal/domain/repository/item"
	db "github.com/harehare/textusm/internal/infra/sqlite"
	"github.com/samber/mo"
)

type SqliteItemRepository struct {
	_db *sqlite.Queries
}

func NewSqliteItemRepository(config *config.Config) itemRepo.ItemRepository {
	return &SqliteItemRepository{_db: sqlite.New(config.SqlConn)}
}

func (r *SqliteItemRepository) tx(ctx context.Context) *sqlite.Queries {
	tx := values.GetDBTx(ctx)

	if tx.IsPresent() {
		return r._db.WithTx(tx.MustGet())
	} else {
		return r._db
	}
}

func (r *SqliteItemRepository) FindByID(ctx context.Context, userID string, itemID string, isPublic bool) mo.Result[*diagramitem.DiagramItem] {
	i, err := r.tx(ctx).GetItem(ctx, sqlite.GetItemParams{
		Uid:       userID,
		DiagramID: itemID,
		Location:  "system",
	})

	if err != nil {
		return mo.Err[*diagramitem.DiagramItem](err)
	}

	var thumbnail mo.Option[string]

	if i.Thumbnail.Valid {
		thumbnail = mo.None[string]()
	} else {
		thumbnail = mo.Some[string](*&i.Thumbnail.String)
	}

	return diagramitem.New().
		WithID(i.DiagramID).
		WithTitle(i.Title.String).
		WithEncryptedText(i.Text).
		WithThumbnail(thumbnail).
		WithDiagramString(string(i.Diagram)).
		WithIsPublic(db.IntToBool(i.IsPublic)).
		WithIsBookmark(db.IntToBool(i.IsBookmark)).
		WithCreatedAt(db.IntToDateTime(i.CreatedAt)).
		WithUpdatedAt(db.IntToDateTime(i.UpdatedAt)).
		Build()
}

func (r *SqliteItemRepository) Find(ctx context.Context, userID string, offset, limit int, isPublic bool, isBookmark bool, shouldLoadText bool) mo.Result[[]*diagramitem.DiagramItem] {
	dbItems, err := r.tx(ctx).ListItems(ctx, sqlite.ListItemsParams{
		Uid:        userID,
		Location:   db.LocationSYSTEM,
		IsPublic:   db.BoolToInt(isPublic),
		IsBookmark: db.BoolToInt(isBookmark),
		Limit:      int64(limit),
		Offset:     int64(offset),
	})

	if err != nil {
		return mo.Err[[]*diagramitem.DiagramItem](err)
	}

	var items []*diagramitem.DiagramItem

	for _, i := range dbItems {
		var thumbnail mo.Option[string]

		if i.Thumbnail.Valid {
			thumbnail = mo.Some[string](*&i.Thumbnail.String)
		} else {
			thumbnail = mo.None[string]()
		}

		item := diagramitem.New().
			WithID(i.DiagramID).
			WithTitle(i.Title.String).
			WithEncryptedText(i.Text).
			WithThumbnail(thumbnail).
			WithDiagramString(string(i.Diagram)).
			WithIsPublic(i.IsPublic == 1).
			WithIsBookmark(i.IsBookmark == 1).
			WithCreatedAt(time.Unix(i.CreatedAt, 0)).
			WithUpdatedAt(time.Unix(i.UpdatedAt, 0)).
			Build()

		if item.IsError() {
			return mo.Err[[]*diagramitem.DiagramItem](item.Error())
		}

		items = append(items, item.MustGet())
	}

	return mo.Ok(items)
}

func (r *SqliteItemRepository) Save(ctx context.Context, userID string, item *diagramitem.DiagramItem, isPublic bool) mo.Result[*diagramitem.DiagramItem] {
	_, err := r.tx(ctx).GetItem(ctx, sqlite.GetItemParams{
		Uid:       userID,
		DiagramID: item.ID(),
		Location:  db.LocationSYSTEM,
	})

	isBookmark := item.IsBookmark()
	title := item.Title()

	if errors.Is(err, sql.ErrNoRows) {
		err := r.tx(ctx).CreateItem(ctx, sqlite.CreateItemParams{
			Uid:        userID,
			Diagram:    string(item.Diagram()),
			DiagramID:  item.ID(),
			IsBookmark: db.BoolToInt(isBookmark),
			IsPublic:   db.BoolToInt(isPublic),
			Title:      sql.NullString{String: title, Valid: true},
			Text:       item.Text(),
			Thumbnail:  db.StringToNullString(item.Thumbnail()),
			Location:   db.LocationSYSTEM,
			CreatedAt:  db.DateTimeToInt(time.Now()),
			UpdatedAt:  db.DateTimeToInt(time.Now()),
		})

		if err != nil {
			return mo.Err[*diagramitem.DiagramItem](err)
		}
	} else if err != nil {
		return mo.Err[*diagramitem.DiagramItem](err)
	} else {

		err := r.tx(ctx).UpdateItem(ctx, sqlite.UpdateItemParams{
			Uid:        userID,
			Diagram:    string(item.Diagram()),
			IsBookmark: db.BoolToInt(isBookmark),
			IsPublic:   db.BoolToInt(isPublic),
			Title:      sql.NullString{String: title, Valid: true},
			Text:       item.Text(),
			Thumbnail:  db.StringToNullString(item.Thumbnail()),
			DiagramID:  item.ID(),
			Location:   db.LocationSYSTEM,
			UpdatedAt:  db.DateTimeToInt(time.Now()),
		})

		if err != nil {
			return mo.Err[*diagramitem.DiagramItem](err)
		}
	}
	return mo.Ok(item)
}

func (r *SqliteItemRepository) Delete(ctx context.Context, userID string, itemID string, isPublic bool) mo.Result[bool] {
	err := r.tx(ctx).DeleteItem(ctx, sqlite.DeleteItemParams{
		Uid:       userID,
		DiagramID: itemID,
	})

	if err != nil {
		return mo.Err[bool](err)
	}

	return mo.Ok(true)
}
