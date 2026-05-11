package main

import (
	"embed"
	"io/fs"
)

//go:embed all:ui/dist
var uiDist embed.FS

func staticFS() fs.FS {
	sub, err := fs.Sub(uiDist, "ui/dist")
	if err != nil {
		panic(err)
	}
	return sub
}
