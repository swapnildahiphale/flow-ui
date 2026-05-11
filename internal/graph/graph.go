package graph

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/swapnildahiphale/flow-ui/internal/db"
)

type Node struct {
	ID    string         `json:"id"`
	Type  string         `json:"type"`  // task | project | person | tag
	Label string         `json:"label"`
	Meta  map[string]any `json:"meta,omitempty"`
}

type Edge struct {
	Source string `json:"source"`
	Target string `json:"target"`
	Kind   string `json:"kind"` // membership | waiting | assignee | tag
}

type Graph struct {
	Nodes []Node `json:"nodes"`
	Edges []Edge `json:"edges"`
}

func Build(ctx context.Context, conn *sql.DB) (*Graph, error) {
	tasks, err := db.ListTasks(ctx, conn, db.TaskFilter{})
	if err != nil {
		return nil, err
	}
	projects, err := db.ListProjects(ctx, conn, false)
	if err != nil {
		return nil, err
	}

	g := &Graph{Nodes: []Node{}, Edges: []Edge{}}
	seen := map[string]bool{}

	add := func(n Node) {
		if seen[n.ID] {
			return
		}
		seen[n.ID] = true
		g.Nodes = append(g.Nodes, n)
	}

	for _, p := range projects {
		add(Node{ID: "project:" + p.Slug, Type: "project", Label: p.Slug,
			Meta: map[string]any{"name": p.Name, "priority": p.Priority}})
	}
	for _, t := range tasks {
		add(Node{ID: "task:" + t.Slug, Type: "task", Label: t.Slug,
			Meta: map[string]any{"name": t.Name, "status": t.Status, "priority": t.Priority, "stale": t.Stale}})
		if t.ProjectSlug != nil {
			add(Node{ID: "project:" + *t.ProjectSlug, Type: "project", Label: *t.ProjectSlug})
			g.Edges = append(g.Edges, Edge{Source: "task:" + t.Slug, Target: "project:" + *t.ProjectSlug, Kind: "membership"})
		}
		if t.WaitingOn != nil && *t.WaitingOn != "" {
			personID := "person:" + *t.WaitingOn
			add(Node{ID: personID, Type: "person", Label: *t.WaitingOn})
			g.Edges = append(g.Edges, Edge{Source: "task:" + t.Slug, Target: personID, Kind: "waiting"})
		}
		if t.Assignee != nil && *t.Assignee != "" {
			personID := "person:" + *t.Assignee
			add(Node{ID: personID, Type: "person", Label: *t.Assignee})
			g.Edges = append(g.Edges, Edge{Source: "task:" + t.Slug, Target: personID, Kind: "assignee"})
		}
		for _, tag := range t.Tags {
			tagID := "tag:" + tag
			add(Node{ID: tagID, Type: "tag", Label: "#" + tag})
			g.Edges = append(g.Edges, Edge{Source: "task:" + t.Slug, Target: tagID, Kind: "tag"})
		}
	}
	if len(g.Nodes) == 0 {
		return g, fmt.Errorf("graph empty (no tasks or projects)")
	}
	return g, nil
}
